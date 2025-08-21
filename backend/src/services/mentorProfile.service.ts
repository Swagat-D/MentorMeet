import mongoose, { Document } from 'mongoose';
import User from '../models/User.model';
import { OptionalId } from 'mongodb';

export interface MentorProfileData {
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
  hourlyRateINR: number;
  sessionDurations: number[];
  scheduleType: 'manual' | 'calcom';
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

export interface WeeklySchedule {
  [day: string]: {
    isAvailable: boolean;
    timeSlots: Array<{
      id: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface SearchFilters {
  expertise?: string[];
  subjects?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
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

export interface SearchResult {
  mentors: MentorProfileData[];
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
   * Find mentor profile by mentor ID
   */
  async findMentorProfile(mentorId: string): Promise<MentorProfileData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        return null;
      }
      const collection = this.getMentorProfilesCollection();
      const mentorProfile = await collection.findOne({
        userId: new mongoose.Types.ObjectId(mentorId)
      });
      if (!mentorProfile) return null;
      return this.formatMentorProfile(mentorProfile);
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Find mentor profile by profile ID
   */
  async findMentorProfileById(profileId: string): Promise<MentorProfileData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(profileId)) {
        return null;
      }
      const collection = this.getMentorProfilesCollection();
      const mentorProfile = await collection.findOne({
        _id: new mongoose.Types.ObjectId(profileId)
      });
      if (!mentorProfile) return null;
      return this.formatMentorProfile(mentorProfile);
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Create new mentor profile
   */
  async createMentorProfile(userId: string, profileData: Partial<MentorProfileData>): Promise<MentorProfileData | null> {
    try {
      const collection = this.getMentorProfilesCollection();
      const existingProfile = await collection.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (existingProfile) return this.formatMentorProfile(existingProfile);

      // Get user details
      const user = await User.findById(userId);
      if (!user) return null;

      const now = new Date().toISOString();
      const mentorProfile: Partial<MentorProfileData> = {
        userId: userId,
        displayName: profileData.displayName || `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: profileData.profileImage || this.generateDefaultAvatar(user.firstName, user.lastName),
        bio: profileData.bio || '',
        location: profileData.location || '',
        timezone: profileData.timezone || 'UTC',
        languages: profileData.languages || ['English'],
        achievements: profileData.achievements || '',
        socialLinks: profileData.socialLinks || {},
        expertise: profileData.expertise || [],
        subjects: profileData.subjects || [],
        teachingStyles: profileData.teachingStyles || [],
        specializations: profileData.specializations || [],
        pricing: profileData.pricing || { hourlyRate: 50, currency: 'INR' },
        preferences: profileData.preferences || {},
        hourlyRateINR: profileData.hourlyRateINR || 50,
        sessionDurations: profileData.sessionDurations || [30, 60, 90],
        scheduleType: profileData.scheduleType || 'manual',
        weeklySchedule: profileData.weeklySchedule || this.getDefaultWeeklySchedule(),
        isProfileComplete: false,
        applicationSubmitted: false,
        profileStep: 'basic_info',
        rating: 4.5,
        totalSessions: 0,
        totalStudents: 0,
        isOnline: false,
        isVerified: false,
        responseTime: 60,
        createdAt: now,
        updatedAt: now
      };

      const result = await collection.insertOne(mentorProfile as OptionalId<Document>);
      if (!result.insertedId) return null;
      return this.formatMentorProfile({ ...mentorProfile, _id: result.insertedId });
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Update mentor profile
   */
  async updateMentorProfile(profileId: string, updateData: Partial<MentorProfileData>): Promise<MentorProfileData | null> {
    try {
      const collection = this.getMentorProfilesCollection();
      const result = await collection.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(profileId) },
        { $set: { ...updateData, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' }
      );
      if (!result || !result.value) return null;
      return this.formatMentorProfile(result.value);
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Update mentor weekly schedule
   */
  async updateMentorSchedule(mentorId: string, weeklySchedule: WeeklySchedule): Promise<MentorProfileData | null> {
    try {
      const collection = this.getMentorProfilesCollection();
      const validatedSchedule = this.validateWeeklySchedule(weeklySchedule);
      if (!validatedSchedule) return null;
      const result = await collection.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(mentorId) },
        { $set: { weeklySchedule: validatedSchedule, scheduleType: 'manual', updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' }
      );
      if (!result || !result.value) return null;
      return this.formatMentorProfile(result.value);
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Search mentors with filters
   */
  async searchMentors(filters: SearchFilters = {}): Promise<SearchResult> {
    try {
      const {
        expertise,
        subjects,
        priceRange,
        rating,
        languages,
        location,
        isOnline,
        isVerified,
        sortBy = 'rating',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
        search
      } = filters;

      const query: any = {
        isProfileComplete: true,
        applicationSubmitted: true
      };

      if (search) {
        query.$or = [
          { displayName: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } },
          { expertise: { $in: [new RegExp(search, 'i')] } },
          { specializations: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      if (expertise && expertise.length > 0) {
        query.expertise = { $in: expertise };
      }
      if (subjects && subjects.length > 0) {
        query.$or = query.$or || [];
        query.$or.push(
          { 'subjects.name': { $in: subjects } },
          { subjects: { $in: subjects } }
        );
      }
      if (priceRange) {
        query.hourlyRateINR = {
          $gte: priceRange.min || 0,
          $lte: priceRange.max || 10000
        };
      }
      if (rating) {
        query.rating = { $gte: rating };
      }
      if (languages && languages.length > 0) {
        query.languages = { $in: languages };
      }
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      if (isOnline !== undefined) {
        query.isOnline = isOnline;
      }
      if (isVerified !== undefined) {
        query.isVerified = isVerified;
      }

      const sortObj: any = {};
      switch (sortBy) {
        case 'price':
          sortObj.hourlyRateINR = sortOrder === 'asc' ? 1 : -1;
          break;
        case 'experience':
          sortObj.totalSessions = sortOrder === 'asc' ? 1 : -1;
          break;
        case 'popularity':
          sortObj.totalStudents = sortOrder === 'asc' ? 1 : -1;
          break;
        case 'response_time':
          sortObj.responseTime = sortOrder === 'asc' ? 1 : -1;
          break;
        case 'rating':
        default:
          sortObj.rating = sortOrder === 'asc' ? 1 : -1;
          break;
      }

      const skip = (page - 1) * limit;
      const collection = this.getMentorProfilesCollection();

      const mentorsCursor = collection.find(query).sort(sortObj).skip(skip).limit(limit);
      const mentorsArr = await mentorsCursor.toArray();
      const total = await collection.countDocuments(query);

      const formattedMentors = mentorsArr.map((mentor: any) => this.formatMentorProfile(mentor));
      const filterMetadata = await this.getFilterMetadata();

      return {
        mentors: formattedMentors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: filterMetadata
      };
    } catch (error: any) {
      return {
        mentors: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        filters: {
          availableExpertise: [],
          availableSubjects: [],
          availableLanguages: [],
          priceRange: { min: 0, max: 1000 }
        }
      };
    }
  }

  /**
   * Get mentor availability
   */
  async getMentorAvailability(mentorId: string): Promise<WeeklySchedule | null> {
    const mentorProfile = await this.findMentorProfile(mentorId);
    if (!mentorProfile) return null;
    return mentorProfile.weeklySchedule || this.getDefaultWeeklySchedule();
  }

  // --- Helper methods below ---

  private formatMentorProfile(mentorProfile: any): MentorProfileData {
    // You may want to add more robust null checks here
    return {
      _id: mentorProfile._id?.toString() || '',
      userId: mentorProfile.userId?.toString() || '',
      displayName: mentorProfile.displayName || '',
      firstName: mentorProfile.firstName || '',
      lastName: mentorProfile.lastName || '',
      email: mentorProfile.email || '',
      profileImage: mentorProfile.profileImage || '',
      bio: mentorProfile.bio || '',
      location: mentorProfile.location || '',
      timezone: mentorProfile.timezone || 'UTC',
      languages: mentorProfile.languages || ['English'],
      achievements: mentorProfile.achievements || '',
      socialLinks: mentorProfile.socialLinks || {},
      expertise: mentorProfile.expertise || [],
      subjects: mentorProfile.subjects || [],
      teachingStyles: mentorProfile.teachingStyles || [],
      specializations: mentorProfile.specializations || [],
      pricing: mentorProfile.pricing || { hourlyRate: 50, currency: 'INR' },
      preferences: mentorProfile.preferences || {},
      hourlyRateINR: mentorProfile.hourlyRateINR || 50,
      sessionDurations: mentorProfile.sessionDurations || [30, 60, 90],
      scheduleType: mentorProfile.scheduleType || 'manual',
      weeklySchedule: mentorProfile.weeklySchedule || this.getDefaultWeeklySchedule(),
      isProfileComplete: mentorProfile.isProfileComplete || false,
      applicationSubmitted: mentorProfile.applicationSubmitted || false,
      profileStep: mentorProfile.profileStep || 'basic_info',
      submittedAt: mentorProfile.submittedAt,
      rating: mentorProfile.rating || 4.5,
      totalSessions: mentorProfile.totalSessions || 0,
      totalStudents: mentorProfile.totalStudents || 0,
      isOnline: mentorProfile.isOnline || false,
      isVerified: mentorProfile.isVerified || false,
      lastSeen: mentorProfile.lastSeen,
      responseTime: mentorProfile.responseTime || 60,
      createdAt: mentorProfile.createdAt || new Date().toISOString(),
      updatedAt: mentorProfile.updatedAt || new Date().toISOString()
    };
  }

  private generateDefaultAvatar(firstName?: string, lastName?: string): string {
    const name = encodeURIComponent(`${firstName || ''} ${lastName || ''}`.trim() || 'Mentor');
    return `https://ui-avatars.com/api/?name=${name}&background=8B4513&color=fff&size=200`;
  }

  private getDefaultWeeklySchedule(): WeeklySchedule {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule: WeeklySchedule = {};
    days.forEach(day => {
      schedule[day] = { isAvailable: false, timeSlots: [] };
    });
    return schedule;
  }

  private validateWeeklySchedule(schedule: WeeklySchedule): WeeklySchedule | null {
    try {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const validatedSchedule: WeeklySchedule = {};
      for (const day of validDays) {
        const daySchedule = schedule[day];
        if (daySchedule) {
          validatedSchedule[day] = {
            isAvailable: Boolean(daySchedule.isAvailable),
            timeSlots: (daySchedule.timeSlots || []).map((slot, index) => ({
              id: slot.id || `${day}-slot-${index}`,
              startTime: slot.startTime,
              endTime: slot.endTime
            }))
          };
        } else {
          validatedSchedule[day] = { isAvailable: false, timeSlots: [] };
        }
      }
      return validatedSchedule;
    } catch (error) {
      return null;
    }
  }

  // Dummy filter metadata for now
  private async getFilterMetadata() {
    return {
      availableExpertise: [],
      availableSubjects: [],
      availableLanguages: [],
      priceRange: { min: 10, max: 200 }
    };
  }
}

// Export singleton instance
const mentorProfileService = MentorProfileService.getInstance();
export default mentorProfileService;