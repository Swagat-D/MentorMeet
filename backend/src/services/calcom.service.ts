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
    this.apiKey = process.env.CALCOM_API_KEY || '';
    this.baseUrl = process.env.CALCOM_API_URL || 'https://api.cal.com/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ Cal.com API key not configured');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
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

      const eventTypeData = {
        title: `Mentoring Session with ${mentorProfile.displayName}`,
        slug: `mentor-${mentorId}`,
        length: parseInt(mentorProfile.preferences?.sessionLength?.replace(' minutes', '') || '60'),
        description: `One-on-one mentoring session with ${mentorProfile.displayName}. Expertise: ${mentorProfile.expertise?.join(', ')}`,
        price: mentorProfile.pricing?.hourlyRate || 75,
        currency: mentorProfile.pricing?.currency || 'USD',
        schedulingType: 'round-robin',
        metadata: {
          mentorId,
          mentorName: mentorProfile.displayName,
          subjects: mentorProfile.subjects,
          expertise: mentorProfile.expertise,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/event-types`,
        eventTypeData,
        { headers: this.getHeaders() }
      );

      console.log('✅ Cal.com event type created:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('❌ Error creating Cal.com event type:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get available slots for a mentor on a specific date
   */
  async getAvailableSlots(mentorId: string, date: string): Promise<any[]> {
    try {
      console.log('📅 Fetching available slots from Cal.com:', { mentorId, date });

      // Get mentor's event type
      const eventType = await this.getMentorEventType(mentorId);
      if (!eventType) {
        console.log('⚠️ No Cal.com event type found for mentor, creating one...');
        await this.createMentorEventType(mentorId);
        return []; // Return empty for first time, will work on subsequent calls
      }

      // Get availability for the date
      const response = await axios.get(
        `${this.baseUrl}/availability?dateFrom=${date}&dateTo=${date}&eventTypeId=${eventType.id}`,
        { headers: this.getHeaders() }
      );

      const availability: CalComAvailability[] = response.data;
      const dayAvailability = availability.find(day => day.date === date);

      if (!dayAvailability || !dayAvailability.slots.length) {
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
          eventTypeId: eventType.id,
        };
      });

      console.log(`✅ Found ${slots.length} available slots from Cal.com`);
      return slots;

    } catch (error: any) {
      console.error('❌ Error fetching Cal.com availability:', error.response?.data || error.message);
      
      // Fallback: Generate slots from mentor's weekly schedule
      return this.generateSlotsFromMentorSchedule(mentorId, date);
    }
  }

  /**
   * Create a booking via Cal.com
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
      console.log('📝 Creating Cal.com booking:', bookingData);

      const eventType = await this.getMentorEventType(bookingData.mentorId);
      if (!eventType) {
        throw new Error('Event type not found for mentor');
      }

      const bookingPayload = {
        eventTypeId: eventType.id,
        start: bookingData.timeSlot.startTime,
        end: bookingData.timeSlot.endTime,
        responses: {
          name: bookingData.studentName,
          email: bookingData.studentEmail,
          notes: bookingData.notes || '',
          subject: bookingData.subject,
        },
        metadata: {
          mentorId: bookingData.mentorId,
          studentId: bookingData.studentId,
          subject: bookingData.subject,
          sessionType: 'mentoring',
        },
        timeZone: 'UTC',
        language: 'en',
      };

      const response = await axios.post(
        `${this.baseUrl}/bookings`,
        bookingPayload,
        { headers: this.getHeaders() }
      );

      const booking: CalComBooking = response.data;

      console.log('✅ Cal.com booking created successfully:', booking.id);

      return {
        success: true,
        booking,
        meetingUrl: booking.meetingUrl || this.generateMeetingUrl(booking.id),
      };

    } catch (error: any) {
      console.error('❌ Cal.com booking creation failed:', error.response?.data || error.message);
      
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
      const response = await axios.get(
        `${this.baseUrl}/event-types`,
        { headers: this.getHeaders() }
      );

      const eventTypes: CalComEventType[] = response.data;
      return eventTypes.find(et => et.slug === `mentor-${mentorId}`) || null;

    } catch (error: any) {
      console.error('❌ Error fetching Cal.com event types:', error.response?.data || error.message);
      return null;
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