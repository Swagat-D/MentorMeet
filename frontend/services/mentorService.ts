// frontend/services/mentorService.ts - Complete Mentor Service Implementation
import ApiService from './api';
export interface MentorProfile {
  _id: string;
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage: string;
  bio?: string;
  expertise: string[];
  subjects: string[];
  location?: string;
  languages: string[];
  pricing: {
    hourlyRate: number;
    currency: string;
    packages?: Array<{
      name: string;
      sessions: number;
      price: number;
      description: string;
    }>;
  };
  rating: number;
  totalSessions: number;
  totalStudents: number;
  isOnline: boolean;
  isVerified: boolean;
  teachingStyles: string[];
  specializations: string[];
  weeklySchedule?: any;
  createdAt: string;
  updatedAt: string;
  lastSeen?: string;
}

export interface MentorSearchFilters {
  expertise?: string[];
  subjects?: string[]; 
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  experience?: number;
  languages?: string[];
  availability?: {
    days?: string[];
    timeSlots?: string[];
  };
  location?: string;    
  isOnline?: boolean;
  isVerified?: boolean;
  sortBy?: 'rating' | 'price' | 'experience' | 'popularity' | 'response_time';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  search?: string;     
}

export interface MentorSearchResult {
  mentors: MentorProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    availableExpertise: string[];
    priceRange: { min: number; max: number };
    availableLanguages: string[];
  };
}

class MentorService {
  private static instance: MentorService;
  private mentorCache: Map<string, { data: MentorProfile; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): MentorService {
    if (!MentorService.instance) {
      MentorService.instance = new MentorService();
    }
    return MentorService.instance;
  }

  /**
   * Search mentors with advanced filtering
   */
  async searchMentors(filters: MentorSearchFilters = {}): Promise<MentorSearchResult> {
    try {
      console.log('🔍 Searching mentors with filters:', filters);

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.expertise?.length) {
        queryParams.append('expertise', filters.expertise.join(','));
      }
      if (filters.priceRange) {
        queryParams.append('minPrice', filters.priceRange.min.toString());
        queryParams.append('maxPrice', filters.priceRange.max.toString());
      }
      if (filters.rating) {
        queryParams.append('minRating', filters.rating.toString());
      }
      if (filters.experience) {
        queryParams.append('minExperience', filters.experience.toString());
      }
      if (filters.languages?.length) {
        queryParams.append('languages', filters.languages.join(','));
      }
      if (filters.isOnline !== undefined) {
        queryParams.append('isOnline', filters.isOnline.toString());
      }
      if (filters.isVerified !== undefined) {
        queryParams.append('isVerified', filters.isVerified.toString());
      }
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      if (filters.page) {
        queryParams.append('page', filters.page.toString());
      }
      if (filters.limit) {
        queryParams.append('limit', filters.limit.toString());
      }

      const url = `${baseUrl}/mentors/search?${queryParams.toString()}`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to search mentors');
      }

      console.log('✅ Mentor search completed successfully:', {
        total: response.data.total,
        returned: response.data.mentors.length
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ Error searching mentors:', error);
      return this.getDefaultSearchResult();
    }
  }

  /**
   * Get featured mentors for home page
   */
  async getFeaturedMentors(limit: number = 6): Promise<MentorProfile[]> {
    try {
      console.log('⭐ Fetching featured mentors...', { limit });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/featured?limit=${limit}`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured mentors');
      }

      // Update cache for featured mentors
      response.data.forEach((mentor: MentorProfile) => {
        this.updateMentorCache(mentor);
      });

      console.log('✅ Featured mentors fetched successfully:', response.data.length);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching featured mentors:', error);
      return this.getDefaultFeaturedMentors();
    }
  }

  /**
   * Get mentor by ID with caching
   */
  async getMentorById(mentorId: string): Promise<MentorProfile | null> {
    try {
      console.log('👤 Fetching mentor by ID:', mentorId);

      // Check cache first
      const cached = this.getMentorFromCache(mentorId);
      if (cached) {
        console.log('📦 Returning cached mentor data');
        return cached;
      }

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/${mentorId}`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch mentor');
      }

      // Update cache
      this.updateMentorCache(response.data);

      console.log('✅ Mentor fetched successfully:', response.data.displayName);
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching mentor:', error);
      return null;
    }
  }

  /**
   * Get trending subjects/expertise areas
   */
  async getTrendingExpertise(limit: number = 10): Promise<string[]> {
    try {
      console.log('📈 Fetching trending expertise...', { limit });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/trending-expertise?limit=${limit}`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trending expertise');
      }

      console.log('✅ Trending expertise fetched successfully:', response.data);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching trending expertise:', error);
      return this.getDefaultTrendingSubjects();
    }
  }

  /**
   * Get mentor availability
   */
  async getMentorAvailability(mentorId: string, date?: string): Promise<any> {
    try {
      console.log('📅 Fetching mentor availability:', { mentorId, date });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = date 
        ? `${baseUrl}/mentors/${mentorId}/availability?date=${date}`
        : `${baseUrl}/mentors/${mentorId}/availability`;
        
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch mentor availability');
      }

      console.log('✅ Mentor availability fetched successfully');
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching mentor availability:', error);
      return { available: false, slots: [] };
    }
  }

  /**
   * Get mentor reviews
   */
  async getMentorReviews(mentorId: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      console.log('⭐ Fetching mentor reviews:', { mentorId, page, limit });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/${mentorId}/reviews?page=${page}&limit=${limit}`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch mentor reviews');
      }

      console.log('✅ Mentor reviews fetched successfully');
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching mentor reviews:', error);
      return { reviews: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  /**
   * Get all available expertise areas
   */
  async getAllExpertise(): Promise<string[]> {
    try {
      console.log('📚 Fetching all expertise areas...');

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/expertise`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expertise areas');
      }

      console.log('✅ Expertise areas fetched successfully:', response.data.length);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching expertise areas:', error);
      return this.getDefaultExpertiseAreas();
    }
  }

  /**
   * Update mentor online status (for real-time updates)
   */
  async updateMentorOnlineStatus(mentorId: string, isOnline: boolean): Promise<void> {
    try {
      // Update cache if mentor exists
      const cacheKey = mentorId;
      const cached = this.mentorCache.get(cacheKey);
      if (cached) {
        cached.data.isOnline = isOnline;
        cached.data.lastSeen = new Date().toISOString();
        this.mentorCache.set(cacheKey, cached);
      }

      console.log(`🔄 Updated mentor ${mentorId} online status: ${isOnline}`);
    } catch (error: any) {
      console.error('❌ Error updating mentor online status:', error);
    }
  }

  /**
   * Cache management methods
   */
  private getMentorFromCache(mentorId: string): MentorProfile | null {
    const cached = this.mentorCache.get(mentorId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private updateMentorCache(mentor: MentorProfile): void {
    this.mentorCache.set(mentor._id, {
      data: mentor,
      timestamp: Date.now()
    });
  }

  public clearCache(): void {
    this.mentorCache.clear();
    console.log('🗑️ Mentor cache cleared');
  }

  /**
   * Default data methods for offline/error scenarios
   */
  private getDefaultSearchResult(): MentorSearchResult {
    return {
      mentors: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      filters: {
        availableExpertise: this.getDefaultExpertiseAreas(),
        priceRange: { min: 10, max: 200 },
        availableLanguages: ['English', 'Spanish', 'French', 'German', 'Chinese']
      }
    };
  }

  private getDefaultFeaturedMentors(): MentorProfile[] {
    return [];
  }

  private getDefaultTrendingSubjects(): string[] {
    return [
      'Mathematics',
      'Programming',
      'Data Science',
      'English',
      'Physics',
      'Business',
      'Design',
      'Music'
    ];
  }

  private getDefaultExpertiseAreas(): string[] {
    return [
      'Mathematics',
      'Science',
      'Programming',
      'Languages',
      'Business',
      'Art & Design',
      'Music',
      'Sports & Fitness',
      'Test Preparation',
      'Career Guidance'
    ];
  }

  /**
   * Real-time mentor tracking
   */
  async trackMentorActivity(mentorIds: string[]): Promise<Map<string, boolean>> {
    try {
      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/activity`;
      const response = await ApiService.postUrl(url, { mentorIds });

      if (!response.success) {
        throw new Error('Failed to track mentor activity');
      }

      const activityMap = new Map<string, boolean>();
      Object.entries(response.data).forEach(([id, isOnline]) => {
        activityMap.set(id, isOnline as boolean);
      });

      return activityMap;
    } catch (error: any) {
      console.error('❌ Error tracking mentor activity:', error);
      return new Map();
    }
  }
}

// Export singleton instance
const mentorService = MentorService.getInstance();
export default mentorService;