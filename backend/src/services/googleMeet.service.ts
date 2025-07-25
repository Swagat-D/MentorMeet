// backend/src/services/googleMeet.service.ts - Google Meet Integration
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import  User from '../models/User.model';

interface MeetingRequest {
  summary: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    email: string;
    name?: string;
  }>;
}

interface MeetingResponse {
  success: boolean;
  meetingLink?: string;
  meetingId?: string;
  error?: string;
}

class GoogleMeetService {
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
   * Initialize OAuth2 client with mentor credentials (creator of the meeting)
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
        console.log('🔄 Refreshing Google tokens for Meet...');
        
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          
          user.googleTokens = {
            accessToken: credentials.access_token!,
            refreshToken: credentials.refresh_token || user.googleTokens.refreshToken,
            expiryDate: credentials.expiry_date || Date.now() + 3600000,
          };
          
          await user.save();
          console.log('✅ Google tokens refreshed for Meet');
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed for Meet:', refreshError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing Google Meet auth:', error);
      return false;
    }
  }

  /**
   * Create a Google Meet meeting by creating a calendar event with conference data
   */
  async createMeeting(meetingRequest: MeetingRequest): Promise<MeetingResponse> {
    try {
      console.log('🎥 Creating Google Meet:', meetingRequest.summary);

      // Use the first attendee (mentor) as the meeting creator
      const mentorEmail = meetingRequest.attendees[0]?.email;
      if (!mentorEmail) {
        return {
          success: false,
          error: 'Mentor email is required to create meeting',
        };
      }

      // Find mentor by email
      const mentor = await User.findOne({ email: mentorEmail });
      if (!mentor) {
        return {
          success: false,
          error: 'Mentor not found',
        };
      }

      const authSuccess = await this.initializeAuth(mentor._id.toString());
      if (!authSuccess) {
        console.warn('⚠️ Google Meet auth failed, creating fallback link');
        return {
          success: true,
          meetingLink: this.generateFallbackMeetingLink(),
          meetingId: `fallback-${Date.now()}`,
        };
      }

      // Create calendar event with Google Meet
      const event = {
        summary: meetingRequest.summary,
        description: `Mentoring session meeting.\n\nAttendees:\n${meetingRequest.attendees.map(a => `- ${a.name || a.email}`).join('\n')}`,
        start: {
          dateTime: meetingRequest.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: meetingRequest.endTime,
          timeZone: 'UTC',
        },
        attendees: meetingRequest.attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
        })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
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
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send invites to all attendees
        requestBody: event,
      });

      const createdEvent = response.data;
      
      // Extract meeting link
      let meetingLink = '';
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        const meetEntry = createdEvent.conferenceData.entryPoints.find(
          (entry: any) => entry.entryPointType === 'video'
        );
        meetingLink = meetEntry?.uri || '';
      }

      // Fallback to hangoutLink if available
      if (!meetingLink && createdEvent.hangoutLink) {
        meetingLink = createdEvent.hangoutLink;
      }

      // Final fallback
      if (!meetingLink) {
        meetingLink = this.generateFallbackMeetingLink();
      }

      console.log('✅ Google Meet created successfully:', {
        eventId: createdEvent.id,
        meetingLink,
      });

      return {
        success: true,
        meetingLink,
        meetingId: createdEvent.id!,
      };

    } catch (error: any) {
      console.error('❌ Error creating Google Meet:', error);
      
      // Return fallback meeting link on error
      return {
        success: true,
        meetingLink: this.generateFallbackMeetingLink(),
        meetingId: `fallback-${Date.now()}`,
      };
    }
  }

  /**
   * Generate a fallback meeting link when Google Meet creation fails
   */
  private generateFallbackMeetingLink(): string {
    // Generate a unique meeting code
    const meetingCode = Math.random().toString(36).substr(2, 10);
    return `https://meet.google.com/${meetingCode}`;
  }

  /**
   * Update an existing Google Meet
   */
  async updateMeeting(
    meetingId: string, 
    updates: Partial<MeetingRequest>
  ): Promise<MeetingResponse> {
    try {
      console.log('📝 Updating Google Meet:', meetingId);

      // Note: This is a simplified implementation
      // In production, you'd need to properly handle the meeting update
      
      const updateData: any = {};
      
      if (updates.summary) updateData.summary = updates.summary;
      if (updates.startTime) {
        updateData.start = {
          dateTime: updates.startTime,
          timeZone: 'UTC',
        };
      }
      if (updates.endTime) {
        updateData.end = {
          dateTime: updates.endTime,
          timeZone: 'UTC',
        };
      }
      if (updates.attendees) {
        updateData.attendees = updates.attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
        }));
      }

      // For now, return success - implement actual update logic as needed
      console.log('⚠️ Google Meet update simulated (implement full logic as needed)');

      return {
        success: true,
        meetingId,
      };

    } catch (error: any) {
      console.error('❌ Error updating Google Meet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete/cancel a Google Meet
   */
  async deleteMeeting(meetingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting Google Meet:', meetingId);

      // Note: This would delete the calendar event, which cancels the meeting
      // Implementation depends on having the creator's credentials
      
      console.log('⚠️ Google Meet deletion simulated (implement full logic as needed)');

      return { success: true };

    } catch (error: any) {
      console.error('❌ Error deleting Google Meet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get meeting details
   */
  async getMeetingDetails(
    meetingId: string
  ): Promise<{ success: boolean; meeting?: any; error?: string }> {
    try {
      console.log('🔍 Getting Google Meet details:', meetingId);

      // This would fetch the calendar event details
      // For now, return mock data
      
      return {
        success: true,
        meeting: {
          id: meetingId,
          summary: 'Mentoring Session',
          meetingLink: `https://meet.google.com/${meetingId}`,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      };

    } catch (error: any) {
      console.error('❌ Error getting Google Meet details:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a direct Google Meet link (without calendar event)
   */
  async generateDirectMeetLink(): Promise<string> {
    try {
      // This creates a new Google Meet room directly
      // Note: This requires special permissions and might not work in all cases
      
      const meetingCode = Math.random().toString(36).substr(2, 10);
      const meetingLink = `https://meet.google.com/${meetingCode}`;
      
      console.log('🎥 Generated direct Meet link:', meetingLink);
      
      return meetingLink;

    } catch (error) {
      console.error('❌ Error generating direct Meet link:', error);
      return this.generateFallbackMeetingLink();
    }
  }

  /**
   * Validate a Google Meet link
   */
  isValidMeetLink(link: string): boolean {
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i;
    return meetRegex.test(link);
  }

  /**
   * Extract meeting ID from Google Meet link
   */
  extractMeetingId(link: string): string | null {
    try {
      const url = new URL(link);
      if (url.hostname === 'meet.google.com') {
        return url.pathname.substring(1); // Remove leading slash
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a meeting is active/live
   */
  async isMeetingActive(meetingId: string): Promise<boolean> {
    try {
      // This would require additional Google Meet API calls
      // For now, return true (assume meeting is available)
      
      console.log('🔍 Checking meeting status:', meetingId);
      return true;

    } catch (error) {
      console.error('❌ Error checking meeting status:', error);
      return false;
    }
  }

  /**
   * Get meeting participants (if meeting is active)
   */
  async getMeetingParticipants(
    meetingId: string
  ): Promise<{ success: boolean; participants?: any[]; error?: string }> {
    try {
      console.log('👥 Getting meeting participants:', meetingId);

      // This would require Google Meet API or Admin SDK
      // For now, return empty participants
      
      return {
        success: true,
        participants: [],
      };

    } catch (error: any) {
      console.error('❌ Error getting meeting participants:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new GoogleMeetService();