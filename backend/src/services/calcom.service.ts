// backend/src/services/calcom.service.ts - Production Cal.com Integration
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import MentorProfileService from './mentorProfile.service';

interface CalComConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret?: string;
  retryAttempts: number;
  retryDelay: number;
}

interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  price?: number;
  currency?: string;
  locations: Array<{
    type: string;
    displayLocationPublicly?: boolean;
  }>;
  bookingFields?: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  metadata?: any;
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
    timeZone?: string;
  }>;
  location?: any;
  meetingUrl?: string;
  metadata?: any;
  references?: Array<{
    type: string;
    uid: string;
    meetingUrl?: string;
  }>;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  sessionType: 'video';
  eventTypeId: number;
}

class CalComService {
  private config: CalComConfig;
  private client!: AxiosInstance;
  private eventTypeCache: Map<string, CalComEventType> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.config = {
      apiKey: process.env.CALCOM_API_KEY || '',
      baseUrl: process.env.CALCOM_API_URL || 'https://api.cal.com/v1',
      webhookSecret: process.env.CALCOM_WEBHOOK_SECRET,
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.validateConfig();
    this.initializeClient();
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('CALCOM_API_KEY environment variable is required');
    }

    if (!this.config.apiKey.startsWith('cal_')) {
      throw new Error('Invalid Cal.com API key format. Should start with "cal_"');
    }

    console.log('✅ Cal.com service initialized with valid configuration');
  }

  private initializeClient(): void {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MentorMatch/1.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 Cal.com API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Cal.com API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ Cal.com API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error('❌ Cal.com API Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });

        // Handle specific error cases
        if (error.response?.status === 401) {
          throw new Error('Cal.com API authentication failed. Please check your API key.');
        }

        if (error.response?.status === 429) {
          console.warn('⚠️ Cal.com API rate limit hit, implementing retry...');
          return this.handleRateLimit(error);
        }

        if (error.response?.status >= 500) {
          throw new Error('Cal.com service is temporarily unavailable. Please try again later.');
        }

        throw error;
      }
    );
  }

  private async handleRateLimit(error: any): Promise<any> {
    const retryAfter = error.response?.headers['retry-after'] || this.config.retryDelay / 1000;
    await this.delay(retryAfter * 1000);
    return this.client.request(error.config);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === this.config.retryAttempts) {
          break;
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          break; // Don't retry auth errors
        }

        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏱️ Retrying ${context} in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Get or create event type for mentor
   */
  async getOrCreateMentorEventType(mentorId: string, forceRefresh = false): Promise<CalComEventType> {
    const cacheKey = `mentor-${mentorId}`;
    
    // Check cache first
    if (!forceRefresh && this.eventTypeCache.has(cacheKey)) {
      const cachedTime = this.cacheExpiry.get(cacheKey) || 0;
      if (Date.now() - cachedTime < this.CACHE_TTL) {
        return this.eventTypeCache.get(cacheKey)!;
      }
    }

    return this.retryOperation(async () => {
      // First, try to find existing event type
      const existingEventType = await this.findMentorEventType(mentorId);
      
      if (existingEventType) {
        console.log(`✅ Found existing Cal.com event type for mentor ${mentorId}: ${existingEventType.id}`);
        this.cacheEventType(cacheKey, existingEventType);
        return existingEventType;
      }

      // Create new event type
      const eventType = await this.createMentorEventType(mentorId);
      this.cacheEventType(cacheKey, eventType);
      return eventType;
    }, `get/create event type for mentor ${mentorId}`);
  }

  private cacheEventType(key: string, eventType: CalComEventType): void {
    this.eventTypeCache.set(key, eventType);
    this.cacheExpiry.set(key, Date.now());
  }

  private async findMentorEventType(mentorId: string): Promise<CalComEventType | null> {
    try {
      const response = await this.client.get('/event-types');
      const eventTypes = response.data?.event_types || response.data || [];
      
      return eventTypes.find((et: CalComEventType) => 
        et.slug === `mentor-${mentorId}` || 
        et.metadata?.mentorId === mentorId
      ) || null;
    } catch (error) {
      console.warn('⚠️ Failed to fetch event types:', error);
      return null;
    }
  }

  private async createMentorEventType(mentorId: string): Promise<CalComEventType> {
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    if (!mentorProfile) {
      throw new Error(`Mentor profile not found for ID: ${mentorId}`);
    }

    const user = await User.findById(mentorId);
    if (!user) {
      throw new Error(`User not found for mentor ID: ${mentorId}`);
    }

    const sessionLength = parseInt(
      mentorProfile.preferences?.sessionLength?.replace(' minutes', '') || '60'
    );
    const hourlyRate = mentorProfile.pricing?.hourlyRate || 75;

    const eventTypeData = {
      title: `Mentoring with ${mentorProfile.displayName}`,
      slug: `mentor-${mentorId}`,
      length: sessionLength,
      description: this.generateEventDescription(mentorProfile),
      price: hourlyRate,
      currency: mentorProfile.pricing?.currency || 'USD',
      
      // Google Meet integration
      locations: [
        {
          type: 'integrations:google:meet',
          displayLocationPublicly: true
        }
      ],

      // Booking configuration
      schedulingType: 'ROUND_ROBIN',
      requiresConfirmation: false,
      disableGuests: true,
      minimumBookingNotice: this.parseAdvanceBooking(mentorProfile.preferences?.advanceBooking),
      
      // Custom booking fields
      bookingFields: [
        {
          name: 'subject',
          type: 'text',
          label: 'Session Topic',
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
          name: 'specific_goals',
          type: 'textarea',
          label: 'Specific Learning Goals',
          required: false,
          placeholder: 'Any specific goals or questions for this session?'
        }
      ],

      // Metadata for tracking
      metadata: {
        mentorId,
        mentorName: mentorProfile.displayName,
        subjects: mentorProfile.subjects?.map((s: any) => 
          typeof s === 'string' ? s : s.name
        ) || [],
        expertise: mentorProfile.expertise || [],
        platform: 'MentorMatch',
        version: '1.0'
      }
    };

    console.log(`📝 Creating Cal.com event type for mentor ${mentorId}`);
    
    const response = await this.client.post('/event-types', eventTypeData);
    const eventType = response.data;

    console.log(`✅ Created Cal.com event type: ${eventType.id} for mentor ${mentorId}`);
    return eventType;
  }

  private generateEventDescription(mentorProfile: any): string {
    const subjects = mentorProfile.subjects?.map((s: any) => 
      typeof s === 'string' ? s : s.name
    ).join(', ') || 'Various Topics';

    const expertise = mentorProfile.expertise?.join(', ') || 'General Mentoring';

    return `Professional one-on-one mentoring session with ${mentorProfile.displayName}.

🎯 Expertise: ${expertise}
📚 Subjects: ${subjects}
⏱️ Session Length: ${mentorProfile.preferences?.sessionLength || '60 minutes'}
🌍 Location: ${mentorProfile.location || 'Online'}

This is a personalized mentoring session focused on your learning goals and questions. Come prepared with specific topics you'd like to discuss!

About ${mentorProfile.displayName}:
${mentorProfile.bio || 'Experienced mentor ready to help you achieve your goals.'}`;
  }

  private parseAdvanceBooking(advanceBooking?: string): number {
    if (!advanceBooking) return 1440; // 24 hours default
    
    const match = advanceBooking.match(/(\d+)\s*(day|hour|minute)/i);
    if (!match) return 1440;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute': return value;
      case 'hour': return value * 60;
      case 'day': return value * 1440;
      default: return 1440;
    }
  }

  /**
   * Get available slots for a mentor on a specific date
   */
  async getAvailableSlots(mentorId: string, date: string): Promise<TimeSlot[]> {
    return this.retryOperation(async () => {
      console.log(`📅 Fetching available slots for mentor ${mentorId} on ${date}`);

      // Get mentor's event type
      const eventType = await this.getOrCreateMentorEventType(mentorId);

      // Format date for Cal.com API
      const dateFrom = `${date}T00:00:00.000Z`;
      const dateTo = `${date}T23:59:59.999Z`;

      // Fetch availability from Cal.com
      const response = await this.client.get('/slots/available', {
        params: {
          eventTypeId: eventType.id,
          dateFrom,
          dateTo,
          timeZone: 'UTC'
        }
      });

      const availability = response.data?.slots || [];
      
      console.log(`📊 Cal.com returned ${availability.length} available slots`);

      // Transform Cal.com slots to our format
      const slots: TimeSlot[] = availability.map((slot: any, index: number) => {
        const startTime = new Date(slot.time);
        const endTime = new Date(startTime.getTime() + (eventType.length * 60 * 1000));

        return {
          id: `calcom-${eventType.id}-${startTime.getTime()}-${index}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          date,
          isAvailable: true,
          price: eventType.price || 75,
          duration: eventType.length,
          sessionType: 'video' as const,
          eventTypeId: eventType.id
        };
      });

      // Filter out slots that conflict with our database bookings
      const filteredSlots = await this.filterConflictingSlots(slots, mentorId, date);

      console.log(`✅ Returning ${filteredSlots.length} available slots after filtering`);
      return filteredSlots;

    }, `get available slots for mentor ${mentorId} on ${date}`);
  }

  private async filterConflictingSlots(
    slots: TimeSlot[], 
    mentorId: string, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get existing bookings from our database
      const existingBookings = await Session.find({
        mentorId,
        scheduledTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ['cancelled'] },
      });

      return slots.filter(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        const hasConflict = existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledTime);
          const bookingEnd = new Date(
            booking.scheduledTime.getTime() + (booking.duration * 60 * 1000)
          );

          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        return !hasConflict;
      });

    } catch (error) {
      console.error('❌ Error filtering conflicting slots:', error);
      return slots; // Return unfiltered slots if database check fails
    }
  }

  /**
   * Create a booking in Cal.com with full integration
   */
  async createBooking(bookingData: {
    mentorId: string;
    studentId: string;
    timeSlot: TimeSlot;
    subject: string;
    notes?: string;
    studentEmail: string;
    studentName: string;
    mentorEmail: string;
    mentorName: string;
    experienceLevel?: string;
    specificGoals?: string;
  }): Promise<{
    success: boolean;
    booking?: CalComBooking;
    meetingUrl?: string;
    calendarEvent?: any;
    error?: string;
  }> {
    return this.retryOperation(async () => {
      console.log(`📝 Creating Cal.com booking for mentor ${bookingData.mentorId}`);

      // Get mentor's event type
      const eventType = await this.getOrCreateMentorEventType(bookingData.mentorId);

      // Validate that the slot is still available
      const currentSlots = await this.getAvailableSlots(bookingData.mentorId, bookingData.timeSlot.date);
      const slotStillAvailable = currentSlots.some(slot => 
        slot.startTime === bookingData.timeSlot.startTime
      );

      if (!slotStillAvailable) {
        throw new Error('Selected time slot is no longer available. Please select another slot.');
      }

      // Prepare booking payload
      const bookingPayload = {
        eventTypeId: eventType.id,
        start: bookingData.timeSlot.startTime,
        end: bookingData.timeSlot.endTime,
        
        // Attendee information
        responses: {
          name: bookingData.studentName,
          email: bookingData.studentEmail,
          subject: bookingData.subject,
          experience_level: bookingData.experienceLevel || 'Intermediate',
          specific_goals: bookingData.specificGoals || bookingData.notes || ''
        },

        // Meeting metadata
        metadata: {
          mentorId: bookingData.mentorId,
          studentId: bookingData.studentId,
          subject: bookingData.subject,
          platform: 'MentorMatch',
          bookingTime: new Date().toISOString()
        },

        // Timezone and language
        timeZone: 'UTC',
        language: 'en'
      };

      console.log(`🚀 Sending booking request to Cal.com...`);

      // Create the booking
      const response = await this.client.post('/bookings', bookingPayload);
      const booking = response.data;

      console.log(`✅ Cal.com booking created: ${booking.id}`);

      // Extract meeting URL
      const meetingUrl = this.extractMeetingUrl(booking);

      if (!meetingUrl) {
        console.warn('⚠️ No meeting URL found in Cal.com response');
        console.log('📋 Booking response:', JSON.stringify(booking, null, 2));
        
        throw new Error(
          'Cal.com booking created but no Google Meet URL was provided. ' +
          'Please ensure Google Meet integration is properly configured in your Cal.com account.'
        );
      }

      console.log(`🎥 Google Meet URL extracted: ${meetingUrl.substring(0, 30)}...`);

      return {
        success: true,
        booking,
        meetingUrl,
        calendarEvent: booking.references?.find((ref: any) => ref.type === 'google_calendar')
      };

    }, `create booking for mentor ${bookingData.mentorId}`);
  }

  private extractMeetingUrl(booking: CalComBooking): string | null {
  // Method 1: Direct meetingUrl field
  if (booking.meetingUrl) {
    return booking.meetingUrl;
  }

  // Method 2: Check references for Google Meet
  if (booking.references && Array.isArray(booking.references)) {
    for (const ref of booking.references) {
      if (ref.meetingUrl && ref.meetingUrl.includes('meet.google.com')) {
        return ref.meetingUrl;
      }
      if (ref.uid && ref.uid.includes('meet.google.com')) {
        return ref.uid;
      }
    }
  }

  // Method 3: Check location field
  if (booking.location) {
    if (typeof booking.location === 'string' && booking.location.includes('meet.google.com')) {
      return booking.location;
    }
    if (booking.location.link && booking.location.link.includes('meet.google.com')) {
      return booking.location.link;
    }
  }

  // Method 4: Check attendees (FIXED - remove meetingUrl check)
  if (booking.attendees && Array.isArray(booking.attendees)) {
    for (const attendee of booking.attendees) {
      // Check if attendee has booking reference with meeting URL
      if ((attendee as any).bookingReference?.meetingUrl) {
        return (attendee as any).bookingReference.meetingUrl;
      }
      // Check if attendee has nested meeting data
      if ((attendee as any).meetingData?.url) {
        return (attendee as any).meetingData.url;
      }
    }
  }

  // Method 5: Check metadata for meeting URL
  if (booking.metadata && booking.metadata.meetingUrl) {
    return booking.metadata.meetingUrl;
  }

  return null;
}

  /**
   * Cancel a Cal.com booking
   */
  async cancelBooking(
    calcomBookingId: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.retryOperation(async () => {
      console.log(`❌ Cancelling Cal.com booking: ${calcomBookingId}`);

      await this.client.delete(`/bookings/${calcomBookingId}`, {
        data: { 
          reason: reason || 'Cancelled by user',
          cancellationReason: reason || 'User requested cancellation'
        }
      });

      console.log(`✅ Cal.com booking ${calcomBookingId} cancelled successfully`);
      return { success: true };

    }, `cancel booking ${calcomBookingId}`);
  }

  /**
   * Reschedule a Cal.com booking
   */
  async rescheduleBooking(
    calcomBookingId: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.retryOperation(async () => {
      console.log(`🔄 Rescheduling Cal.com booking: ${calcomBookingId}`);

      await this.client.patch(`/bookings/${calcomBookingId}`, {
        start: newStartTime,
        end: newEndTime,
        rescheduleReason: 'User requested reschedule'
      });

      console.log(`✅ Cal.com booking ${calcomBookingId} rescheduled successfully`);
      return { success: true };

    }, `reschedule booking ${calcomBookingId}`);
  }

  /**
   * Get booking details from Cal.com
   */
  async getBookingDetails(calcomBookingId: string): Promise<CalComBooking | null> {
    return this.retryOperation(async () => {
      console.log(`🔍 Fetching Cal.com booking details: ${calcomBookingId}`);

      const response = await this.client.get(`/bookings/${calcomBookingId}`);
      const booking = response.data;

      console.log(`✅ Cal.com booking details retrieved: ${booking.id}`);
      return booking;

    }, `get booking details ${calcomBookingId}`);
  }

  /**
   * Health check for Cal.com service
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: any;
    suggestions?: string[];
  }> {
    try {
      console.log('🏥 Performing Cal.com health check...');

      // Test 1: Basic API connectivity
      const response = await this.client.get('/me');
      const user = response.data;

      // Test 2: Check Google Meet integration
      const integrations = await this.client.get('/integrations').catch(() => ({ data: [] }));
      const hasGoogleMeet = integrations.data?.some((i: any) => 
        i.type === 'google_calendar' || i.type === 'google_meet'
      );

      // Test 3: Check event types
      const eventTypes = await this.client.get('/event-types').catch(() => ({ data: [] }));
      const eventTypeCount = Array.isArray(eventTypes.data) ? eventTypes.data.length : 
                            eventTypes.data?.event_types?.length || 0;

      const details = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          timeZone: user.timeZone
        },
        integrations: {
          hasGoogleMeet,
          totalIntegrations: integrations.data?.length || 0
        },
        eventTypes: {
          count: eventTypeCount
        },
        timestamp: new Date().toISOString()
      };

      const suggestions = [];
      if (!hasGoogleMeet) {
        suggestions.push('Install Google Meet integration in your Cal.com account');
      }
      if (eventTypeCount === 0) {
        suggestions.push('Create at least one event type in your Cal.com account');
      }

      const healthy = !!user && hasGoogleMeet;

      console.log(`${healthy ? '✅' : '⚠️'} Cal.com health check completed - ${healthy ? 'Healthy' : 'Issues detected'}`);

      return {
        healthy,
        details,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

    } catch (error: any) {
      console.error('❌ Cal.com health check failed:', error);
      return {
        healthy: false,
        details: {
          error: error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        },
        suggestions: [
          'Check your Cal.com API key',
          'Verify Cal.com service status',
          'Ensure proper network connectivity'
        ]
      };
    }
  }

  /**
   * Sync mentor availability to Cal.com
   */
  async syncMentorAvailability(mentorId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    return this.retryOperation(async () => {
      console.log(`🔄 Syncing mentor availability for ${mentorId}`);

      const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
      if (!mentorProfile?.weeklySchedule) {
        throw new Error('Mentor profile or weekly schedule not found');
      }

      // Get or create event type
      const eventType = await this.getOrCreateMentorEventType(mentorId, true);

      // Convert mentor's weekly schedule to Cal.com availability format
      const availability = this.convertWeeklyScheduleToCalCom(mentorProfile.weeklySchedule);

      // Update event type with new availability
      await this.client.patch(`/event-types/${eventType.id}`, {
        schedule: availability,
        metadata: {
          ...eventType.metadata,
          lastSync: new Date().toISOString(),
          syncSource: 'MentorMatch'
        }
      });

      console.log(`✅ Mentor availability synced successfully for ${mentorId}`);

      return {
        success: true,
        message: 'Mentor availability synced successfully',
        details: {
          eventTypeId: eventType.id,
          availabilityBlocks: availability.length,
          syncTime: new Date().toISOString()
        }
      };

    }, `sync mentor availability for ${mentorId}`);
  }

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
          if (block.isAvailable && block.startTime && block.endTime) {
            calcomAvailability.push({
              days: [dayMap[day as keyof typeof dayMap]],
              startTime: block.startTime,
              endTime: block.endTime,
              date: null // Recurring availability
            });
          }
        });
      }
    });

    return calcomAvailability;
  }

  /**
   * Clear cache for mentor
   */
  clearMentorCache(mentorId: string): void {
    const cacheKey = `mentor-${mentorId}`;
    this.eventTypeCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
    console.log(`🗑️ Cleared cache for mentor ${mentorId}`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.eventTypeCache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ Cleared all Cal.com caches');
  }
}

export default new CalComService();