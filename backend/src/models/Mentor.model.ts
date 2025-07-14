import { Schema, model, Document, Types } from 'mongoose';

export interface IMentor extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
  bio?: string;
  expertise: string[];
  experience: number; // years
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
  }>;
  languages: Array<{
    language: string;
    proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
  }>;
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
  availability: {
    timezone: string;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  rating: number;
  totalSessions: number;
  totalStudents: number;
  totalReviews: number;
  completionRate: number;
  responseTime: number; // in minutes
  isOnline: boolean;
  lastSeen: Date;
  isVerified: boolean;
  isActive: boolean;
  status: 'active' | 'inactive' | 'busy' | 'away';
  specialties: string[];
  teachingStyle: string[];
  createdAt: Date;
  updatedAt: Date;
}

const mentorSchema = new Schema<IMentor>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  displayName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  profileImage: { type: String, required: true },
  bio: { type: String, maxlength: 1000 },
  expertise: [{ type: String, required: true }],
  experience: { type: Number, required: true, min: 0 },
  
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, required: true },
    graduationYear: { type: Number, required: true }
  }],
  
  certifications: [{
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date }
  }],
  
  languages: [{
    language: { type: String, required: true },
    proficiency: { 
      type: String, 
      enum: ['basic', 'intermediate', 'advanced', 'native'], 
      required: true 
    }
  }],
  
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
  
  availability: {
    timezone: { type: String, default: 'UTC' },
    schedule: [{
      day: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    }]
  },
  
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalSessions: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 },
  responseTime: { type: Number, default: 60 }, // minutes
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'busy', 'away'], 
    default: 'active' 
  },
  specialties: [{ type: String }],
  teachingStyle: [{ type: String }]
}, {
  timestamps: true
});

// Indexes for search and performance
mentorSchema.index({ expertise: 1 });
mentorSchema.index({ 'pricing.hourlyRate': 1 });
mentorSchema.index({ rating: -1 });
mentorSchema.index({ isOnline: 1, isActive: 1 });
mentorSchema.index({ isVerified: 1, rating: -1 });
mentorSchema.index({ 'languages.language': 1 });

export const Mentor = model<IMentor>('Mentor', mentorSchema);
export default Mentor;