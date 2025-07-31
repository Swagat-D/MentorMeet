// services/bookingService.ts - Simplified Booking Service with Cal.com Integration
import ApiService from './api';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  sessionType: 'video' | 'audio' | 'in-person';
}

export interface BookingRequest {
  mentorId: string;
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

export interface Session {
  id: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  date: string;
  duration: number;
  sessionType: {
    type: 'video' | 'audio' | 'in-person';
    duration: number;
  };
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  userRating?: number;
  price: number;
  meetingProvider?: string;
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
   * Get available time slots for a mentor (via Cal.com)
   */
  async getAvailableSlots(mentorId: string, date: string): Promise<TimeSlot[]> {
    try {
      console.log('📅 Fetching available slots:', { mentorId, date });

      const response = await ApiService.post('BOOKING_AVAILABLE_SLOTS', {
        mentorId,
        date,
      });

      if (!response.success) {
        // Handle specific error types with friendly messages
        if (response.info) {
          const { type, suggestion } = response.info;
          
          switch (type) {
            case 'past_date':
              throw new Error('Past dates are not available for booking');
            case 'no_profile':
              throw new Error('This mentor hasn\'t set up their profile yet');
            case 'no_schedule':
              throw new Error('This mentor hasn\'t configured their schedule yet');
            case 'no_slots':
              throw new Error(`No available slots for ${response.info.dayName || 'this date'}`);
            default:
              throw new Error(response.message || 'Failed to fetch available slots');
          }
        }
        throw new Error(response.message || 'Failed to fetch available slots');
      }

      console.log('✅ Available slots fetched:', response.data.length);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching available slots:', error);
      throw error; // Re-throw to preserve the specific error message
    }
  }

  /**
   * Create a booking with Cal.com integration
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingResponse> {
    try {
      console.log('🎯 Creating booking:', bookingRequest);

      const response = await ApiService.post('BOOKING_CREATE', bookingRequest);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create booking');
      }

      console.log('✅ Booking created successfully:', response.data);
      return {
        success: true,
        message: 'Booking created successfully',
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Booking creation failed:', error);
      return {
        success: false,
        message: error.message || 'Booking creation failed',
      };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
    try {
      console.log('❌ Cancelling booking:', bookingId);

      const response = await ApiService.put('BOOKING_CANCEL', { reason }, {
        urlParams: { bookingId }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel booking');
      }

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
  async rescheduleBooking(bookingId: string, newTimeSlot: TimeSlot): Promise<BookingResponse> {
    try {
      console.log('🔄 Rescheduling booking:', { bookingId, newTimeSlot });

      const response = await ApiService.put('BOOKING_RESCHEDULE', {
        newTimeSlot,
      }, {
        urlParams: { bookingId }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to reschedule booking');
      }

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
  async getUserBookings(status?: 'upcoming' | 'completed' | 'cancelled', page = 1, limit = 10): Promise<{
    sessions: Session[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      console.log('📋 Fetching user bookings:', { status, page, limit });

      const params: any = { page: page.toString(), limit: limit.toString() };
      if (status) params.status = status;

      const response = await ApiService.get('BOOKING_USER_BOOKINGS', { params });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bookings');
      }

      const formattedSessions = (response.data || []).map((session: any) => ({
        id: session.id,
        mentor: session.mentor,
        student: session.student,
        subject: session.subject,
        date: session.date,
        duration: session.duration,
        sessionType: session.sessionType,
        status: session.status,
        meetingLink: session.meetingLink,
        notes: session.notes,
        userRating: session.userRating,
        price: session.price,
        meetingProvider: session.meetingProvider,
      }));

      console.log('✅ User bookings fetched:', formattedSessions.length);
      return {
        sessions: formattedSessions,
        pagination: response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

    } catch (error: any) {
      console.error('❌ Error fetching user bookings:', error);
      return {
        sessions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId: string): Promise<Session | null> {
    try {
      console.log('🔍 Fetching booking details:', bookingId);

      const response = await ApiService.get('BOOKING_DETAILS', {
        urlParams: { bookingId }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch booking details');
      }

      console.log('✅ Booking details fetched successfully');
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching booking details:', error);
      return null;
    }
  }

  /**
   * Rate a completed session
   */
  async rateSession(sessionId: string, rating: number, review?: string): Promise<boolean> {
    try {
      console.log('⭐ Rating session:', { sessionId, rating });

      const response = await ApiService.post(`/booking/${sessionId}/rate`, {
        rating,
        review,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to rate session');
      }

      console.log('✅ Session rated successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error rating session:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    averageRating?: number;
  }> {
    try {
      const [completed, upcoming] = await Promise.all([
        this.getUserBookings('completed', 1, 100),
        this.getUserBookings('upcoming', 1, 100),
      ]);

      const completedSessions = completed.sessions;
      const upcomingSessions = upcoming.sessions;

      const ratingsWithValues = completedSessions
        .map(s => s.userRating)
        .filter((rating): rating is number => rating !== undefined);

      const averageRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) / ratingsWithValues.length
        : undefined;

      return {
        totalSessions: completedSessions.length + upcomingSessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        averageRating,
      };

    } catch (error) {
      console.error('❌ Error fetching session stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
      };
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await ApiService.get('PAYMENT_VALIDATE', {
        params: { paymentMethodId }
      });
      return response.success && response.data?.valid;
    } catch {
      return false;
    }
  }

  /**
   * Get upcoming sessions for today
   */
  async getTodaySessions(): Promise<Session[]> {
    try {
      const result = await this.getUserBookings('upcoming');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return result.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= today && sessionDate < tomorrow;
      });
    } catch (error) {
      console.error('❌ Error fetching today sessions:', error);
      return [];
    }
  }

  /**
   * Check if user has sessions today
   */
  async hasSessionsToday(): Promise<boolean> {
    try {
      const todaySessions = await this.getTodaySessions();
      return todaySessions.length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
const bookingService = BookingService.getInstance();
export default bookingService;