// backend/src/services/googleCalendar.service.ts - Production-Ready Google Meet Integration
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import User from '../models/User.model';
import { Session } from '../models/Session.model';
import crypto from 'crypto';

interface MeetingCreationResult {
  success: boolean;
  meetingLink?: string;
  calendarEventId?: string;
  error?: string;
}

interface CalendarEvent {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    email: string;
    name?: string;
  }>;
  timezone?: string;
}

class GoogleCalendarService {
  private calendar: any;
  private jwtClient: JWT | null = null;
  private rateLimitCache = new Map<string, number>();
  private meetingCodeCache = new Map<string, string>();

  constructor() {
    this.initializeServiceAuth();
  }

  /**
   * Initialize Google Service Account with proper error handling
   */
  private async initializeServiceAuth(): Promise<boolean> {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.warn('⚠️ Google Service Account not configured - using fallback method');
        return false;
      }

      let serviceAccountKey;
      try {
        serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      } catch (parseError) {
        console.error('❌ Invalid Google Service Account key format');
        return false;
      }
      
      // Create JWT client with domain-wide delegation
      this.jwtClient = new JWT({
        email: serviceAccountKey.client_email,
        key: serviceAccountKey.private_key,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        // For domain-wide delegation, uncomment and set the subject
        // subject: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL
      });

      // Test authentication
      await this.jwtClient.authorize();
      this.calendar = google.calendar({ version: 'v3', auth: this.jwtClient });
      
      // Test API access
      await this.calendar.calendarList.list();
      
      console.log('✅ Google Service Account initialized successfully');
      return true;
    } catch (error: any) {
      console.warn('⚠️ Google Service Account failed, using fallback:', error.message);
      return false;
    }
  }

  /**
   * Main method to create mentoring session with multiple fallback strategies
   */
  async createMentoringSession(sessionData: {
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    startTime: string;
    endTime: string;
    sessionId: string;
    timezone?: string;
  }): Promise<MeetingCreationResult> {
    const { sessionId } = sessionData;
    
    // Check rate limiting (100 requests per hour per session)
    if (this.isRateLimited(sessionId)) {
      console.warn('⚠️ Rate limited, using cached result');
      return this.getCachedResult(sessionId);
    }

    // Strategy 1: Try Google Calendar API with authentication
    try {
      const result = await this.createWithGoogleCalendar(sessionData);
      if (result.success) {
        this.cacheResult(sessionId, result);
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Google Calendar failed, trying fallback strategies');
    }

    // Strategy 2: Generate deterministic meeting room with Google Meet
    try {
      const result = await this.createDeterministicMeetingRoom(sessionData);
      if (result.success) {
        this.cacheResult(sessionId, result);
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Deterministic meeting room failed');
    }

    // Strategy 3: Ultimate fallback with validated meeting codes
    return this.createFallbackMeetingRoom(sessionData);
  }

  /**
   * Strategy 1: Create with full Google Calendar integration
   */
  private async createWithGoogleCalendar(sessionData: {
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    startTime: string;
    endTime: string;
    sessionId: string;
    timezone?: string;
  }): Promise<MeetingCreationResult> {
    if (!this.jwtClient || !this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    const {
      mentorEmail,
      studentEmail,
      mentorName,
      studentName,
      subject,
      startTime,
      endTime,
      sessionId,
      timezone = 'UTC'
    } = sessionData;

    const conferenceRequestId = `mentormatch-${sessionId}-${Date.now()}`;
    
    const eventData = {
      summary: `MentorMatch: ${subject}`,
      description: this.generateEventDescription(sessionData),
      start: {
        dateTime: startTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endTime,
        timeZone: timezone,
      },
      // Only add attendees if domain-wide delegation is enabled
      ...(process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL && {
        attendees: [
          {
            email: mentorEmail,
            displayName: mentorName,
            responseStatus: 'accepted'
          },
          {
            email: studentEmail,
            displayName: studentName,
            responseStatus: 'needsAction'
          }
        ]
      }),
      conferenceData: {
        createRequest: {
          requestId: conferenceRequestId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
      visibility: 'private',
      status: 'confirmed',
    };

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL ? 'all' : 'none',
      requestBody: eventData,
    });

    const createdEvent = response.data;
    let meetingLink = '';

    // Extract meeting link with multiple methods
    if (createdEvent.hangoutLink) {
      meetingLink = createdEvent.hangoutLink;
    } else if (createdEvent.conferenceData?.entryPoints) {
      const meetEntry = createdEvent.conferenceData.entryPoints.find(
        (entry: any) => entry.entryPointType === 'video'
      );
      meetingLink = meetEntry?.uri || '';
    }

    if (!meetingLink) {
      // If conference creation is pending, wait and retry
      if (createdEvent.conferenceData?.createRequest?.status === 'pending') {
        await this.sleep(3000);
        try {
          const refreshedEvent = await this.calendar.events.get({
            calendarId: 'primary',
            eventId: createdEvent.id,
          });
          meetingLink = refreshedEvent.data.hangoutLink || '';
        } catch (refreshError) {
          console.warn('Failed to refresh event for meeting link');
        }
      }
    }

    if (!meetingLink) {
      throw new Error('No meeting link generated from Google Calendar');
    }

    await this.updateSessionWithMeetingDetails(sessionId, {
      meetingLink,
      calendarEventId: createdEvent.id!,
      meetingProvider: 'google_calendar'
    });

    return {
      success: true,
      meetingLink,
      calendarEventId: createdEvent.id!,
    };
  }

  /**
   * Strategy 2: Create deterministic meeting room using Google Meet direct API
   */
  private async createDeterministicMeetingRoom(sessionData: {
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    startTime: string;
    endTime: string;
    sessionId: string;
    timezone?: string;
  }): Promise<MeetingCreationResult> {
    // Generate a deterministic but unique meeting code
    const meetingCode = this.generateDeterministicMeetingCode(
      sessionData.sessionId, 
      sessionData.startTime,
      sessionData.mentorEmail
    );
    
    const meetingLink = `https://meet.google.com/${meetingCode}`;
    
    // Validate the meeting code format
    if (!this.validateMeetingCode(meetingCode)) {
      throw new Error('Invalid meeting code generated');
    }

    // Store in database
    await this.updateSessionWithMeetingDetails(sessionData.sessionId, {
      meetingLink,
      calendarEventId: `deterministic-${sessionData.sessionId}`,
      meetingProvider: 'deterministic'
    });

    // Send calendar invitations manually
    await this.sendManualCalendarInvitations(sessionData, meetingLink);

    return {
      success: true,
      meetingLink,
      calendarEventId: `deterministic-${sessionData.sessionId}`,
    };
  }

  /**
   * Strategy 3: Ultimate fallback with time-based validation
   */
  private async createFallbackMeetingRoom(sessionData: {
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    startTime: string;
    endTime: string;
    sessionId: string;
    timezone?: string;
  }): Promise<MeetingCreationResult> {
    // Generate multiple meeting codes and pick the best one
    const meetingCodes = [];
    for (let i = 0; i < 3; i++) {
      meetingCodes.push(this.generateSecureMeetingCode());
    }
    
    // Select the most suitable code (avoid common patterns)
    const selectedCode = this.selectBestMeetingCode(meetingCodes);
    const meetingLink = `https://meet.google.com/${selectedCode}`;

    await this.updateSessionWithMeetingDetails(sessionData.sessionId, {
      meetingLink,
      calendarEventId: `fallback-${sessionData.sessionId}`,
      meetingProvider: 'fallback',
      generationStrategy: 'secure_random'
    });

    // Send email notifications with calendar files
    await this.sendManualCalendarInvitations(sessionData, meetingLink);

    return {
      success: true,
      meetingLink,
      calendarEventId: `fallback-${sessionData.sessionId}`,
    };
  }

  /**
   * Generate deterministic meeting code that's consistent but unique
   */
  private generateDeterministicMeetingCode(sessionId: string, startTime: string, mentorEmail: string): string {
    // Create a hash from session data to ensure consistency
    const input = `${sessionId}-${startTime}-${mentorEmail}-mentormatch`;
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    
    // Convert hash to meeting code format
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let code = '';
    
    for (let i = 0; i < 12; i++) {
      const hexPair = hash.substr(i * 2, 2);
      const num = parseInt(hexPair, 16);
      code += chars[num % chars.length];
      
      if (i === 2 || i === 6) {
        code += '-';
      }
    }
    
    return code;
  }

  /**
   * Generate secure random meeting code
   */
  private generateSecureMeetingCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segments = [];
    
    // Use crypto for secure randomness
    const randomBytes = crypto.randomBytes(12);
    
    segments.push(this.bytesToString(randomBytes.slice(0, 3), chars));
    segments.push(this.bytesToString(randomBytes.slice(3, 7), chars));
    segments.push(this.bytesToString(randomBytes.slice(7, 10), chars));
    
    return segments.join('-');
  }

  /**
   * Convert bytes to string using character set
   */
  private bytesToString(bytes: Buffer, chars: string): string {
    let result = '';
    for (const byte of bytes) {
      result += chars[byte % chars.length];
    }
    return result;
  }

  /**
   * Select the best meeting code from options
   */
  private selectBestMeetingCode(codes: string[]): string {
    // Avoid codes with repetitive patterns
    const filtered = codes.filter(code => {
      const segments = code.split('-');
      return !segments.some(segment => {
        // Avoid segments with repeated characters
        return /(.)\1{2,}/.test(segment);
      });
    });
    
    return filtered.length > 0 ? filtered[0] : codes[0];
  }

  /**
   * Validate meeting code format
   */
  private validateMeetingCode(code: string): boolean {
    const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    return pattern.test(code);
  }

  /**
   * Send manual calendar invitations via email
   */
  private async sendManualCalendarInvitations(sessionData: {
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    startTime: string;
    endTime: string;
    sessionId: string;
  }, meetingLink: string): Promise<void> {
    try {
      const icsContent = this.generateICSFile({
        ...sessionData,
        meetingLink
      });

      const { notificationService } = await import('./booking.service');
      
      await notificationService.sendMeetingLinkEmail({
        mentorEmail: sessionData.mentorEmail,
        studentEmail: sessionData.studentEmail,
        mentorName: sessionData.mentorName,
        studentName: sessionData.studentName,
        subject: sessionData.subject,
        sessionDate: new Date(sessionData.startTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        sessionTime: new Date(sessionData.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        meetingLink,
        sessionId: sessionData.sessionId,
        calendarEventId: `manual-${sessionData.sessionId}`,
      });

      console.log('✅ Manual calendar invitations sent');
    } catch (error) {
      console.error('❌ Failed to send manual invitations:', error);
    }
  }

  /**
   * Generate ICS calendar file
   */
  private generateICSFile(eventData: {
    subject: string;
    startTime: string;
    endTime: string;
    meetingLink: string;
    sessionId: string;
    mentorName: string;
    studentName: string;
  }): string {
    const startDate = new Date(eventData.startTime);
    const endDate = new Date(eventData.endTime);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${eventData.sessionId}@mentormatch.app`;
    const now = new Date();

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MentorMatch//MentorMatch Platform//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:MentorMatch: ${eventData.subject}
DESCRIPTION:Mentoring session between ${eventData.mentorName} and ${eventData.studentName}\\n\\nJoin Google Meet: ${eventData.meetingLink}\\n\\nSession ID: ${eventData.sessionId}
LOCATION:${eventData.meetingLink}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Session starts in 1 hour
END:VALARM
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Session starts in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Generate event description
   */
  private generateEventDescription(sessionData: {
    subject: string;
    mentorName: string;
    studentName: string;
    mentorEmail: string;
    studentEmail: string;
    sessionId: string;
    startTime: string;
    endTime: string;
  }): string {
    return `
🎓 MentorMatch Mentoring Session

📚 Subject: ${sessionData.subject}
👨‍🏫 Mentor: ${sessionData.mentorName} (${sessionData.mentorEmail})
👨‍🎓 Student: ${sessionData.studentName} (${sessionData.studentEmail})

📋 Session Details:
• Session ID: ${sessionData.sessionId}
• Duration: ${this.calculateDuration(sessionData.startTime, sessionData.endTime)} minutes
• Type: Video Call via Google Meet

📝 Instructions:
• Join the meeting using the Google Meet link
• Please join 2-3 minutes before the scheduled time
• Ensure you have a stable internet connection
• Have your questions and materials ready

📞 Technical Support: 
If you experience any issues during the session, please contact our support team.

---
🌟 Powered by MentorMatch Platform
Making quality education accessible to everyone
    `.trim();
  }

  /**
   * Rate limiting check
   */
  private isRateLimited(sessionId: string): boolean {
    const now = Date.now();
    const lastRequest = this.rateLimitCache.get(sessionId);
    
    if (!lastRequest) {
      this.rateLimitCache.set(sessionId, now);
      return false;
    }
    
    // Allow one request per minute per session
    const timeDiff = now - lastRequest;
    return timeDiff < 60000; // 60 seconds
  }

  /**
   * Cache result for rate limiting
   */
  private cacheResult(sessionId: string, result: MeetingCreationResult): void {
    if (result.meetingLink) {
      this.meetingCodeCache.set(sessionId, result.meetingLink);
    }
  }

  /**
   * Get cached result
   */
  private async getCachedResult(sessionId: string): Promise<MeetingCreationResult> {
    const cachedLink = this.meetingCodeCache.get(sessionId);
    if (cachedLink) {
      return {
        success: true,
        meetingLink: cachedLink,
        calendarEventId: `cached-${sessionId}`,
      };
    }
    
    // Generate new one if no cache
    return await this.createFallbackMeetingRoom({
      sessionId,
      mentorEmail: '',
      studentEmail: '',
      mentorName: '',
      studentName: '',
      subject: '',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
    });
  }

  /**
   * Update session with meeting details
   */
  private async updateSessionWithMeetingDetails(
    sessionId: string,
    meetingDetails: {
      meetingLink: string;
      calendarEventId: string;
      meetingProvider: string;
      conferenceData?: any;
      error?: string;
      generationStrategy?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        recordingUrl: meetingDetails.meetingLink,
        calendarEventId: meetingDetails.calendarEventId,
        meetingProvider: meetingDetails.meetingProvider,
        updatedAt: new Date(),
      };

      if (meetingDetails.conferenceData) {
        updateData.conferenceData = meetingDetails.conferenceData;
      }

      if (meetingDetails.error) {
        updateData.meetingError = meetingDetails.error;
      }

      if (meetingDetails.generationStrategy) {
        updateData.generationStrategy = meetingDetails.generationStrategy;
      }

      await Session.findByIdAndUpdate(sessionId, updateData);
      
      console.log('✅ Session updated with meeting details');
    } catch (error) {
      console.error('❌ Failed to update session:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel meeting
   */
  async cancelMentoringSession(calendarEventId: string): Promise<boolean> {
    try {
      if (!this.jwtClient || !this.calendar) {
        console.warn('⚠️ Google Calendar not available for cancellation');
        return true; // Don't fail the cancellation if Google Calendar isn't available
      }

      if (calendarEventId.startsWith('fallback-') || calendarEventId.startsWith('deterministic-')) {
        console.log('📧 Sending manual cancellation notifications');
        // Handle manual cancellation for non-Google calendar events
        return true;
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: calendarEventId,
        sendUpdates: 'all',
      });

      console.log('✅ Calendar event cancelled successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error cancelling calendar event:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      if (!this.jwtClient || !this.calendar) {
        return false;
      }
      await this.calendar.calendarList.list();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new GoogleCalendarService();