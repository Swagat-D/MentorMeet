// backend/src/services/calcom.service.ts - Cal.com API v2 Integration
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import MentorProfileService from './mentorProfile.service';

interface CalComConfig {
  apiKey: string;
  baseUrl: string;
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
}

interface CalComBooking {
  id: number;
  uid: string;
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
  private eventTypeCache: Map<string, CalComEventType[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.config = {
      apiKey: process.env.CALCOM_API_KEY || '',
      baseUrl: 'https://api.cal.com/v2',
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

    console.log('✅ Cal.com service initialized with API v2');
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

  private delay(ms: number): Promise<void> {
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
   * Get mentor's event types by Cal.com username
   */
  async getMentorEventTypes(calComUsername: string): Promise<CalComEventType[]> {
    const cacheKey = `eventTypes-${calComUsername}`;
    
    // Check cache
    if (this.eventTypeCache.has(cacheKey)) {
      const cachedTime = this.cacheExpiry.get(cacheKey) || 0;
      if (Date.now() - cachedTime < this.CACHE_TTL) {
        console.log('📦 Using cached event types for:', calComUsername);
        return this.eventTypeCache.get(cacheKey)!;
      }
    }

    return this.retryOperation(async () => {
      console.log(`🔍 Fetching event types for Cal.com user: ${calComUsername}`);

      // Use Cal.com API v2 to get event types
      const response = await this.client.get(`/event-types?username=${calComUsername}`);
      
      const eventTypes = response.data?.data?.eventTypes || [];
      
      // Filter only active and public event types
      const activeEventTypes = eventTypes.filter((et: any) => 
        !et.hidden && et.length > 0
      ).map((et: any) => ({
        id: et.id,
        title: et.title,
        slug: et.slug,
        length: et.length,
        description: et.description,
        price: et.price,
        currency: et.currency || 'USD'
      }));

      console.log(`✅ Found ${activeEventTypes.length} active event types for ${calComUsername}`);

      // Cache the results
      this.eventTypeCache.set(cacheKey, activeEventTypes);
      this.cacheExpiry.set(cacheKey, Date.now());

      return activeEventTypes;
    }, `get event types for ${calComUsername}`);
  }

  /**
   * Get available slots for a specific event type and date using Cal.com API v2
   */
  async getAvailableSlots(calComUsername: string, eventTypeId: number, date: string): Promise<TimeSlot[]> {
    return this.retryOperation(async () => {
      console.log(`📅 Fetching available slots for ${calComUsername}, event type ${eventTypeId}, date ${date}`);

      // Format date range for Cal.com API v2
      const startTime = `${date}T00:00:00.000Z`;
      const endTime = `${date}T23:59:59.999Z`;

      // Get availability from Cal.com API v2
      const response = await this.client.get('/slots/available', {
        params: {
          eventTypeId,
          startTime,
          endTime,
          timeZone: 'Asia/Kolkata'
        }
      });

      const slots = response.data?.data?.slots || [];
      
      console.log(`📊 Cal.com returned ${slots.length} available slots`);

      // Get event type details for pricing
      const eventTypes = await this.getMentorEventTypes(calComUsername);
      const eventType = eventTypes.find(et => et.id === eventTypeId);
      
      if (!eventType) {
        throw new Error(`Event type ${eventTypeId} not found for ${calComUsername}`);
      }

      // Get mentor profile for pricing
      const mentorProfile = await MentorProfileService.findMentorByCalComUsername(calComUsername);
      const hourlyRate = mentorProfile?.hourlyRateINR || 2000;
      const sessionPrice = Math.round((hourlyRate / 60) * eventType.length);

      // Transform Cal.com slots to our format
      const transformedSlots: TimeSlot[] = slots.map((slot: any, index: number) => {
        const startTime = new Date(slot.time);
        const endTime = new Date(startTime.getTime() + (eventType.length * 60 * 1000));

        return {
          id: `calcom-${eventTypeId}-${startTime.getTime()}-${index}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          date,
          isAvailable: true,
          price: sessionPrice,
          duration: eventType.length,
          sessionType: 'video' as const,
          eventTypeId
        };
      });

      console.log(`✅ Returning ${transformedSlots.length} available slots`);
      return transformedSlots;

    }, `get available slots for ${calComUsername}`);
  }

  /**
   * Create booking using Cal.com API v2
   */
  async createBooking(bookingData: {
    eventTypeId: number;
    startTime: string;
    endTime: string;
    attendeeEmail: string;
    attendeeName: string;
    notes?: string;
    metadata?: any;
  }): Promise<{
    success: boolean;
    booking?: CalComBooking;
    meetingUrl?: string;
    calendarEventId?: string;
    error?: string;
  }> {
    return this.retryOperation(async () => {
      console.log(`📝 Creating Cal.com booking for event type ${bookingData.eventTypeId}`);

      // Create booking via Cal.com API v2
      const response = await this.client.post('/bookings', {
        eventTypeId: bookingData.eventTypeId,
        start: bookingData.startTime,
        end: bookingData.endTime,
        attendees: [
          {
            name: bookingData.attendeeName,
            email: bookingData.attendeeEmail,
            timeZone: 'Asia/Kolkata'
          }
        ],
        metadata: {
          ...bookingData.metadata,
          platform: 'MentorMatch',
          bookingTime: new Date().toISOString()
        },
        notes: bookingData.notes || '',
        timeZone: 'Asia/Kolkata'
      });

      const booking = response.data?.data;

      if (!booking) {
        throw new Error('No booking data returned from Cal.com');
      }

      console.log(`✅ Cal.com booking created: ${booking.id}`);

      // Extract meeting URL from booking
      const meetingUrl = this.extractMeetingUrl(booking);

      if (!meetingUrl) {
        console.warn('⚠️ No meeting URL found in Cal.com response');
        throw new Error(
          'Cal.com booking created but no Google Meet URL was provided. ' +
          'Please ensure Google Meet integration is properly configured.'
        );
      }

      console.log(`🎥 Google Meet URL extracted successfully`);

      return {
        success: true,
        booking,
        meetingUrl,
        calendarEventId: booking.uid
      };

    }, `create booking for event type ${bookingData.eventTypeId}`);
  }

  /**
   * Cancel booking using Cal.com API v2
   */
  async cancelBooking(
    bookingUid: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.retryOperation(async () => {
      console.log(`❌ Cancelling Cal.com booking: ${bookingUid}`);

      await this.client.delete(`/bookings/${bookingUid}`, {
        data: { 
          reason: reason || 'Cancelled by user'
        }
      });

      console.log(`✅ Cal.com booking ${bookingUid} cancelled successfully`);
      return { success: true };

    }, `cancel booking ${bookingUid}`);
  }

  /**
   * Get booking details from Cal.com
   */
  async getBookingDetails(bookingUid: string): Promise<CalComBooking | null> {
    return this.retryOperation(async () => {
      console.log(`🔍 Fetching Cal.com booking details: ${bookingUid}`);

      const response = await this.client.get(`/bookings/${bookingUid}`);
      const booking = response.data?.data;

      console.log(`✅ Cal.com booking details retrieved: ${booking?.id}`);
      return booking;

    }, `get booking details ${bookingUid}`);
  }

  /**
   * Extract meeting URL from Cal.com booking response
   */
  private extractMeetingUrl(booking: any): string | null {
    // Method 1: Direct meetingUrl field
    if (booking.meetingUrl) {
      return booking.meetingUrl;
    }

    // Method 2: Check location object
    if (booking.location) {
      if (typeof booking.location === 'string' && booking.location.includes('meet.google.com')) {
        return booking.location;
      }
      if (booking.location.link && booking.location.link.includes('meet.google.com')) {
        return booking.location.link;
      }
      if (booking.location.meetingUrl) {
        return booking.location.meetingUrl;
      }
    }

    // Method 3: Check references array
    if (booking.references && Array.isArray(booking.references)) {
      for (const ref of booking.references) {
        if (ref.meetingUrl && ref.meetingUrl.includes('meet.google.com')) {
          return ref.meetingUrl;
        }
        if (ref.type === 'google_meet' && ref.uid) {
          return ref.uid;
        }
      }
    }

    // Method 4: Check attendees for meeting data
    if (booking.attendees && Array.isArray(booking.attendees)) {
      for (const attendee of booking.attendees) {
        if (attendee.meetingUrl) {
          return attendee.meetingUrl;
        }
      }
    }

    return null;
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

      // Test basic API connectivity
      const response = await this.client.get('/me');
      const user = response.data?.data;

      const details = {
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          timeZone: user?.timeZone
        },
        apiVersion: 'v2',
        timestamp: new Date().toISOString()
      };

      const healthy = !!user;

      console.log(`${healthy ? '✅' : '⚠️'} Cal.com health check completed - ${healthy ? 'Healthy' : 'Issues detected'}`);

      return {
        healthy,
        details,
        suggestions: healthy ? undefined : [
          'Check your Cal.com API key',
          'Verify Cal.com service status',
          'Ensure proper network connectivity'
        ]
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
   * Clear cache
   */
  clearCache(): void {
    this.eventTypeCache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ Cleared all Cal.com caches');
  }
}

export default new CalComService();