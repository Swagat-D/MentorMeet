// services/mentorService.ts - Real-time Database Service (No Mock Data)
import ApiService from './api';

export interface MentorSearchFilters {
  expertise?: string[];
  location?: string;
  languages?: string[];
  rating?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface MentorProfile {
  _id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  bio: string;
  location: string;
  timezone: string;
  languages: string[];
  expertise: string[];
  subjects: Array<{
    name: string;
    level: string;
    experience: string;
  }>;
  teachingStyles: string[];
  specializations: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  pricing?: {
    hourlyRate: number;
    currency: string;
    trialSessionEnabled?: boolean;
    trialSessionRate?: number;
    groupSessionEnabled?: boolean;
    groupSessionRate?: number;
    packageDiscounts?: boolean;
  };
  weeklySchedule?: any;
  preferences?: any;
  isProfileComplete: boolean;
  applicationSubmitted?: boolean;
  profileStep: string;
  rating?: number;
  totalStudents?: number;
  totalSessions?: number;
  profileImage?: string;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  errors?: string[];
}

class MentorService {
  /**
   * Create a new API endpoint to get all mentor profiles
   * This will query the mentorProfiles collection directly
   */
  static async getAllMentorProfiles(): Promise<MentorProfile[]> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      
      // Try the search endpoint first (this should work)
      const url = `${baseUrl}/api/mentors/search`;
      
      console.log('🔍 Fetching all mentor profiles from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ API returned ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<MentorProfile[]> = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Successfully fetched ${result.data.length} mentor profiles`);
        return result.data;
      } else {
        console.warn('⚠️ API returned success=false or no data:', result);
        throw new Error(result.message || 'No mentor data returned');
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching mentor profiles:', error);
      throw error; // Don't catch here, let the calling function handle it
    }
  }

  /**
   * Search for mentors with optional filters - uses real database
   */
  static async searchMentors(filters?: MentorSearchFilters): Promise<MentorProfile[]> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters?.expertise?.length) {
        queryParams.set('expertise', filters.expertise.join(','));
      }
      
      if (filters?.location) {
        queryParams.set('location', filters.location);
      }
      
      if (filters?.languages?.length) {
        queryParams.set('languages', filters.languages.join(','));
      }
      
      if (filters?.rating) {
        queryParams.set('rating', filters.rating.toString());
      }
      
      if (filters?.priceRange) {
        queryParams.set('minPrice', filters.priceRange.min.toString());
        queryParams.set('maxPrice', filters.priceRange.max.toString());
      }

      const url = `${baseUrl}/api/mentors/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔍 Searching mentors with filters:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<MentorProfile[]> = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Found ${result.data.length} mentors with filters`);
        return result.data;
      } else {
        console.warn('⚠️ Search returned no data:', result.message);
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error searching mentors:', error);
      throw error;
    }
  }

  /**
   * Get featured mentors (top-rated) - from real database
   */
  static async getFeaturedMentors(limit: number = 6): Promise<MentorProfile[]> {
    try {
      console.log('🌟 Fetching featured mentors from database...');
      
      // Get all mentors first
      const allMentors = await this.getAllMentorProfiles();
      
      if (allMentors.length === 0) {
        console.log('📭 No mentors found in database');
        return [];
      }
      
      // Filter only completed profiles and sort by rating/students
      const featuredMentors = allMentors
        .filter(mentor => 
          mentor.isProfileComplete && 
          mentor.applicationSubmitted &&
          mentor.subjects?.length > 0 &&
          mentor.teachingStyles?.length > 0
        )
        .sort((a, b) => {
          // Sort by rating first, then by total students
          const aRating = a.rating || 0;
          const bRating = b.rating || 0;
          const aStudents = a.totalStudents || 0;
          const bStudents = b.totalStudents || 0;
          
          if (bRating !== aRating) {
            return bRating - aRating; // Higher rating first
          }
          return bStudents - aStudents; // More students first
        })
        .slice(0, limit);
      
      console.log(`✨ Selected ${featuredMentors.length} featured mentors from ${allMentors.length} total`);
      return featuredMentors;
      
    } catch (error: any) {
      console.error('❌ Error fetching featured mentors:', error);
      throw error;
    }
  }

  /**
   * Get trending expertise areas - calculated from real database
   */
  static async getTrendingExpertise(limit: number = 8): Promise<string[]> {
    try {
      console.log('📈 Calculating trending expertise from database...');
      
      const allMentors = await this.getAllMentorProfiles();
      
      if (allMentors.length === 0) {
        console.log('📭 No mentors found, cannot calculate trending expertise');
        return [];
      }
      
      // Count frequency of each expertise
      const expertiseCount: Record<string, number> = {};
      
      allMentors.forEach(mentor => {
        // Count from expertise array
        if (mentor.expertise?.length) {
          mentor.expertise.forEach(skill => {
            expertiseCount[skill] = (expertiseCount[skill] || 0) + 1;
          });
        }
        
        // Also count from subjects
        if (mentor.subjects?.length) {
          mentor.subjects.forEach(subject => {
            expertiseCount[subject.name] = (expertiseCount[subject.name] || 0) + 1;
          });
        }
      });
      
      // Sort by frequency and return top ones
      const trending = Object.entries(expertiseCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([expertise]) => expertise);
      
      console.log('📈 Trending expertise calculated:', trending);
      return trending;
      
    } catch (error: any) {
      console.error('❌ Error calculating trending expertise:', error);
      throw error;
    }
  }

  /**
   * Get mentors by expertise area - from real database
   */
  static async getMentorsByExpertise(expertise: string, limit?: number): Promise<MentorProfile[]> {
    try {
      console.log(`🎯 Fetching mentors with expertise: ${expertise}`);
      
      const filters: MentorSearchFilters = {
        expertise: [expertise]
      };
      
      const mentors = await this.searchMentors(filters);
      const result = limit ? mentors.slice(0, limit) : mentors;
      
      console.log(`✅ Found ${result.length} mentors with ${expertise} expertise`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ Error fetching mentors for ${expertise}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics - calculated from real database
   */
  static async getDashboardStats(): Promise<{
    totalMentors: number;
    totalExpertiseAreas: number;
    averageRating: number;
    totalLanguages: number;
  }> {
    try {
      console.log('📊 Calculating dashboard stats from database...');
      
      const allMentors = await this.getAllMentorProfiles();
      
      if (allMentors.length === 0) {
        console.log('📭 No mentors found for stats calculation');
        return {
          totalMentors: 0,
          totalExpertiseAreas: 0,
          averageRating: 0,
          totalLanguages: 0,
        };
      }
      
      // Calculate statistics from real data
      const totalMentors = allMentors.length;
      
      // Get unique expertise areas
      const allExpertise = new Set<string>();
      allMentors.forEach(mentor => {
        mentor.expertise?.forEach(skill => allExpertise.add(skill));
        mentor.subjects?.forEach(subject => allExpertise.add(subject.name));
      });
      const totalExpertiseAreas = allExpertise.size;
      
      // Calculate average rating
      const mentorsWithRatings = allMentors.filter(mentor => mentor.rating && mentor.rating > 0);
      const averageRating = mentorsWithRatings.length > 0
        ? mentorsWithRatings.reduce((sum, mentor) => sum + (mentor.rating || 0), 0) / mentorsWithRatings.length
        : 0;
      
      // Get unique languages
      const allLanguages = new Set<string>();
      allMentors.forEach(mentor => {
        mentor.languages?.forEach(lang => allLanguages.add(lang));
      });
      const totalLanguages = allLanguages.size;
      
      const stats = {
        totalMentors,
        totalExpertiseAreas,
        averageRating: Math.round(averageRating * 10) / 10,
        totalLanguages,
      };
      
      console.log('📊 Dashboard stats calculated:', stats);
      return stats;
      
    } catch (error: any) {
      console.error('❌ Error calculating dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get a specific mentor's profile by ID - from real database
   */
  static async getMentorProfile(mentorId: string): Promise<MentorProfile | null> {
    try {
      console.log(`👤 Fetching mentor profile for ID: ${mentorId}`);
      
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/mentors/profile/${mentorId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        console.log('📭 Mentor profile not found');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<MentorProfile> = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Mentor profile loaded successfully');
        return result.data;
      } else {
        console.warn('⚠️ Mentor profile request failed:', result.message);
        return null;
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching mentor profile:', error);
      return null;
    }
  }

  /**
   * Get online mentors - from real database
   */
  static async getOnlineMentors(limit?: number): Promise<MentorProfile[]> {
    try {
      console.log('🟢 Fetching online mentors...');
      
      const allMentors = await this.getAllMentorProfiles();
      const onlineMentors = allMentors.filter(mentor => mentor.isOnline);
      
      const result = limit ? onlineMentors.slice(0, limit) : onlineMentors;
      console.log(`✅ Found ${result.length} online mentors`);
      return result;
      
    } catch (error: any) {
      console.error('❌ Error fetching online mentors:', error);
      throw error;
    }
  }

  /**
   * Check if mentor service is available
   */
  static async isServiceAvailable(): Promise<boolean> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/mentors/search`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ Mentor service unavailable:', error);
      return false;
    }
  }
}

export default MentorService;