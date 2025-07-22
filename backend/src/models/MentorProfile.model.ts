// backend/src/models/MentorProfile.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IMentorProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  displayName: string;
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
  subjects: string[];
  teachingStyles: string[];
  specializations: string[];
  isProfileComplete: boolean;
  applicationSubmitted: boolean;
  profileStep: string;
  preferences: {
    sessionTypes?: string[];
    maxStudents?: number;
    autoAcceptBookings?: boolean;
  };
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
  weeklySchedule: {
    [key: string]: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  };
  submittedAt?: Date;
  
  // Additional fields for functionality
  rating?: number;
  totalSessions?: number;
  totalStudents?: number;
  totalReviews?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  lastSeen?: Date;
  responseTime?: number; // in minutes
  
  createdAt: Date;
  updatedAt: Date;
}

const mentorProfileSchema = new Schema<IMentorProfile>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  displayName: { type: String, required: true },
  bio: { type: String },
  location: { type: String },
  timezone: { type: String },
  languages: [{ type: String }],
  achievements: { type: String },
  
  socialLinks: {
    linkedin: { type: String },
    twitter: { type: String },
    website: { type: String },
    github: { type: String }
  },
  
  expertise: [{ type: String, required: true }],
  subjects: [{ type: String, required: true }],
  teachingStyles: [{ type: String }],
  specializations: [{ type: String }],
  
  isProfileComplete: { type: Boolean, default: false },
  applicationSubmitted: { type: Boolean, default: false },
  profileStep: { type: String, default: 'basic' },
  
  preferences: {
    sessionTypes: [{ type: String }],
    maxStudents: { type: Number, default: 10 },
    autoAcceptBookings: { type: Boolean, default: false }
  },
  
  pricing: {
    hourlyRate: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    packages: [{
      name: { type: String, required: true },
      sessions: { type: Number, required: true },
      price: { type: Number, required: true },
      description: { type: String, required: true }
    }]
  },
  
  weeklySchedule: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  submittedAt: { type: Date },
  
  // Additional fields
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  totalSessions: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  responseTime: { type: Number, default: 60 } // minutes
}, {
  timestamps: true
});

// Indexes for performance
mentorProfileSchema.index({ userId: 1 }, { unique: true });
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ subjects: 1 });
mentorProfileSchema.index({ 'pricing.hourlyRate': 1 });
mentorProfileSchema.index({ rating: -1 });
mentorProfileSchema.index({ isProfileComplete: 1, applicationSubmitted: 1 });
mentorProfileSchema.index({ location: 'text', bio: 'text', displayName: 'text' });

export const MentorProfile = model<IMentorProfile>('MentorProfile', mentorProfileSchema, 'mentorprofiles');
export default MentorProfile;