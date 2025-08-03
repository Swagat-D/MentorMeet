// backend/src/services/mentorProfile.service.ts - Use Existing mentorProfiles Collection
import mongoose from 'mongoose';

// Interface for mentor profile based on your actual data structure
interface MentorProfile {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  location: string;
  timezone: string;
  languages: string[];
  expertise: string[];
  subjects?: Array<{ 
    name: string; 
    level: string;
    experience: string;
  }>;
  teachingStyles: string[];
  specializations: string[];
  
  // Cal.com Integration Fields (from your existing data)
  hourlyRateINR: number;
  calComUsername: string;
  calComEventTypes: Array<{
    id: number;
    title: string;
    slug: string;
    duration: number;
  }>;
  calComVerified: boolean;
  
  // Profile Status
  isProfileComplete: boolean;
  profileStep: string;
  applicationSubmitted: boolean;
  submittedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

class MentorProfileService {
  private static instance: MentorProfileService;

  public static getInstance(): MentorProfileService {
    if (!MentorProfileService.instance) {
      MentorProfileService.instance = new MentorProfileService();
    }
    return MentorProfileService.instance;
  }

  /**
   * Get the mentorProfiles collection directly
   */
  private getMentorProfilesCollection() {
    if (!mongoose.connection.db) {
        throw new Error('Database connection is not established.');
      }
    return mongoose.connection.db.collection('mentorProfiles');
  }

  /**
   * Find mentor profile by user ID
   */
  async findMentorProfile(userId: string): Promise<MentorProfile | null> {
    try {
      const collection = this.getMentorProfilesCollection();
      const profile = await collection.findOne({ 
        userId: new mongoose.Types.ObjectId(userId) 
      });
      
      return profile as MentorProfile | null;
    } catch (error) {
      console.error('Error finding mentor profile:', error);
      return null;
    }
  }

  /**
   * Find mentor profile by Cal.com username
   */
  async findMentorByCalComUsername(calComUsername: string): Promise<MentorProfile | null> {
    try {
      const collection = this.getMentorProfilesCollection();
      const profile = await collection.findOne({ 
        calComUsername: calComUsername.toLowerCase().trim()
      });
      
      return profile as MentorProfile | null;
    } catch (error) {
      console.error('Error finding mentor by Cal.com username:', error);
      return null;
    }
  }

  /**
   * Get mentor profile with user data by user ID
   */
  async getMentorWithUserData(userId: string): Promise<any> {
    try {
      const collection = this.getMentorProfilesCollection();
      if (!mongoose.connection.db) {
        throw new Error('Database connection is not established.');
      }
      const usersCollection = mongoose.connection.db.collection('users');
      
      // Get mentor profile
      const profile = await collection.findOne({ 
        userId: new mongoose.Types.ObjectId(userId) 
      });
      
      if (!profile) return null;

      // Get user data
      const user = await usersCollection.findOne({
        _id: new mongoose.Types.ObjectId(userId)
      });

      // Transform for frontend compatibility
      return {
        _id: profile._id,
        userId: profile.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        timezone: profile.timezone,
        languages: profile.languages || [],
        expertise: profile.expertise || [],
        subjects: profile.subjects || [],
        teachingStyles: profile.teachingStyles || [],
        specializations: profile.specializations || [],
        
        // Cal.com data
        hourlyRateINR: profile.hourlyRateINR,
        calComUsername: profile.calComUsername,
        calComEventTypes: profile.calComEventTypes || [],
        calComVerified: profile.calComVerified,
        
        // User data
        firstName: profile.firstName || user?.firstName,
        lastName: profile.lastName || user?.lastName,
        email: user?.email,
        avatar: user?.avatar,
        
        // Computed fields for backward compatibility
        rating: 4.8, // Placeholder - implement proper rating system
        totalSessions: 0, // Placeholder - implement from sessions collection
        isOnline: true, // Placeholder - implement real online status
        
        // Legacy pricing for backward compatibility
        pricing: {
          hourlyRate: Math.round(profile.hourlyRateINR * 0.012), // Convert to USD
          currency: 'USD'
        },
        
        isProfileComplete: profile.isProfileComplete,
        profileStep: profile.profileStep,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };
    } catch (error) {
      console.error('Error getting mentor with user data:', error);
      return null;
    }
  }

  /**
   * Find mentors with Cal.com setup (for listing)
   */
  async findMentorsWithSchedule(): Promise<MentorProfile[]> {
    try {
      const collection = this.getMentorProfilesCollection();
      const profiles = await collection.find({
        calComVerified: true,
        isProfileComplete: true,
        calComUsername: { $exists: true, $ne: '' }
      }).toArray();
      
      return profiles as MentorProfile[];
    } catch (error) {
      console.error('Error finding mentors with schedule:', error);
      return [];
    }
  }

  /**
   * Search mentors by expertise or subjects
   */
  async searchMentors(query: {
    expertise?: string[];
    subjects?: string[];
    location?: string;
    maxRate?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    mentors: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        expertise = [],
        subjects = [],
        location,
        maxRate,
        page = 1,
        limit = 10
      } = query;

      const collection = this.getMentorProfilesCollection();
      if (!mongoose.connection.db) {
        throw new Error('Database connection is not established.');
      }
      const usersCollection = mongoose.connection.db.collection('users');

      // Build search filter
      const filter: any = {
        calComVerified: true,
        isProfileComplete: true
      };

      if (expertise.length > 0) {
        filter.expertise = { $in: expertise };
      }

      if (subjects.length > 0) {
        filter['subjects.name'] = { $in: subjects };
      }

      if (location) {
        filter.location = new RegExp(location, 'i');
      }

      if (maxRate) {
        filter.hourlyRateINR = { $lte: maxRate };
      }

      const skip = (page - 1) * limit;

      // Execute search
      const [mentors, total] = await Promise.all([
        collection.find(filter).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      // Get user data for each mentor
      const mentorIds = mentors.map(mentor => mentor.userId);
      const users = await usersCollection.find({
        _id: { $in: mentorIds }
      }).toArray();
      
      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      // Transform results
      const transformedMentors = mentors.map(mentor => {
        const user = userMap.get(mentor.userId.toString());
        
        return {
          _id: mentor._id,
          userId: mentor.userId,
          displayName: mentor.displayName,
          bio: mentor.bio,
          location: mentor.location,
          expertise: mentor.expertise || [],
          subjects: mentor.subjects || [],
          
          // Cal.com data
          hourlyRateINR: mentor.hourlyRateINR,
          calComUsername: mentor.calComUsername,
          calComEventTypes: mentor.calComEventTypes || [],
          
          // User data
          firstName: mentor.firstName || user?.firstName,
          lastName: mentor.lastName || user?.lastName,
          email: user?.email,
          avatar: user?.avatar,
          
          // Computed fields
          rating: 4.8,
          totalSessions: 0,
          isOnline: true,
          
          // Legacy pricing
          pricing: {
            hourlyRate: Math.round(mentor.hourlyRateINR * 0.012),
            currency: 'USD'
          }
        };
      });

      return {
        mentors: transformedMentors,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('Error searching mentors:', error);
      return {
        mentors: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get featured mentors
   */
  async getFeaturedMentors(limit = 6): Promise<any[]> {
    try {
      const collection = this.getMentorProfilesCollection();
      if (!mongoose.connection.db) {
        throw new Error('Database connection is not established.');
      }
      const usersCollection = mongoose.connection.db.collection('users');
      
      const mentors = await collection.find({
        calComVerified: true,
        isProfileComplete: true
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

      // Get user data for each mentor
      const mentorIds = mentors.map(mentor => mentor.userId);
      const users = await usersCollection.find({
        _id: { $in: mentorIds }
      }).toArray();
      
      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      return mentors.map(mentor => {
        const user = userMap.get(mentor.userId.toString());
        
        return {
          _id: mentor._id,
          userId: mentor.userId,
          displayName: mentor.displayName,
          bio: mentor.bio,
          expertise: mentor.expertise || [],
          hourlyRateINR: mentor.hourlyRateINR,
          calComUsername: mentor.calComUsername,
          
          // User data
          firstName: mentor.firstName || user?.firstName,
          lastName: mentor.lastName || user?.lastName,
          
          // Computed fields
          rating: 4.8,
          totalSessions: 0,
          isOnline: true
        };
      });

    } catch (error) {
      console.error('Error getting featured mentors:', error);
      return [];
    }
  }

  /**
   * Update mentor profile
   */
  async updateProfile(
    userId: string, 
    updateData: any
  ): Promise<MentorProfile | null> {
    try {
      const collection = this.getMentorProfilesCollection();
      
      const result = await collection.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      return result?.value as MentorProfile | null;
    } catch (error) {
      console.error('Error updating mentor profile:', error);
      return null;
    }
  }

  /**
   * Validate Cal.com integration
   */
  async validateCalComIntegration(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    try {
      const profile = await this.findMentorProfile(userId);
      
      if (!profile) {
        return {
          isValid: false,
          issues: ['Mentor profile not found']
        };
      }

      const issues: string[] = [];

      if (!profile.calComUsername) {
        issues.push('Cal.com username not set');
      }

      if (!profile.calComEventTypes || profile.calComEventTypes.length === 0) {
        issues.push('No Cal.com event types configured');
      }

      if (!profile.calComVerified) {
        issues.push('Cal.com integration not verified');
      }

      if (!profile.hourlyRateINR || profile.hourlyRateINR < 500) {
        issues.push('Invalid hourly rate');
      }

      return {
        isValid: issues.length === 0,
        issues
      };

    } catch (error) {
      console.error('Error validating Cal.com integration:', error);
      return {
        isValid: false,
        issues: ['Validation failed due to server error']
      };
    }
  }
}

export default MentorProfileService.getInstance();