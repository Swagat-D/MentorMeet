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
  location?: string;
  timezone?: string;
  languages: string[];
  achievements?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
  expertise: string[];
  subjects: Array<{
    name: string;
    level: string;
    experience: string;
  }> | string[];
  teachingStyles: string[];
  specializations: string[];
  pricing: {
    hourlyRate: number;
    currency: string;
    trialSessionEnabled?: boolean;
    trialSessionRate?: number;
    groupSessionEnabled?: boolean;
    groupSessionRate?: number;
    packageDiscounts?: boolean;
    packages?: Array<{
      name: string;
      sessions: number;
      price: number;
      description: string;
    }>;
  };
  preferences: {
    sessionLength?: string;
    advanceBooking?: string;
    maxStudentsPerWeek?: number;
    preferredSessionType?: string;
    cancellationPolicy?: string;
  };
  weeklySchedule: {
    [key: string]: {
      isAvailable: boolean;
      timeSlots: Array<{
        id: string;
        startTime: string;
        endTime: string; 
      }>;
    };
  };
  isProfileComplete: boolean;
  applicationSubmitted: boolean;
  profileStep: string;
  submittedAt?: string;
  
  // Calculated/default fields
  rating: number;
  totalSessions: number;
  totalStudents: number;
  isOnline: boolean;
  isVerified: boolean;
  lastSeen?: string;
  responseTime?: number;
  
  createdAt: string;
  updatedAt: string;
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
    availableSubjects: string[];
    availableLanguages: string[];
    priceRange: { min: number; max: number };
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
      if (filters.subjects?.length) {
        queryParams.append('subjects', filters.subjects.join(','));
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
      if (filters.location) {
        queryParams.append('location', filters.location);
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
      if (filters.search) {
        queryParams.append('search', filters.search);
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
        console.log('❌ Featured mentors API failed, trying search fallback...');
        // Fallback to search if featured endpoint fails
        const searchResult = await this.searchMentors({ limit, sortBy: 'rating', sortOrder: 'desc' });
        return searchResult.mentors.slice(0, limit);
      }

      // Update cache for featured mentors
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((mentor: MentorProfile) => {
          this.updateMentorCache(mentor);
        });
      }

      console.log('✅ Featured mentors fetched successfully:', response.data?.length || 0);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching featured mentors:', error);
      // Try search as fallback
      try {
        console.log('🔄 Attempting search fallback for featured mentors...');
        const searchResult = await this.searchMentors({ limit, sortBy: 'rating', sortOrder: 'desc' });
        return searchResult.mentors.slice(0, limit);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
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
        console.log('❌ Trending expertise API failed, using defaults...');
        return this.getDefaultTrendingSubjects().slice(0, limit);
      }

      console.log('✅ Trending expertise fetched successfully:', response.data?.length || 0);
      return response.data || this.getDefaultTrendingSubjects().slice(0, limit);

    } catch (error: any) {
      console.error('❌ Error fetching trending expertise:', error);
      return this.getDefaultTrendingSubjects().slice(0, limit);
    }
  }

  /**
   * Get mentor availability
   */
  async getMentorAvailability(mentorId: string, date?: string): Promise<any> {
    try {
      console.log('📅 Fetching mentor availability:', { mentorId, date });

      const mentor = await this.getMentorById(mentorId);
      if (!mentor) {
        throw new Error('Mentor not found');
      }

      // For now, return the weekly schedule from the mentor profile
      // In the future, this could be enhanced with actual booking data
      const availability = {
        mentorId,
        weeklySchedule: mentor.weeklySchedule || {},
        timezone: mentor.timezone || 'UTC',
        preferences: mentor.preferences || {}
      };

      console.log('✅ Mentor availability fetched successfully');
      return availability;

    } catch (error: any) {
      console.error('❌ Error fetching mentor availability:', error);
      return { available: false, slots: [], weeklySchedule: {} };
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
        console.log('❌ Expertise API failed, using defaults...');
        return this.getDefaultExpertiseAreas();
      }

      console.log('✅ Expertise areas fetched successfully:', response.data?.length || 0);
      return response.data || this.getDefaultExpertiseAreas();

    } catch (error: any) {
      console.error('❌ Error fetching expertise areas:', error);
      return this.getDefaultExpertiseAreas();
    }
  }

  /**
   * Get mentor statistics
   */
  async getMentorStats(): Promise<any> {
    try {
      console.log('📊 Fetching mentor statistics...');

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = `${baseUrl}/mentors/stats/overview`;
      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch mentor statistics');
      }

      console.log('✅ Mentor statistics fetched successfully');
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching mentor statistics:', error);
      return {
        totalMentors: 0,
        activeMentors: 0,
        onlineMentors: 0,
        verifiedMentors: 0,
        averageRating: 4.5
      };
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
        availableSubjects: this.getDefaultSubjects(),
        priceRange: { min: 10, max: 200 },
        availableLanguages: ['English', 'Hindi', 'Bengali', 'Spanish', 'French']
      }
    };
  }

  private getDefaultTrendingSubjects(): string[] {
    return [
      'Mathematics',
      'Algebra',
      'Programming',
      'Data Science',
      'English',
      'Physics',
      'Business',
      'Design'
    ];
  }

  private getDefaultExpertiseAreas(): string[] {
    return [
      'Mathematics',
      'Algebra',
      'Science',
      'Programming',
      'Languages',
      'Business',
      'Art & Design',
      'Music',
      'Test Preparation',
      'Career Guidance'
    ];
  }

  private getDefaultSubjects(): string[] {
    return [
      'Mathematics',
      'Algebra',
      'Calculus',
      'Physics',
      'Chemistry',
      'English',
      'Programming',
      'Data Science'
    ];
  }

  /**
   * Helper function to normalize subject data
   */
  private normalizeSubjects(subjects: any[]): string[] {
    if (!subjects || !Array.isArray(subjects)) return [];
    
    return subjects.map(subject => {
      if (typeof subject === 'string') return subject;
      if (subject && subject.name) return subject.name;
      return 'General';
    });
  }

  /**
   * Format mentor data for consistent frontend usage
   */
  private formatMentorData(mentorData: any): MentorProfile {
    return {
      ...mentorData,
      subjects: this.normalizeSubjects(mentorData.subjects),
      profileImage: mentorData.profileImage || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorData.displayName || mentorData.firstName)}&background=8B4513&color=fff&size=200`,
      rating: mentorData.rating || 4.5,
      totalSessions: mentorData.totalSessions || 0,
      totalStudents: mentorData.totalStudents || 0,
      isOnline: mentorData.isOnline || false,
      isVerified: mentorData.isVerified || false,
      responseTime: mentorData.responseTime || 60,
      languages: mentorData.languages || ['English'],
      expertise: mentorData.expertise || [],
      teachingStyles: mentorData.teachingStyles || [],
      specializations: mentorData.specializations || [],
      socialLinks: mentorData.socialLinks || {},
      preferences: mentorData.preferences || {},
      weeklySchedule: mentorData.weeklySchedule || {}
    };
  }
}

// Export singleton instance
const mentorService = MentorService.getInstance();
export default mentorService;