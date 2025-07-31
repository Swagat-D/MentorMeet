// backend/src/services/mentorProfile.service.ts - Service to handle mentorProfiles collection
import mongoose from 'mongoose';

// Create the schema only once using a singleton pattern
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
      
      const MentorProfile = this.getMentorProfileModel();
      const mentorProfile = await MentorProfile.findOne({ 
        userId: new mongoose.Types.ObjectId(userId) 
      });
      
      console.log('📋 Query result:', {
        found: !!mentorProfile,
        searchedUserId: userId,
        foundProfileId: mentorProfile?._id,
        foundUserId: mentorProfile?.userId
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
      const MentorProfile = this.getMentorProfileModel();
      return await MentorProfile.findById(profileId);
    } catch (error) {
      console.error('❌ Error finding mentor profile by _id:', error);
      return null;
    }
  }

  /**
   * Find mentor profile (try userId first, then _id)
   */
  static async findMentorProfile(mentorId: string) {
    try {
      console.log('🔍 Looking for mentor profile with mentorId:', mentorId);

      // First try to find by userId (this is the correct way)
      let mentorProfile = await this.findByUserId(mentorId);
      
      if (mentorProfile) {
        console.log('✅ Mentor profile found by userId:', {
          profileId: mentorProfile._id,
          userId: mentorProfile.userId,
          displayName: mentorProfile.displayName,
          hasWeeklySchedule: !!mentorProfile.weeklySchedule,
          hasPricing: !!mentorProfile.pricing
        });
        return mentorProfile;
      }

      // If not found by userId, try by _id as fallback
      console.log('🔄 Not found by userId, trying by _id...');
      mentorProfile = await this.findById(mentorId);
      
      if (mentorProfile) {
        console.log('⚠️ Mentor profile found by _id (unusual):', {
          profileId: mentorProfile._id,
          userId: mentorProfile.userId,
          displayName: mentorProfile.displayName
        });
        return mentorProfile;
      }

      console.log('❌ Mentor profile not found by userId or _id');
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
      const MentorProfile = this.getMentorProfileModel();
      return await MentorProfile.find({
        weeklySchedule: { $exists: true, $ne: null },
        'weeklySchedule.monday': { $exists: true },
      }).select('userId displayName weeklySchedule pricing');
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
      const MentorProfile = this.getMentorProfileModel();
      return await MentorProfile.findByIdAndUpdate(profileId, updateData, { new: true });
    } catch (error) {
      console.error('❌ Error updating mentor profile:', error);
      return null;
    }
  }

  /**
   * Get mentor profile stats
   */
  static async getProfileStats(mentorId: string) {
    try {
      const mentorProfile = await this.findMentorProfile(mentorId);
      if (!mentorProfile) return null;

      const stats = {
        hasProfile: true,
        hasWeeklySchedule: !!mentorProfile.weeklySchedule,
        hasPricing: !!mentorProfile.pricing,
        isProfileComplete: mentorProfile.isProfileComplete || false,
        applicationSubmitted: mentorProfile.applicationSubmitted || false,
        totalAvailableSlots: 0,
        daysWithAvailability: 0
      };

      // Calculate available slots
      if (mentorProfile.weeklySchedule) {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        daysOfWeek.forEach(day => {
          const daySchedule = mentorProfile.weeklySchedule[day];
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
}

export default MentorProfileService;