// backend/src/services/mentorProfile.service.ts - Service to handle mentorProfiles collection
import mongoose from 'mongoose';

// Create the schema only once using a singleton pattern
interface MentorProfile {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  displayName?: string;
  weeklySchedule?: { [key: string]: any[] };
  pricing?: { hourlyRate?: number; currency?: string };
  isProfileComplete?: boolean;
  applicationSubmitted?: boolean;
  bio?: string;
  location?: string;
  expertise?: string[];
  updatedAt?: Date;
  [key: string]: any;
}

class MentorProfileService {
  private static mentorProfileModel: mongoose.Model<any> | null = null;

  private static getMentorProfileModel() {
    if (!this.mentorProfileModel) {
      // Check if model already exists
      if (mongoose.models.MentorProfile) {
        this.mentorProfileModel = mongoose.models.MentorProfile;
      } else {
        // Create schema for existing collection
        const mentorProfileSchema = new mongoose.Schema({}, { 
          strict: false,
          collection: 'mentorProfiles' // Explicitly set collection name
        });
        
        this.mentorProfileModel = mongoose.model('MentorProfile', mentorProfileSchema);
      }
    }
    return this.mentorProfileModel;
  }

  /**
   * Find mentor profile by userId
   */
  static async findByUserId(userId: string) {
    try {
      console.log('🔍 Searching mentorProfiles by userId:', userId);
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log('❌ Invalid ObjectId format:', userId);
        return null;
      }

      const MentorProfile = this.getMentorProfileModel();
      const mentorProfile = await MentorProfile.findOne({ 
        userId: new mongoose.Types.ObjectId(userId) 
      }).lean().exec();
      
      console.log('📋 Query result:', {
        found: !!mentorProfile,
        searchedUserId: userId,
        foundProfileId: (!Array.isArray(mentorProfile) && mentorProfile?._id) ? mentorProfile._id.toString() : undefined,
        foundUserId: (!Array.isArray(mentorProfile) && mentorProfile?.userId) ? mentorProfile.userId.toString() : undefined,
        displayName: (!Array.isArray(mentorProfile) && mentorProfile?.displayName) ? mentorProfile.displayName : undefined
      });
      
      return mentorProfile;
    } catch (error) {
      console.error('❌ Error finding mentor profile by userId:', error);
      return null;
    }
  }

  /**
   * Find mentor profile by _id
   */
  static async findById(profileId: string) {
    try {
      console.log('🔍 Searching mentorProfiles by _id:', profileId);
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(profileId)) {
        console.log('❌ Invalid ObjectId format:', profileId);
        return null;
      }

      const MentorProfile = this.getMentorProfileModel();
      const mentorProfile = await MentorProfile.findById(profileId).lean().exec();
      
      console.log('📋 Query result:', {
        found: !!mentorProfile,
        searchedId: profileId,
        foundProfileId: (!Array.isArray(mentorProfile) && mentorProfile?._id) ? mentorProfile._id.toString() : undefined,
        displayName: (!Array.isArray(mentorProfile) && mentorProfile?.displayName) ? mentorProfile.displayName : undefined
      });
      
      return mentorProfile;
    } catch (error) {
      console.error('❌ Error finding mentor profile by _id:', error);
      return null;
    }
  }

  /**
   * Find mentor profile (primary method - tries userId first, then _id)
   */
  static async findMentorProfile(mentorId: string) {
    try {
      console.log('🔍 Looking for mentor profile with mentorId:', mentorId);

      // Validate input
      if (!mentorId || typeof mentorId !== 'string') {
        console.log('❌ Invalid mentorId provided:', mentorId);
        return null;
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        console.log('❌ Invalid ObjectId format:', mentorId);
        return null;
      }

      // First try to find by userId (this is the correct way for booking)
      let mentorProfile = await this.findByUserId(mentorId);
      
      if (mentorProfile && !Array.isArray(mentorProfile)) {
        const mp = mentorProfile as MentorProfile;
        console.log('✅ Mentor profile found by userId:', {
          profileId: mp._id?.toString(),
          userId: mp.userId?.toString(),
          displayName: mp.displayName,
          hasWeeklySchedule: !!mp.weeklySchedule,
          hasPricing: !!mp.pricing,
          isProfileComplete: mp.isProfileComplete,
          applicationSubmitted: mp.applicationSubmitted
        });
        return mp;
      }

      // If not found by userId, try by _id as fallback
      console.log('🔄 Not found by userId, trying by _id...');
      mentorProfile = await this.findById(mentorId);
      
      if (mentorProfile && !Array.isArray(mentorProfile)) {
        const mp = mentorProfile as MentorProfile;
        console.log('⚠️ Mentor profile found by _id (unusual case):', {
          profileId: mp._id?.toString(),
          userId: mp.userId?.toString(),
          displayName: mp.displayName,
          hasWeeklySchedule: !!mp.weeklySchedule,
          hasPricing: !!mp.pricing
        });
        return mp;
      }

      console.log('❌ Mentor profile not found by userId or _id');
      
      // Additional debugging - let's see what profiles exist
      const totalProfiles = await this.getMentorProfileModel().countDocuments();
      console.log('📊 Debug info:', {
        totalProfilesInCollection: totalProfiles,
        searchedMentorId: mentorId,
        mentorIdType: typeof mentorId,
        mentorIdLength: mentorId.length
      });
      
      return null;
      
    } catch (error) {
      console.error('❌ Error in findMentorProfile:', error);
      return null;
    }
  }

  /**
   * Find all mentors with weekly schedules
   */
  static async findMentorsWithSchedule() {
    try {
      console.log('🔍 Finding mentors with schedules...');
      
      const MentorProfile = this.getMentorProfileModel();
      const mentors = await MentorProfile.find({
        weeklySchedule: { $exists: true, $ne: null },
        isProfileComplete: true,
        applicationSubmitted: true
      })
      .select('userId displayName weeklySchedule pricing isProfileComplete applicationSubmitted')
      .lean()
      .exec();
      
      console.log('✅ Found mentors with schedules:', mentors.length);
      return mentors;
    } catch (error) {
      console.error('❌ Error finding mentors with schedule:', error);
      return [];
    }
  }

  /**
   * Update mentor profile
   */
  static async updateProfile(profileId: string, updateData: any) {
    try {
      console.log('📝 Updating mentor profile:', profileId);
      
      if (!mongoose.Types.ObjectId.isValid(profileId)) {
        console.log('❌ Invalid profileId format:', profileId);
        return null;
      }

      const MentorProfile = this.getMentorProfileModel();
      const updatedProfile = await MentorProfile.findByIdAndUpdate(
        profileId, 
        { 
          ...updateData,
          updatedAt: new Date()
        }, 
        { 
          new: true,
          lean: true
        }
      ).exec();
      
      if (updatedProfile) {
        console.log('✅ Mentor profile updated successfully');
      } else {
        console.log('❌ Mentor profile not found for update');
      }
      const mentorProfileResult = await this.findMentorProfile(profileId);
      const mentorProfile = mentorProfileResult as MentorProfile | null;
      if (!mentorProfile) {
        console.log('❌ Mentor profile not found for stats');
        return null;
      }

      const stats = {
        hasProfile: true,
        hasWeeklySchedule: !!(mentorProfile.weeklySchedule && Object.keys(mentorProfile.weeklySchedule).length > 0),
        hasPricing: !!(mentorProfile.pricing?.hourlyRate && mentorProfile.pricing?.hourlyRate > 0),
        isProfileComplete: mentorProfile.isProfileComplete || false,
        applicationSubmitted: mentorProfile.applicationSubmitted || false,
        totalAvailableSlots: 0,
        daysWithAvailability: 0,
        hourlyRate: mentorProfile.pricing?.hourlyRate || 0,
        currency: mentorProfile.pricing?.currency || 'USD'
      };

      // Calculate available slots
      if (mentorProfile.weeklySchedule) {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        daysOfWeek.forEach(day => {
          const daySchedule = mentorProfile.weeklySchedule?.[day];
          if (Array.isArray(daySchedule) && daySchedule.length > 0) {
            const availableSlots = daySchedule.filter(slot => slot.isAvailable === true);
            if (availableSlots.length > 0) {
              stats.daysWithAvailability++;
              stats.totalAvailableSlots += availableSlots.length;
            }
          }
        });
      }
      // Calculate available slots
      if (mentorProfile.weeklySchedule) {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        daysOfWeek.forEach(day => {
          const daySchedule = mentorProfile.weeklySchedule?.[day];
          if (Array.isArray(daySchedule) && daySchedule.length > 0) {
            const availableSlots = daySchedule.filter(slot => slot.isAvailable === true);
            if (availableSlots.length > 0) {
              stats.daysWithAvailability++;
              stats.totalAvailableSlots += availableSlots.length;
            }
          }
        });
      }

      console.log('✅ Profile stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting profile stats:', error);
      return null;
    }
  }

  /**
   * Get profile statistics for a mentor
   */
  static async getProfileStats(mentorId: string) {
    try {
      const mentorProfileResult = await this.findMentorProfile(mentorId);
      const mentorProfile = mentorProfileResult as MentorProfile | null;
      if (!mentorProfile) {
        return null;
      }

      const stats = {
        hasProfile: true,
        hasWeeklySchedule: !!(mentorProfile.weeklySchedule && Object.keys(mentorProfile.weeklySchedule).length > 0),
        hasPricing: !!(mentorProfile.pricing?.hourlyRate && mentorProfile.pricing?.hourlyRate > 0),
        isProfileComplete: mentorProfile.isProfileComplete || false,
        applicationSubmitted: mentorProfile.applicationSubmitted || false,
        totalAvailableSlots: 0,
        daysWithAvailability: 0,
        hourlyRate: mentorProfile.pricing?.hourlyRate || 0,
        currency: mentorProfile.pricing?.currency || 'USD'
      };

      // Calculate available slots
      if (mentorProfile.weeklySchedule) {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        daysOfWeek.forEach(day => {
          const daySchedule = mentorProfile.weeklySchedule?.[day];
          if (Array.isArray(daySchedule) && daySchedule.length > 0) {
            const availableSlots = daySchedule.filter(slot => slot.isAvailable === true);
            if (availableSlots.length > 0) {
              stats.daysWithAvailability++;
              stats.totalAvailableSlots += availableSlots.length;
            }
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting profile stats:', error);
      return null;
    }
  }

  /**
   * Check if mentor profile exists and is ready for bookings
   */
  static async isBookingReady(mentorId: string) {
    try {
      const stats = await this.getProfileStats(mentorId);
      if (!stats) return false;
      
      const isReady = stats.hasProfile && 
                     stats.hasWeeklySchedule && 
                     stats.hasPricing && 
                     stats.isProfileComplete && 
                     stats.applicationSubmitted &&
                     stats.totalAvailableSlots > 0;
      
      console.log('🎯 Booking readiness check:', {
        mentorId,
        isReady,
        reasons: !isReady ? {
          hasProfile: stats.hasProfile,
          hasWeeklySchedule: stats.hasWeeklySchedule,
          hasPricing: stats.hasPricing,
          isProfileComplete: stats.isProfileComplete,
          applicationSubmitted: stats.applicationSubmitted,
          hasAvailableSlots: stats.totalAvailableSlots > 0
        } : null
      });
      
      return isReady;
    } catch (error) {
      console.error('❌ Error checking booking readiness:', error);
      return false;
    }
  }

  /**
   * Get collection statistics
   */
  static async getCollectionStats() {
    try {
      const MentorProfile = this.getMentorProfileModel();
      
      const [total, completed, withSchedule, withPricing] = await Promise.all([
        MentorProfile.countDocuments(),
        MentorProfile.countDocuments({ isProfileComplete: true }),
        MentorProfile.countDocuments({ weeklySchedule: { $exists: true, $ne: null } }),
        MentorProfile.countDocuments({ 'pricing.hourlyRate': { $gt: 0 } })
      ]);
      
      const stats = {
        totalProfiles: total,
        completedProfiles: completed,
        profilesWithSchedule: withSchedule,
        profilesWithPricing: withPricing,
        readyForBooking: 0 // Will be calculated separately if needed
      };
      
      console.log('📊 Collection stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting collection stats:', error);
      return {
        totalProfiles: 0,
        completedProfiles: 0,
        profilesWithSchedule: 0,
        profilesWithPricing: 0,
        readyForBooking: 0
      };
    }
  }

  /**
   * Search mentor profiles with filters
   */
  static async searchProfiles(filters: {
    expertise?: string[];
    location?: string;
    priceRange?: { min: number; max: number };
    isComplete?: boolean;
    hasSchedule?: boolean;
    limit?: number;
    skip?: number;
  } = {}) {
    try {
      console.log('🔍 Searching mentor profiles with filters:', filters);
      
      const MentorProfile = this.getMentorProfileModel();
      const query: any = {};
      
      // Build query
      if (filters.expertise && filters.expertise.length > 0) {
        query.expertise = { $in: filters.expertise };
      }
      
      if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
      }
      
      if (filters.priceRange) {
        query['pricing.hourlyRate'] = {
          $gte: filters.priceRange.min,
          $lte: filters.priceRange.max
        };
      }
      
      if (filters.isComplete !== undefined) {
        query.isProfileComplete = filters.isComplete;
      }
      
      if (filters.hasSchedule) {
        query.weeklySchedule = { $exists: true, $ne: null };
      }
      
      const profiles = await MentorProfile.find(query)
        .select('userId displayName bio location expertise pricing weeklySchedule isProfileComplete')
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .sort({ updatedAt: -1 })
        .lean()
        .exec();
      
      console.log('✅ Found mentor profiles:', profiles.length);
      return profiles;
    } catch (error) {
      console.error('❌ Error searching mentor profiles:', error);
      return [];
    }
  }
}

export default MentorProfileService;