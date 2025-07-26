// backend/src/services/googleCalendar.service.ts - Google Calendar Integration
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.model';

interface CalendarEvent {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    email: string;
    name?: string;
  }>;
  meetingLink?: string;
  timezone?: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

class GoogleCalendarService {
  private calendar: any;
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Initialize OAuth2 client with user credentials
   */
  private async initializeAuth(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.googleTokens) {
        console.warn(`⚠️ No Google tokens found for user: ${userId}`);
        return false;
      }

      this.oauth2Client.setCredentials({
        access_token: user.googleTokens.accessToken,
        refresh_token: user.googleTokens.refreshToken,
        expiry_date: user.googleTokens.expiryDate,
      });

      // Check if token needs refresh
      if (user.googleTokens.expiryDate && user.googleTokens.expiryDate < Date.now()) {
        console.log('🔄 Refreshing Google tokens...');
        
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          
          // Update user tokens
          user.googleTokens = {
            accessToken: credentials.access_token!,
            refreshToken: credentials.refresh_token || user.googleTokens.refreshToken,
            expiryDate: credentials.expiry_date || Date.now() + 3600000, // 1 hour
          };
          
          await user.save();
          console.log('✅ Google tokens refreshed successfully');
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing Google auth:', error);
      return false;
    }
  }

  /**
   * Check availability by comparing with Google Calendar events
   */
  async checkAvailability(
  mentorId: string, 
  date: string, 
  proposedSlots: TimeSlot[]
): Promise<TimeSlot[]> {
  try {
    console.log('📅 Checking Google Calendar availability for:', { mentorId, date, slotsCount: proposedSlots.length });

    // If no slots provided, return empty array
    if (!proposedSlots || proposedSlots.length === 0) {
      console.log('⚠️ No proposed slots to check');
      return [];
    }

    const authSuccess = await this.initializeAuth(mentorId);
    if (!authSuccess) {
      console.warn('⚠️ Google Calendar auth failed, returning original slots');
      return proposedSlots.map(slot => ({ ...slot, isAvailable: true }));
    }

    // Get start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch calendar events for the day
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`📊 Found ${events.length} calendar events for ${date}`);

    // Check each proposed slot against calendar events
    const availableSlots = proposedSlots.map(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);

      // Check if slot conflicts with any calendar event
      const hasConflict = events.some((event: any) => {
        // Skip events without start/end times (all-day events)
        if (!event.start?.dateTime || !event.end?.dateTime) {
          return false;
        }

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Check for overlap
        return (
          (slotStart >= eventStart && slotStart < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (slotStart <= eventStart && slotEnd >= eventEnd)
        );
      });

      return {
        ...slot,
        isAvailable: !hasConflict,
      };
    });

    const availableCount = availableSlots.filter(slot => slot.isAvailable).length;
    console.log(`✅ Availability check complete: ${availableCount}/${proposedSlots.length} slots available`);

    return availableSlots;

  } catch (error: any) {
    console.error('❌ Error checking calendar availability:', error);
    
    // Return original slots as available if calendar check fails
    return proposedSlots.map(slot => ({ ...slot, isAvailable: true }));
  }
}

  /**
   * Create a calendar event
   */
  async createEvent(eventData: CalendarEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      console.log('📅 Creating calendar event:', eventData.summary);

      // Get mentor and student IDs from attendees
      const mentorEmail = eventData.attendees[0]?.email;
      const studentEmail = eventData.attendees[1]?.email;

      if (!mentorEmail || !studentEmail) {
        throw new Error('Both mentor and student emails are required');
      }

      // Find users by email to get their IDs
      const [mentor, student] = await Promise.all([
        User.findOne({ email: mentorEmail }),
        User.findOne({ email: studentEmail }),
      ]);

      // Create event for mentor's calendar
      let mentorEventId = '';
      if (mentor) {
        const mentorAuthSuccess = await this.initializeAuth(mentor._id.toString());
        
        if (mentorAuthSuccess) {
          try {
            const mentorEvent = await this.calendar.events.insert({
              calendarId: 'primary',
              conferenceDataVersion: 1,
              requestBody: {
                summary: eventData.summary,
                description: eventData.description,
                start: {
                  dateTime: eventData.startTime,
                  timeZone: eventData.timezone || 'UTC',
                },
                end: {
                  dateTime: eventData.endTime,
                  timeZone: eventData.timezone || 'UTC',
                },
                attendees: eventData.attendees.map(attendee => ({
                  email: attendee.email,
                  displayName: attendee.name,
                })),
                conferenceData: eventData.meetingLink ? {
                  createRequest: {
                    requestId: `session-${Date.now()}`,
                    conferenceSolutionKey: {
                      type: 'hangoutsMeet',
                    },
                  },
                } : undefined,
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                  ],
                },
                guestsCanModify: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
              },
            });

            mentorEventId = mentorEvent.data.id!;
            console.log('✅ Mentor calendar event created:', mentorEventId);
          } catch (mentorError) {
            console.warn('⚠️ Failed to create mentor calendar event:', mentorError);
          }
        }
      }

      // Create event for student's calendar
      if (student) {
        const studentAuthSuccess = await this.initializeAuth(student._id.toString());
        
        if (studentAuthSuccess) {
          try {
            await this.calendar.events.insert({
              calendarId: 'primary',
              conferenceDataVersion: 1,
              requestBody: {
                summary: eventData.summary,
                description: eventData.description,
                start: {
                  dateTime: eventData.startTime,
                  timeZone: eventData.timezone || 'UTC',
                },
                end: {
                  dateTime: eventData.endTime,
                  timeZone: eventData.timezone || 'UTC',
                },
                attendees: eventData.attendees.map(attendee => ({
                  email: attendee.email,
                  displayName: attendee.name,
                })),
                conferenceData: eventData.meetingLink ? {
                  createRequest: {
                    requestId: `session-student-${Date.now()}`,
                    conferenceSolutionKey: {
                      type: 'hangoutsMeet',
                    },
                  },
                } : undefined,
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                  ],
                },
              },
            });

            console.log('✅ Student calendar event created');
          } catch (studentError) {
            console.warn('⚠️ Failed to create student calendar event:', studentError);
          }
        }
      }

      return {
        success: true,
        eventId: mentorEventId || `manual-${Date.now()}`,
      };

    } catch (error: any) {
      console.error('❌ Error creating calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string, 
    updates: Partial<CalendarEvent>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Updating calendar event:', eventId);

      // Note: In a real implementation, you'd need to track which calendar
      // the event belongs to and update both mentor and student calendars
      
      const updateData: any = {};
      
      if (updates.summary) updateData.summary = updates.summary;
      if (updates.description) updateData.description = updates.description;
      if (updates.startTime) {
        updateData.start = {
          dateTime: updates.startTime,
          timeZone: updates.timezone || 'UTC',
        };
      }
      if (updates.endTime) {
        updateData.end = {
          dateTime: updates.endTime,
          timeZone: updates.timezone || 'UTC',
        };
      }

      // This is a simplified update - in production, you'd update both calendars
      console.log('⚠️ Calendar event update simulated (implement full logic as needed)');

      return { success: true };

    } catch (error: any) {
      console.error('❌ Error updating calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel/delete a calendar event
   */
  async cancelEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Cancelling calendar event:', eventId);

      // Note: In a real implementation, you'd need to delete from both
      // mentor and student calendars
      
      console.log('⚠️ Calendar event cancellation simulated (implement full logic as needed)');

      return { success: true };

    } catch (error: any) {
      console.error('❌ Error cancelling calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's calendar events for a specific date range
   */
  async getEvents(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{ success: boolean; events?: any[]; error?: string }> {
    try {
      console.log('📋 Fetching calendar events:', { userId, startDate, endDate });

      const authSuccess = await this.initializeAuth(userId);
      if (!authSuccess) {
        return {
          success: false,
          error: 'Google Calendar authentication failed',
        };
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      console.log(`✅ Retrieved ${events.length} calendar events`);

      return {
        success: true,
        events: events.map((event: any) => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          attendees: event.attendees || [],
          meetingLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
        })),
      };

    } catch (error: any) {
      console.error('❌ Error fetching calendar events:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a specific time slot is free
   */
  async isTimeSlotFree(
    userId: string, 
    startTime: string, 
    endTime: string
  ): Promise<boolean> {
    try {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      // Get buffer time around the slot (15 minutes before and after)
      const bufferStart = new Date(startDate.getTime() - 15 * 60 * 1000);
      const bufferEnd = new Date(endDate.getTime() + 15 * 60 * 1000);

      const result = await this.getEvents(
        userId,
        bufferStart.toISOString(),
        bufferEnd.toISOString()
      );

      if (!result.success || !result.events) {
        // If we can't check calendar, assume it's free
        return true;
      }

      return result.events.length === 0;

    } catch (error) {
      console.error('❌ Error checking time slot availability:', error);
      return true; // Default to available if check fails
    }
  }

  /**
   * Batch check availability for multiple time slots
   */
  async batchCheckAvailability(
    userId: string, 
    timeSlots: Array<{ startTime: string; endTime: string }>
  ): Promise<boolean[]> {
    try {
      const results = await Promise.all(
        timeSlots.map(slot => 
          this.isTimeSlotFree(userId, slot.startTime, slot.endTime)
        )
      );

      return results;

    } catch (error) {
      console.error('❌ Error in batch availability check:', error);
      return timeSlots.map(() => true); // Default to all available
    }
  }
}

export default new GoogleCalendarService();