// services/bookingService.ts - Complete Booking Flow with Google Integration
import ApiService from './api';
import { MentorProfile } from './mentorService';

// Types for the booking flow
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  price: number;
  duration: number; // in minutes
  sessionType: 'video' | 'audio' | 'in-person';
}

export interface BookingRequest {
  mentorId: string;
  studentId: string;
  timeSlot: TimeSlot;
  sessionType: 'video' | 'audio' | 'in-person';
  subject: string;
  notes?: string;
  paymentMethodId: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    sessionId: string;
    paymentId: string;
    meetingLink?: string;
    calendarEventId: string;
    reminderSet: boolean;
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    conferenceSolution: {
      key: {
        type: string;
      };
    };
    createRequest: {
      requestId: string;
    };
  };
  reminders: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface PaymentDetails {
  amount: number;
  currency: string;
  description: string;
  mentorId: string;
  studentId: string;
  sessionDetails: {
    subject: string;
    duration: number;
    scheduledTime: string;
  };
}

class BookingService {
  private static instance: BookingService;
  
  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Get available time slots for a mentor on a specific date
   */
  async getAvailableSlots(mentorId: string, date: string): Promise<TimeSlot[]> {
    try {
      console.log('📅 Fetching available slots:', { mentorId, date });

      const response = await ApiService.post('/api/v1/booking/available-slots', {
        mentorId,
        date,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch available slots');
      }

      // Merge mentor's weekly schedule with Google Calendar availability
      const slots = await this.mergeWithGoogleCalendar(response.data, mentorId, date);
      
      console.log('✅ Available slots fetched successfully:', slots.length);
      return slots;

    } catch (error: any) {
      console.error('❌ Error fetching available slots:', error);
      throw error;
    }
  }

  /**
   * Merge mentor's schedule with Google Calendar to check real availability
   */
  private async mergeWithGoogleCalendar(
    mentorSlots: TimeSlot[], 
    mentorId: string, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      console.log('🔄 Merging with Google Calendar...');

      const response = await ApiService.post('/google/calendar/check-availability', {
        mentorId,
        date,
        slots: mentorSlots,
      });

      if (response.success && response.data) {
        return response.data.availableSlots;
      }

      // If Google Calendar integration fails, return mentor's original slots
      console.warn('⚠️ Google Calendar integration unavailable, using mentor slots');
      return mentorSlots;

    } catch (error) {
      console.error('❌ Google Calendar integration error:', error);
      return mentorSlots;
    }
  }

  /**
   * Create a booking with payment processing
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingResponse> {
    try {
      console.log('🎯 Creating booking:', bookingRequest);

      // Step 1: Validate booking request
      await this.validateBookingRequest(bookingRequest);

      // Step 2: Process payment
      const paymentResult = await this.processPayment(bookingRequest);
      
      if (!paymentResult.success) {
        throw new Error('Payment processing failed');
      }

      // Step 3: Create the booking
      const bookingResult = await this.createBookingRecord(bookingRequest, paymentResult.paymentId);

      if (!bookingResult.success) {
        // Refund payment if booking creation fails
        await this.refundPayment(paymentResult.paymentId);
        throw new Error('Booking creation failed');
      }

      // Step 4: Create Google Meet link
      const meetingLink = await this.createGoogleMeetLink(bookingRequest);

      // Step 5: Create Google Calendar events
      const calendarEventId = await this.createCalendarEvents(bookingRequest, meetingLink, bookingResult.data.sessionId);

      // Step 6: Send notifications and reminders
      await this.setupNotificationsAndReminders(bookingRequest, bookingResult.data.sessionId, meetingLink);

      const response: BookingResponse = {
        success: true,
        message: 'Booking created successfully',
        data: {
          bookingId: bookingResult.data.bookingId,
          sessionId: bookingResult.data.sessionId,
          paymentId: paymentResult.paymentId,
          meetingLink: meetingLink,
          calendarEventId: calendarEventId,
          reminderSet: true,
        },
      };

      console.log('✅ Booking created successfully:', response.data);
      return response;

    } catch (error: any) {
      console.error('❌ Booking creation failed:', error);
      
      return {
        success: false,
        message: error.message || 'Booking creation failed',
      };
    }
  }

  /**
   * Validate booking request
   */
  private async validateBookingRequest(request: BookingRequest): Promise<void> {
    console.log('🔍 Validating booking request...');

    // Check if time slot is still available
    const availableSlots = await this.getAvailableSlots(request.mentorId, request.timeSlot.date);
    const isSlotAvailable = availableSlots.some(slot => 
      slot.id === request.timeSlot.id && slot.isAvailable
    );

    if (!isSlotAvailable) {
      throw new Error('Selected time slot is no longer available');
    }

    // Validate payment method
    const paymentValid = await this.validatePaymentMethod(request.paymentMethodId);
    if (!paymentValid) {
      throw new Error('Invalid payment method');
    }

    console.log('✅ Booking request validated');
  }

  /**
   * Process payment for the booking
   */
  private async processPayment(request: BookingRequest): Promise<{ success: boolean; paymentId: string }> {
    try {
      console.log('💳 Processing payment...');

      const paymentDetails: PaymentDetails = {
        amount: request.timeSlot.price,
        currency: 'USD',
        description: `Mentoring Session - ${request.subject}`,
        mentorId: request.mentorId,
        studentId: request.studentId,
        sessionDetails: {
          subject: request.subject,
          duration: request.timeSlot.duration,
          scheduledTime: request.timeSlot.startTime,
        },
      };

      const response = await ApiService.post('/payment/process', {
        ...paymentDetails,
        paymentMethodId: request.paymentMethodId,
      });

      if (!response.success) {
        throw new Error(response.message || 'Payment processing failed');
      }

      console.log('✅ Payment processed successfully:', response.data.paymentId);
      return {
        success: true,
        paymentId: response.data.paymentId,
      };

    } catch (error: any) {
      console.error('❌ Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Create booking record in database
   */
  private async createBookingRecord(
    request: BookingRequest, 
    paymentId: string
  ): Promise<{ success: boolean; data: { bookingId: string; sessionId: string } }> {
    try {
      console.log('📝 Creating booking record...');

      const response = await ApiService.post('api/v1/booking/create', {
        mentorId: request.mentorId,
        studentId: request.studentId,
        timeSlot: request.timeSlot,
        sessionType: request.sessionType,
        subject: request.subject,
        notes: request.notes,
        paymentId: paymentId,
        status: 'confirmed',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create booking record');
      }

      console.log('✅ Booking record created:', response.data);
      return response;

    } catch (error: any) {
      console.error('❌ Failed to create booking record:', error);
      throw error;
    }
  }

  /**
   * Create Google Meet link for the session
   */
  private async createGoogleMeetLink(request: BookingRequest): Promise<string> {
    try {
      console.log('🎥 Creating Google Meet link...');

      const response = await ApiService.post('/google/meet/create', {
        mentorId: request.mentorId,
        studentId: request.studentId,
        sessionDetails: {
          subject: request.subject,
          startTime: request.timeSlot.startTime,
          endTime: request.timeSlot.endTime,
          duration: request.timeSlot.duration,
        },
      });

      if (!response.success) {
        console.warn('⚠️ Google Meet creation failed, using fallback');
        return `https://meet.google.com/new`; // Fallback
      }

      console.log('✅ Google Meet link created:', response.data.meetingLink);
      return response.data.meetingLink;

    } catch (error) {
      console.error('❌ Google Meet creation error:', error);
      return `https://meet.google.com/new`; // Fallback
    }
  }

  /**
   * Create Google Calendar events for both mentor and student
   */
  private async createCalendarEvents(
    request: BookingRequest,
    meetingLink: string,
    sessionId: string
  ): Promise<string> {
    try {
      console.log('📅 Creating Google Calendar events...');

      const eventData: GoogleCalendarEvent = {
        id: `session-${sessionId}`,
        summary: `Mentoring Session: ${request.subject}`,
        description: `
          Mentoring session scheduled.
          
          Subject: ${request.subject}
          Duration: ${request.timeSlot.duration} minutes
          Session Type: ${request.sessionType}
          
          Meeting Link: ${meetingLink}
          
          Notes: ${request.notes || 'No additional notes'}
        `,
        start: {
          dateTime: request.timeSlot.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: request.timeSlot.endTime,
          timeZone: 'UTC',
        },
        attendees: [], // Will be populated by the backend
        conferenceData: {
          conferenceSolution: {
            key: {
              type: 'hangoutsMeet',
            },
          },
          createRequest: {
            requestId: `session-${sessionId}-${Date.now()}`,
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      };

      const response = await ApiService.post('/google/calendar/create-event', {
        eventData,
        mentorId: request.mentorId,
        studentId: request.studentId,
      });

      if (!response.success) {
        console.warn('⚠️ Calendar event creation failed');
        return '';
      }

      console.log('✅ Calendar events created:', response.data.eventId);
      return response.data.eventId;

    } catch (error) {
      console.error('❌ Calendar event creation error:', error);
      return '';
    }
  }

  /**
   * Setup notifications and reminders
   */
  private async setupNotificationsAndReminders(
    request: BookingRequest,
    sessionId: string,
    meetingLink: string
  ): Promise<void> {
    try {
      console.log('🔔 Setting up notifications and reminders...');

      const response = await ApiService.post('/notifications/setup-reminders', {
        sessionId,
        mentorId: request.mentorId,
        studentId: request.studentId,
        sessionDetails: {
          subject: request.subject,
          startTime: request.timeSlot.startTime,
          duration: request.timeSlot.duration,
          meetingLink,
        },
        reminderTimes: [
          { type: 'email', minutes: 1440 }, // 24 hours
          { type: 'email', minutes: 60 },   // 1 hour
          { type: 'push', minutes: 15 },    // 15 minutes
          { type: 'sms', minutes: 10 },     // 10 minutes (optional)
        ],
      });

      if (response.success) {
        console.log('✅ Notifications and reminders set up successfully');
      } else {
        console.warn('⚠️ Some notifications setup failed');
      }

    } catch (error) {
      console.error('❌ Notifications setup error:', error);
      // Don't throw error as this is not critical for booking success
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
    try {
      console.log('❌ Cancelling booking:', bookingId);

      const response = await ApiService.post('api/v1/booking/cancel', {
        bookingId,
        reason,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel booking');
      }

      // Handle refund if applicable
      if (response.data.refundEligible) {
        await this.processRefund(response.data.paymentId, response.data.refundAmount);
      }

      // Cancel calendar events
      if (response.data.calendarEventId) {
        await this.cancelCalendarEvent(response.data.calendarEventId);
      }

      // Send cancellation notifications
      await this.sendCancellationNotifications(response.data);

      console.log('✅ Booking cancelled successfully');
      return {
        success: true,
        message: 'Booking cancelled successfully',
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Booking cancellation failed:', error);
      return {
        success: false,
        message: error.message || 'Booking cancellation failed',
      };
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string, 
    newTimeSlot: TimeSlot
  ): Promise<BookingResponse> {
    try {
      console.log('🔄 Rescheduling booking:', { bookingId, newTimeSlot });

      // Validate new time slot availability
      const availableSlots = await this.getAvailableSlots(newTimeSlot.id, newTimeSlot.date);
      const isNewSlotAvailable = availableSlots.some(slot => 
        slot.id === newTimeSlot.id && slot.isAvailable
      );

      if (!isNewSlotAvailable) {
        throw new Error('New time slot is not available');
      }

      const response = await ApiService.post('api/v1/booking/reschedule', {
        bookingId,
        newTimeSlot,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to reschedule booking');
      }

      // Update calendar events
      if (response.data.calendarEventId) {
        await this.updateCalendarEvent(response.data.calendarEventId, newTimeSlot);
      }

      // Send reschedule notifications
      await this.sendRescheduleNotifications(response.data);

      console.log('✅ Booking rescheduled successfully');
      return {
        success: true,
        message: 'Booking rescheduled successfully',
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Booking reschedule failed:', error);
      return {
        success: false,
        message: error.message || 'Booking reschedule failed',
      };
    }
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(
    userId: string, 
    status?: 'upcoming' | 'completed' | 'cancelled'
  ): Promise<any[]> {
    try {
      console.log('📋 Fetching user bookings:', { userId, status });

      const queryParams = new URLSearchParams();
      queryParams.append('userId', userId);
      if (status) queryParams.append('status', status);

      const response = await ApiService.get(`api/v1/booking/user-bookings?${queryParams.toString()}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bookings');
      }

      console.log('✅ User bookings fetched:', response.data.length);
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching user bookings:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await ApiService.get(`/payment/method/${paymentMethodId}/validate`);
      return response.success && response.data.valid;
    } catch {
      return false;
    }
  }

  private async refundPayment(paymentId: string): Promise<void> {
    try {
      await ApiService.post('/payment/refund', { paymentId });
    } catch (error) {
      console.error('❌ Refund failed:', error);
    }
  }

  private async processRefund(paymentId: string, amount: number): Promise<void> {
    try {
      await ApiService.post('/payment/refund', { paymentId, amount });
    } catch (error) {
      console.error('❌ Refund processing failed:', error);
    }
  }

  private async cancelCalendarEvent(eventId: string): Promise<void> {
    try {
      await ApiService.delete(`/google/calendar/event/${eventId}`);
    } catch (error) {
      console.error('❌ Calendar event cancellation failed:', error);
    }
  }

  private async updateCalendarEvent(eventId: string, newTimeSlot: TimeSlot): Promise<void> {
    try {
      await ApiService.put(`/google/calendar/event/${eventId}`, {
        start: { dateTime: newTimeSlot.startTime },
        end: { dateTime: newTimeSlot.endTime },
      });
    } catch (error) {
      console.error('❌ Calendar event update failed:', error);
    }
  }

  private async sendCancellationNotifications(data: any): Promise<void> {
    try {
      await ApiService.post('/notifications/cancellation', data);
    } catch (error) {
      console.error('❌ Cancellation notifications failed:', error);
    }
  }

  private async sendRescheduleNotifications(data: any): Promise<void> {
    try {
      await ApiService.post('/notifications/reschedule', data);
    } catch (error) {
      console.error('❌ Reschedule notifications failed:', error);
    }
  }
}

// Export singleton instance
const bookingService = BookingService.getInstance();
export default bookingService;