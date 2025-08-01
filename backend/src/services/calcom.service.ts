// backend/src/services/calcom.service.ts - Cal.com Integration Service
import axios from 'axios';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import MentorProfileService from './mentorProfile.service';

interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  eventName?: string;
  link: string;
}

interface CalComBooking {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: Array<{
    email: string;
    name: string;
  }>;
  metadata?: any;
  meetingUrl?: string;
}

interface CalComAvailability {
  date: string;
  slots: Array<{
    time: string;
    attendees?: number;
    bookingUid?: string;
  }>;
}

class CalComService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
  // Load environment variables directly
  this.apiKey = process.env.CALCOM_API_KEY || '';
  this.baseUrl = process.env.CALCOM_API_URL || 'https://api.cal.com/v1';
  
  // Enhanced debug logging
  console.log('🔧 Cal.com Service Initialization:', {
    hasApiKey: !!this.apiKey,
    apiKeyLength: this.apiKey?.length || 0,
    apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 12)}...` : 'NOT SET',
    baseUrl: this.baseUrl,
    nodeEnv: process.env.NODE_ENV,
    // Test if we can actually use the key
    keyValidFormat: this.apiKey.startsWith('cal_') && this.apiKey.length > 20
  });
  
  if (!this.apiKey) {
    console.warn('⚠️ Cal.com API key not configured - Cal.com features will be disabled');
    console.warn('📋 Available Cal.com related env vars:', 
      Object.keys(process.env).filter(key => key.toLowerCase().includes('cal'))
    );
  } else if (!this.apiKey.startsWith('cal_')) {
    console.warn('⚠️ Cal.com API key format looks incorrect - should start with "cal_"');
  }
}
  private getHeaders() {
  console.log('🔧 Cal.com Headers Debug:', {
    hasApiKey: !!this.apiKey,
    apiKeyLength: this.apiKey?.length || 0,
    apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 15)}...` : 'NOT SET',
    apiKeyFormat: this.apiKey ? {
      startsWithCal: this.apiKey.startsWith('cal_'),
      hasUnderscore: this.apiKey.includes('_'),
      totalLength: this.apiKey.length
    } : null
  });

  if (!this.apiKey) {
    throw new Error('Cal.com API key not configured');
  }

  // Ensure clean API key (no whitespace)
  const cleanApiKey = this.apiKey.trim();

  const headers = {
    'Authorization': `Bearer ${cleanApiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'MentorMatch/1.0'
  };

  console.log('📡 Final headers being sent:', {
    hasAuth: !!headers.Authorization,
    authPreview: headers.Authorization.substring(0, 20) + '...',
    contentType: headers['Content-Type']
  });

  return headers;
}

  /**
 * Create or update mentor's event type in Cal.com
 */
async createMentorEventType(mentorId: string): Promise<CalComEventType | null> {
  try {
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    // Check if event type already exists
    const existingEventType = await this.getMentorEventType(mentorId);
    if (existingEventType) {
      console.log('✅ Cal.com event type already exists:', existingEventType.id);
      return existingEventType;
    }

    const sessionLength = parseInt(mentorProfile.preferences?.sessionLength?.replace(' minutes', '') || '60');
    const hourlyRate = mentorProfile.pricing?.hourlyRate || 75;

    const eventTypeData = {
      title: `Mentoring Session with ${mentorProfile.displayName}`,
      slug: `mentor-${mentorId}`,
      length: sessionLength,
      description: `Professional mentoring session with ${mentorProfile.displayName}. 
      
Expertise: ${mentorProfile.expertise?.join(', ') || 'General Mentoring'}
Subjects: ${mentorProfile.subjects?.map((s: string | { name: string }) => typeof s === 'string' ? s : s.name).join(', ') || 'Various Topics'}

This is a one-on-one mentoring session focused on your learning goals and questions.`,
      
      // Pricing configuration
      price: hourlyRate,
      currency: mentorProfile.pricing?.currency || 'USD',
      
      // Meeting configuration
      locations: [
        {
          type: 'integrations:google:meet',
          displayLocationPublicly: true
        }
      ],
      
      // Booking settings
      schedulingType: 'ROUND_ROBIN',
      requiresConfirmation: false,
      disableGuests: true,
      
      // Email and notification settings
      successRedirectUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/booking-success` : undefined,
      
      // Custom fields for booking
      bookingFields: [
        {
          name: 'subject',
          type: 'text',
          label: 'Session Topic/Subject',
          required: true,
          placeholder: 'What would you like to focus on in this session?'
        },
        {
          name: 'experience_level',
          type: 'select',
          label: 'Your Experience Level',
          required: true,
          options: ['Beginner', 'Intermediate', 'Advanced']
        },
        {
          name: 'specific_questions',
          type: 'textarea',
          label: 'Specific Questions or Goals',
          required: false,
          placeholder: 'Any specific questions or learning goals for this session?'
        }
      ],
      
      // Metadata
      metadata: {
        mentorId,
        mentorName: mentorProfile.displayName,
        subjects: mentorProfile.subjects,
        expertise: mentorProfile.expertise,
        platform: 'MentorMatch',
        sessionType: 'mentoring'
      },
    };

    console.log('📝 Creating Cal.com event type:', {
      title: eventTypeData.title,
      length: eventTypeData.length,
      price: eventTypeData.price
    });

    const response = await axios.post(
      `${this.baseUrl}/event-types`,
      eventTypeData,
      { headers: this.getHeaders() }
    );

    console.log('✅ Cal.com event type created successfully:', response.data.id);
    return response.data;

  } catch (error: any) {
    console.error('❌ Error creating Cal.com event type:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return null;
  }
}

  /**
 * Get available slots for a mentor on a specific date
 */
async getAvailableSlots(mentorId: string, date: string): Promise<any[]> {
  try {
    console.log('📅 Fetching available slots from Cal.com:', { mentorId, date });

    if (!this.apiKey) {
      console.log('⚠️ Cal.com API key not configured, skipping Cal.com integration');
      return this.generateSlotsFromMentorSchedule(mentorId, date);
    }

    // Get mentor's event type
    const eventType = await this.getMentorEventType(mentorId);
    if (!eventType) {
      console.log('⚠️ No Cal.com event type found for mentor, creating one...');
      const newEventType = await this.createMentorEventType(mentorId);
      if (!newEventType) {
        console.log('❌ Failed to create Cal.com event type, falling back to local generation');
        return this.generateSlotsFromMentorSchedule(mentorId, date);
      }
      // Use the newly created event type
      return this.fetchAvailabilityFromCalCom(newEventType.id, date, mentorId);
    }

    return this.fetchAvailabilityFromCalCom(eventType.id, date, mentorId);

  } catch (error: any) {
    console.error('❌ Error fetching Cal.com availability:', error.message);
    
    // Fallback: Generate slots from mentor's weekly schedule
    return this.generateSlotsFromMentorSchedule(mentorId, date);
  }
}

/**
 * Fetch availability from Cal.com API
 */
private async fetchAvailabilityFromCalCom(eventTypeId: number, date: string, mentorId: string): Promise<any[]> {
  try {
    const headers = this.getHeaders();
    
    // Get availability for the date
    const response = await axios.get(
      `${this.baseUrl}/availability?dateFrom=${date}&dateTo=${date}&eventTypeId=${eventTypeId}`,
      { 
        headers,
        timeout: 10000
      }
    );

    console.log('📅 Cal.com availability response:', {
      status: response.status,
      hasData: !!response.data
    });

    const availability: CalComAvailability[] = response.data || [];
    const dayAvailability = availability.find(day => day.date === date);

    if (!dayAvailability || !dayAvailability.slots.length) {
      console.log('📅 No Cal.com availability found for date:', date);
      return [];
    }

    // Convert Cal.com slots to our format
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    const hourlyRate = mentorProfile?.pricing?.hourlyRate || 75;
    const sessionLength = parseInt(mentorProfile?.preferences?.sessionLength?.replace(' minutes', '') || '60');

    const slots = dayAvailability.slots.map((slot, index) => {
      const startTime = new Date(`${date}T${slot.time}`);
      const endTime = new Date(startTime.getTime() + (sessionLength * 60 * 1000));

      return {
        id: `calcom-${mentorId}-${startTime.getTime()}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        date,
        isAvailable: true,
        price: hourlyRate,
        duration: sessionLength,
        sessionType: 'video' as const,
        calcomSlotTime: slot.time,
        eventTypeId: eventTypeId,
      };
    });

    console.log(`✅ Found ${slots.length} available slots from Cal.com`);
    return slots;

  } catch (error: any) {
    console.error('❌ Error fetching Cal.com availability:', error.message);
    throw error;
  }
}


  /**
 * Create a booking via Cal.com with proper mentoring session details
 */
async createBooking(bookingData: {
  mentorId: string;
  studentId: string;
  timeSlot: any;
  subject: string;
  notes?: string;
  studentEmail: string;
  studentName: string;
  mentorEmail: string;
  mentorName: string;
}): Promise<{ success: boolean; booking?: CalComBooking; meetingUrl?: string; error?: string }> {
  try {
    console.log('📝 Creating Cal.com mentoring session booking:', {
      mentor: bookingData.mentorName,
      student: bookingData.studentName,
      subject: bookingData.subject,
      time: bookingData.timeSlot.startTime
    });

    const eventType = await this.getMentorEventType(bookingData.mentorId);
    if (!eventType) {
      throw new Error('Event type not found for mentor - please set up Cal.com integration first');
    }

    const bookingPayload = {
      eventTypeId: eventType.id,
      start: bookingData.timeSlot.startTime,
      end: bookingData.timeSlot.endTime,
      
      // Attendee information
      name: bookingData.studentName,
      email: bookingData.studentEmail,
      
      // Meeting details
      title: `Mentoring: ${bookingData.subject}`,
      notes: `Mentoring Session: ${bookingData.subject}

👨‍🏫 Mentor: ${bookingData.mentorName}
👨‍🎓 Student: ${bookingData.studentName}
⏰ Duration: ${bookingData.timeSlot.duration} minutes

${bookingData.notes ? `Student Notes: ${bookingData.notes}` : ''}

This is a professional mentoring session via MentorMatch platform.`,
      
      // Responses for custom fields if your event type has them
      responses: {
        subject: bookingData.subject,
        notes: bookingData.notes || '',
        platform: 'MentorMatch'
      },
      
      // Metadata for tracking
      metadata: {
        mentorId: bookingData.mentorId,
        studentId: bookingData.studentId,
        subject: bookingData.subject,
        sessionType: 'mentoring',
        platform: 'MentorMatch'
      },
      
      // Timezone
      timeZone: 'UTC',
      language: 'en'
    };

    console.log('📡 Sending booking request to Cal.com...');

    const response = await axios.post(
      `${this.baseUrl}/bookings`,
      bookingPayload,
      { 
        headers: this.getHeaders(),
        timeout: 15000
      }
    );

    const booking = response.data;

    console.log('✅ Cal.com booking response:', {
      bookingId: booking.id,
      status: booking.status,
      hasAttendees: !!booking.attendees?.length,
      hasMeetingUrl: !!booking.meetingUrl,
      hasReferences: !!booking.references?.length
    });

    // Extract Google Meet URL from Cal.com response
    let meetingUrl = null;

    // Method 1: Direct meetingUrl from booking
    if (booking.meetingUrl) {
      meetingUrl = booking.meetingUrl;
      console.log('✅ Meeting URL found in booking.meetingUrl');
    }

    // Method 2: Check in references (Cal.com often puts it here)
    if (!meetingUrl && booking.references && Array.isArray(booking.references)) {
      const meetingRef = booking.references.find((ref: any) => 
        ref.type === 'google_calendar' || 
        ref.type === 'google_meet' ||
        ref.meetingUrl ||
        (ref.uid && ref.uid.includes('meet.google.com'))
      );
      
      if (meetingRef) {
        meetingUrl = meetingRef.meetingUrl || meetingRef.uid;
        console.log('✅ Meeting URL found in references');
      }
    }

    // Method 3: Check in location field
    if (!meetingUrl && booking.location) {
      if (booking.location.includes('meet.google.com')) {
        meetingUrl = booking.location;
        console.log('✅ Meeting URL found in location field');
      }
    }

    // Method 4: Check in attendees data
    if (!meetingUrl && booking.attendees && Array.isArray(booking.attendees)) {
      booking.attendees.forEach((attendee: any) => {
        if (attendee.bookingReference && attendee.bookingReference.meetingUrl) {
          meetingUrl = attendee.bookingReference.meetingUrl;
          console.log('✅ Meeting URL found in attendee reference');
        }
      });
    }

    console.log('🔍 Meeting URL extraction result:', {
      found: !!meetingUrl,
      url: meetingUrl ? meetingUrl.substring(0, 30) + '...' : 'NOT FOUND'
    });

    // If Cal.com didn't provide a meeting URL, this means the integration isn't set up correctly
    if (!meetingUrl) {
      console.warn('⚠️ Cal.com did not provide a Google Meet URL - integration may not be configured properly');
      console.warn('📋 Full booking response for debugging:', JSON.stringify(booking, null, 2));
      
      // Don't generate random URL - throw error instead
      throw new Error('Cal.com booking created but no meeting URL was provided. Please check your Cal.com Google Meet integration.');
    }

    return {
      success: true,
      booking,
      meetingUrl,
    };

  } catch (error: any) {
    console.error('❌ Cal.com booking creation failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Booking creation failed',
    };
  }
}

  /**
   * Cancel a Cal.com booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    try {
      console.log('❌ Cancelling Cal.com booking:', bookingId);

      await axios.delete(
        `${this.baseUrl}/bookings/${bookingId}`,
        { 
          headers: this.getHeaders(),
          data: { reason: reason || 'Cancelled by user' }
        }
      );

      console.log('✅ Cal.com booking cancelled successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Cal.com booking cancellation failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Reschedule a Cal.com booking
   */
  async rescheduleBooking(bookingId: string, newStartTime: string, newEndTime: string): Promise<boolean> {
    try {
      console.log('🔄 Rescheduling Cal.com booking:', { bookingId, newStartTime });

      const response = await axios.patch(
        `${this.baseUrl}/bookings/${bookingId}`,
        {
          start: newStartTime,
          end: newEndTime,
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Cal.com booking rescheduled successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Cal.com booking reschedule failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
 * Get mentor's event type from Cal.com
 */
private async getMentorEventType(mentorId: string): Promise<CalComEventType | null> {
  try {
    console.log('🔍 Fetching Cal.com event types for mentor:', mentorId);
    
    if (!this.apiKey) {
      throw new Error('Cal.com API key not configured');
    }

    const headers = this.getHeaders();

    console.log('📡 Making Cal.com API request:', {
      url: `${this.baseUrl}/event-types`,
      method: 'GET',
      hasAuthHeader: !!headers.Authorization
    });

    const response = await axios.get(
      `${this.baseUrl}/event-types`,
      { 
        headers,
        timeout: 15000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      }
    );

    console.log('📡 Cal.com event types response:', {
      status: response.status,
      statusText: response.statusText,
      eventTypesCount: Array.isArray(response.data) ? response.data.length : 'Not an array',
      hasData: !!response.data
    });

    // Handle different response formats
    if (response.status === 401) {
      console.error('❌ Cal.com API returned 401 - API key is invalid or expired');
      throw new Error('Cal.com API authentication failed. Please check your API key.');
    }

    if (response.status !== 200) {
      console.error('❌ Cal.com API returned non-200 status:', response.status, response.data);
      throw new Error(`Cal.com API returned status ${response.status}`);
    }

    // Handle different response structures
    let eventTypes = [];
    if (Array.isArray(response.data)) {
      eventTypes = response.data;
    } else if (response.data && Array.isArray(response.data.event_types)) {
      eventTypes = response.data.event_types;
    } else if (response.data && Array.isArray(response.data.eventTypes)) {
      eventTypes = response.data.eventTypes;
    } else {
      console.warn('⚠️ Unexpected Cal.com response format:', response.data);
      eventTypes = [];
    }

    const mentorEventType = eventTypes.find((et: CalComEventType) => et.slug === `mentor-${mentorId}`);
    
    console.log('🔍 Looking for event type with slug:', `mentor-${mentorId}`);
    console.log('📋 Available event types:', eventTypes.map((et: CalComEventType) => ({ id: et.id, slug: et.slug, title: et.title })));
    console.log('📋 Found mentor event type:', !!mentorEventType);
    
    return mentorEventType || null;

  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Cal.com API timeout');
    } else if (error.response) {
      console.error('❌ Cal.com API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('❌ Cal.com API network error:', error.message);
    } else {
      console.error('❌ Cal.com API unknown error:', error.message);
    }
    
    throw error;
  }
}

  /**
   * Get mentor profile from database (using service)
   */
  private async getMentorProfile(mentorId: string): Promise<any> {
    return await MentorProfileService.findMentorProfile(mentorId);
  }

  /**
   * Fallback: Generate slots from mentor's weekly schedule
   */
  private async generateSlotsFromMentorSchedule(mentorId: string, date: string): Promise<any[]> {
    try {
      console.log('🔄 Falling back to mentor schedule generation');
      
      const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
      if (!mentorProfile?.weeklySchedule) {
        return [];
      }

      const requestedDate = new Date(date);
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule = mentorProfile.weeklySchedule[dayName];

      if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length === 0) {
        return [];
      }

      const slots: any[] = [];
      const now = new Date();
      const hourlyRate = mentorProfile.pricing?.hourlyRate || 75;
      const sessionLength = parseInt(mentorProfile.preferences?.sessionLength?.replace(' minutes', '') || '60');

      for (const block of daySchedule) {
        if (!block.isAvailable) continue;

        const [startHour, startMinute] = block.startTime.split(':').map(Number);
        const [endHour, endMinute] = block.endTime.split(':').map(Number);

        const blockStart = new Date(requestedDate);
        blockStart.setHours(startHour, startMinute, 0, 0);

        const blockEnd = new Date(requestedDate);
        blockEnd.setHours(endHour, endMinute, 0, 0);

        let currentTime = new Date(blockStart);

        while (currentTime.getTime() + (sessionLength * 60 * 1000) <= blockEnd.getTime()) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + (sessionLength * 60 * 1000));

          // Skip past slots
          if (slotStart <= new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
            currentTime = new Date(currentTime.getTime() + (sessionLength * 60 * 1000));
            continue;
          }

          slots.push({
            id: `fallback-${mentorId}-${slotStart.getTime()}`,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            date,
            isAvailable: true,
            price: hourlyRate,
            duration: sessionLength,
            sessionType: 'video' as const,
          });

          currentTime = new Date(currentTime.getTime() + (sessionLength * 60 * 1000));
        }
      }

      return slots;

    } catch (error) {
      console.error('❌ Error generating fallback slots:', error);
      return [];
    }
  }

  /**
   * Generate meeting URL for booking
   */
  private generateMeetingUrl(bookingId: number | string): string {
    return `https://meet.google.com/${this.generateMeetingCode()}-${bookingId}`;
  }

  /**
   * Generate meeting code
   */
  private generateMeetingCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 2 || i === 6) code += '-';
    }
    return code;
  }

  /**
   * Sync mentor availability with Cal.com
   */
  async syncMentorAvailability(mentorId: string): Promise<boolean> {
    try {
      console.log('🔄 Syncing mentor availability with Cal.com');

      const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
      if (!mentorProfile?.weeklySchedule) {
        return false;
      }

      const eventType = await this.getMentorEventType(mentorId);
      if (!eventType) {
        await this.createMentorEventType(mentorId);
        return true;
      }

      // Convert weekly schedule to Cal.com format
      const availability = this.convertWeeklyScheduleToCalCom(mentorProfile.weeklySchedule);

      const response = await axios.patch(
        `${this.baseUrl}/event-types/${eventType.id}`,
        { availability },
        { headers: this.getHeaders() }
      );

      console.log('✅ Mentor availability synced with Cal.com');
      return true;

    } catch (error: any) {
      console.error('❌ Error syncing mentor availability:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Convert weekly schedule to Cal.com format
   */
  private convertWeeklyScheduleToCalCom(weeklySchedule: any): any[] {
    const calcomAvailability: any[] = [];
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    Object.entries(weeklySchedule).forEach(([day, blocks]: [string, any]) => {
      if (Array.isArray(blocks) && blocks.length > 0) {
        blocks.forEach((block: any) => {
          if (block.isAvailable) {
            calcomAvailability.push({
              days: [dayMap[day as keyof typeof dayMap]],
              startTime: block.startTime,
              endTime: block.endTime,
            });
          }
        });
      }
    });

    return calcomAvailability;
  }
}

export default new CalComService();