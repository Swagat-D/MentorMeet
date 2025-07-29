// services/bookingService.ts - Complete Booking Service with Real API Integration
import ApiService from './api';

// Types for the booking flow
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

      console.log('✅ Available slots fetched successfully:', response.data.length);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching available slots:', error);
      throw new Error(error.message || 'Failed to fetch available time slots');
    }
  }

  /**
   * Create a booking with complete flow
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingResponse> {
    try {
      console.log('🎯 Creating booking:', bookingRequest);

      const response = await ApiService.post('/api/v1/booking/create', bookingRequest);

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

      const response = await ApiService.put(`/api/v1/booking/${bookingId}/cancel`, {
        reason: reason || 'User cancelled',
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

      const response = await ApiService.put(`/api/v1/booking/${bookingId}/reschedule`, {
        newTimeSlot,
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

      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const response = await ApiService.get(`/api/v1/booking/user-bookings?${queryParams.toString()}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bookings');
      }

      const formattedSessions = (response.data || []).map((session: any) => ({
      id: session._id,
      mentor: {
        id: session.mentorId?._id || session.mentorId,
        name: session.mentorId?.name || 'Unknown Mentor',
        email: session.mentorId?.email || '',
        avatar: session.mentorId?.avatar || '',
      },
      student: {
        id: session.studentId?._id || session.studentId,
        name: session.studentId?.name || 'Unknown Student',
        email: session.studentId?.email || '',
        avatar: session.studentId?.avatar || '',
      },
      subject: session.subject,
      date: session.scheduledTime,
      duration: session.duration,
      sessionType: {
        type: 'video' as const,
        duration: session.duration,
      },
      status: session.status,
      meetingLink: session.recordingUrl, // Meeting link from backend
      calendarEventId: session.calendarEventId,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: session.price || 75,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));

      console.log('✅ User bookings fetched:', response.data.length);
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

      const response = await ApiService.get(`/api/v1/booking/${bookingId}`);

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

      const response = await ApiService.post(`/api/v1/booking/${sessionId}/rate`, {
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
   * Validate payment method
   */
  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await ApiService.get(`/api/v1/booking/payment/validate?paymentMethodId=${paymentMethodId}`);
      return response.success && response.data?.valid;
    } catch {
      return false;
    }
  }

  /**
   * Get upcoming sessions for notifications
   */
  async getUpcomingSessions(): Promise<Session[]> {
    try {
      const result = await this.getUserBookings('upcoming');
      return result.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();
        const timeDiff = sessionDate.getTime() - now.getTime();
        const hoursUntilSession = timeDiff / (1000 * 60 * 60);
        return hoursUntilSession <= 24 && hoursUntilSession > 0;
      });
    } catch (error) {
      console.error('❌ Error fetching upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Check if user has any active sessions
   */
  async hasActiveSession(): Promise<boolean> {
    try {
      const result = await this.getUserBookings('upcoming', 1, 1);
      return result.sessions.length > 0;
    } catch {
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
}

// Export singleton instance
const bookingService = BookingService.getInstance();
export default bookingService;