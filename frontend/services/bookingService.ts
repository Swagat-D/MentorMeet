// frontend/services/bookingService.ts - Updated for Manual Booking Flow
import ApiService from './api';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  sessionType: 'video';
  slotId: string; // Reference to mentor's schedule slot
}

export interface BookingRequest {
  mentorId: string;
  timeSlot: TimeSlot;
  sessionType: 'video';
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
    status: string;
    autoDeclineAt?: string;
    reminderSet: boolean;
    paymentProcessed: boolean;
  };
  code?: string;
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
    type: 'video';
    duration: number;
  };
  status: 'pending_mentor_acceptance' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  userRating?: number;
  price: number;
  currency: string;
  meetingProvider?: string;
  autoDeclineAt?: string;
  mentorAcceptedAt?: string;
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
   * Get available time slots from mentor's manual schedule
   */
  async getAvailableSlots(mentorId: string, date: string): Promise<TimeSlot[]> {
    try {
      console.log('📅 Fetching available slots from manual schedule:', { mentorId, date });

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
              throw new Error('Past dates are not available for booking. Please select tomorrow or a future date.');
            case 'no_profile':
              throw new Error('This mentor hasn\'t completed their profile setup yet.');
            case 'no_schedule':
              throw new Error('This mentor hasn\'t configured their availability schedule yet.');
            case 'no_slots_available':
              throw new Error('No available slots for this date. Try selecting a different date.');
            default:
              throw new Error(response.message || 'Failed to fetch available slots');
          }
        }
        throw new Error(response.message || 'Failed to fetch available slots');
      }

      const slots = response.data || [];
      console.log('✅ Available slots fetched from manual schedule:', slots.length);
      
      // Sort slots by start time
      return slots.sort((a: TimeSlot, b: TimeSlot) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

    } catch (error: any) {
      console.error('❌ Error fetching available slots:', error);
      throw error; // Re-throw to preserve the specific error message
    }
  }

  /**
   * Create a manual booking with payment-first flow
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingResponse> {
    try {
      console.log('🎯 Creating manual booking:', bookingRequest);

      const response = await ApiService.post('BOOKING_CREATE', bookingRequest);

      if (!response.success) {
        // Handle specific error codes
        const errorCode = response.code;
        let errorMessage = response.message || 'Failed to create booking';
        
        switch (errorCode) {
          case 'PAYMENT_FAILED':
            errorMessage = 'Payment processing failed. Please check your payment method and try again.';
            break;
          case 'SLOT_UNAVAILABLE':
            errorMessage = 'This time slot is no longer available. Please select another time.';
            break;
          default:
            break;
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Manual booking created successfully:', response.data);
      return {
        success: true,
        message: response.message || 'Booking created successfully! Waiting for mentor acceptance.',
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Manual booking creation failed:', error);
      return {
        success: false,
        message: error.message || 'Booking creation failed. Please try again.',
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
        message: 'Booking cancelled successfully. Refund will be processed within 3-5 business days.',
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
   * Get user's bookings
   */
  async getUserBookings(status?: 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'confirmed', page = 1, limit = 10): Promise<{
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
        currency: session.currency || 'INR',
        meetingProvider: session.meetingProvider,
        autoDeclineAt: session.autoDeclineAt,
        mentorAcceptedAt: session.mentorAcceptedAt,
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
      return {
        ...response.data,
        currency: response.data.currency || 'INR',
      };

    } catch (error: any) {
      console.error('❌ Error fetching booking details:', error);
      return null;
    }
  }

  /**
   * Accept a session as a mentor
   */
  async acceptSession(sessionId: string, meetingUrl: string, meetingProvider = 'other'): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('✅ Accepting session:', { sessionId, meetingProvider });

      const response = await ApiService.put(`/booking/${sessionId}/accept`, {
        meetingUrl,
        meetingProvider,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to accept session');
      }

      console.log('✅ Session accepted successfully');
      return {
        success: true,
        message: 'Session accepted successfully. Student has been notified.',
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Error accepting session:', error);
      return {
        success: false,
        message: error.message || 'Failed to accept session',
      };
    }
  }

  /**
   * Decline a session as a mentor
   */
  async declineSession(sessionId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('❌ Declining session:', { sessionId, reason });

      const response = await ApiService.put(`/booking/${sessionId}/decline`, {
        reason: reason || 'Declined by mentor',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to decline session');
      }

      console.log('✅ Session declined successfully');
      return {
        success: true,
        message: 'Session declined. Student has been refunded.',
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Error declining session:', error);
      return {
        success: false,
        message: error.message || 'Failed to decline session',
      };
    }
  }

  /**
   * Get pending sessions for mentor
   */
  async getPendingSessions(): Promise<Session[]> {
    try {
      console.log('⏳ Fetching pending sessions...');

      const result = await this.getUserBookings('pending');
      return result.sessions;

    } catch (error: any) {
      console.error('❌ Error fetching pending sessions:', error);
      return [];
    }
  }

  /**
   * Validate payment method before booking
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
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    pendingSessions: number;
    totalSpent: number;
    averageRating?: number;
  }> {
    try {
      const [completed, upcoming, pending] = await Promise.all([
        this.getUserBookings('completed', 1, 100),
        this.getUserBookings('upcoming', 1, 100),
        this.getUserBookings('pending', 1, 100),
      ]);

      const completedSessions = completed.sessions;
      const upcomingSessions = upcoming.sessions;
      const pendingSessions = pending.sessions;

      const ratingsWithValues = completedSessions
        .map(s => s.userRating)
        .filter((rating): rating is number => rating !== undefined);

      const averageRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) / ratingsWithValues.length
        : undefined;

      const totalSpent = completedSessions.reduce((sum, session) => sum + session.price, 0);

      return {
        totalSessions: completedSessions.length + upcomingSessions.length + pendingSessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        pendingSessions: pendingSessions.length,
        totalSpent,
        averageRating,
      };

    } catch (error) {
      console.error('❌ Error fetching session stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        pendingSessions: 0,
        totalSpent: 0,
      };
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
   * Get next upcoming session
   */
  async getNextSession(): Promise<Session | null> {
    try {
      const result = await this.getUserBookings('upcoming', 1, 1);
      return result.sessions.length > 0 ? result.sessions[0] : null;
    } catch (error) {
      console.error('❌ Error fetching next session:', error);
      return null;
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
   * Join a session (for tracking purposes)
   */
  async joinSession(sessionId: string): Promise<{ meetingUrl?: string; success: boolean }> {
    try {
      const session = await this.getBookingDetails(sessionId);
      
      if (!session) {
        return { success: false };
      }

      if (!session.meetingLink) {
        console.warn('⚠️ No meeting link found for session:', sessionId);
        return { success: false };
      }

      // Track session join (optional)
      try {
        await ApiService.post(`/booking/${sessionId}/join`);
      } catch (trackingError) {
        console.warn('⚠️ Failed to track session join:', trackingError);
        // Don't fail the join for tracking issues
      }

      return {
        meetingUrl: session.meetingLink,
        success: true
      };

    } catch (error: any) {
      console.error('❌ Error joining session:', error);
      return { success: false };
    }
  }

  /**
   * Check if a session needs mentor acceptance
   */
  isSessionPendingAcceptance(session: Session): boolean {
    return session.status === 'pending_mentor_acceptance';
  }

  /**
   * Check if a session is confirmed and ready to join
   */
  isSessionReady(session: Session): boolean {
    return session.status === 'confirmed' && !!session.meetingLink;
  }

  /**
   * Get time until auto-decline for pending sessions
   */
  getTimeUntilAutoDecline(session: Session): number | null {
    if (!session.autoDeclineAt) return null;
    
    const now = new Date().getTime();
    const autoDeclineTime = new Date(session.autoDeclineAt).getTime();
    const timeRemaining = autoDeclineTime - now;
    
    return timeRemaining > 0 ? timeRemaining : 0;
  }

  /**
   * Format time remaining until auto-decline
   */
  formatTimeUntilAutoDecline(timeRemaining: number): string {
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

// Export singleton instance
const bookingService = BookingService.getInstance();
export default bookingService;