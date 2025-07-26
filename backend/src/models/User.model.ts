// src/models/User.model.ts - Complete User Model for Authentication (Fixed Indexes)
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Enums for type safety
export enum UserRole {
  MENTEE = 'mentee',
  MENTOR = 'mentor',
  ADMIN = 'admin'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say'
}

export enum StudyLevel {
  HIGH_SCHOOL = 'high-school',
  UNDERGRADUATE = 'undergraduate',
  GRADUATE = 'graduate',
  PROFESSIONAL = 'professional'
}

export enum AgeRange {
  RANGE_13_17 = '13-17',
  RANGE_18_22 = '18-22',
  RANGE_23_27 = '23-27',
  RANGE_28_PLUS = '28+'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

// User Statistics Interface
export interface IUserStats {
  totalHoursLearned: number;
  sessionsCompleted: number;
  mentorsConnected: number;
  studyStreak: number;
  completionRate: number;
  monthlyHours: number;
  weeklyGoalProgress: number;
  averageRating: number;
}
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}


// Main User Interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  googleTokens?: GoogleTokens;

  // OAuth fields
  provider: 'email' | 'google';
  googleId?: string;
  canChangePassword: boolean; // Derived from provider
  
  // Profile Information (from onboarding)
  gender?: Gender;
  ageRange?: AgeRange;
  studyLevel?: StudyLevel;
  bio?: string;
  location?: string;
  timezone?: string;
  
  // Learning Information
  goals: string[]; // Array of goal names/IDs
  
  // Account Status
  isEmailVerified: boolean;
  isActive: boolean;
  isOnboarded: boolean;
  onboardingStatus: OnboardingStatus;
  isTestGiven: boolean;

  weeklySchedule?: {
    [key: string]: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  };

  pricing?: {
    hourlyRate?: number;
    currency?: string;
    trialSessionEnabled?: boolean;
    trialSessionRate?: number;
    groupSessionEnabled?: boolean;
    groupSessionRate?: number;
  };
  
  // Statistics for mentees
  stats: IUserStats;
  
  // Timestamps
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<void>;
  markEmailAsVerified(): Promise<void>;
  updateOnboardingStatus(status: OnboardingStatus): Promise<void>;
  completeOnboarding(data: { goals: string[]; interests?: string[] }): Promise<void>;
}

// User Statistics Sub-schema
const userStatsSchema = new Schema<IUserStats>({
  totalHoursLearned: { type: Number, default: 0 },
  sessionsCompleted: { type: Number, default: 0 },
  mentorsConnected: { type: Number, default: 0 },
  studyStreak: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0.0, min: 0, max: 100 },
  monthlyHours: { type: Number, default: 0 },
  weeklyGoalProgress: { type: Number, default: 0.0, min: 0, max: 100 },
  averageRating: { type: Number, default: 0.0, min: 0, max: 5 },
}, { _id: false });

// Main User Schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.MENTEE
  },

  googleTokens: {
    accessToken: { type: String },
    refreshToken: { type: String },
    expiryDate: { type: Number }
  },
  
  avatar: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow null/empty
        return /^https?:\/\/.+/.test(v); // Must be valid URL
      },
      message: 'Avatar must be a valid URL'
    }
  },
  
  phone: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow null/empty
        return /^\+?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },

  // OAuth Provider
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
    required: true,
  },
  
  googleId: {
    type: String,
    default: null,
    sparse: true, // Allows multiple null values but unique non-null values
  },
  
  // Profile Information (set during onboarding)
  gender: {
    type: String,
    enum: Object.values(Gender),
    default: null
  },
  
  ageRange: {
    type: String,
    enum: Object.values(AgeRange),
    default: null
  },
  
  studyLevel: {
    type: String,
    enum: Object.values(StudyLevel),
    default: null
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: null
  },
  
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: null
  },
  
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Learning Information
  goals: [{
    type: String,
    trim: true
  }],
  
  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  
  isOnboarded: {
    type: Boolean,
    default: false
  },
  
  onboardingStatus: {
    type: String,
    enum: Object.values(OnboardingStatus),
    default: OnboardingStatus.NOT_STARTED
  },

  isTestGiven: {  // ADD THIS ENTIRE BLOCK HERE
    type: Boolean,
    default: false,
  },
  
  // User Statistics
  stats: {
    type: userStatsSchema,
    default: () => ({
      totalHoursLearned: 0,
      sessionsCompleted: 0,
      mentorsConnected: 0,
      studyStreak: 0,
      completionRate: 0,
      monthlyHours: 0,
      weeklyGoalProgress: 0,
      averageRating: 0,
    })
  },
  
  // Last login tracking
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false, // Disable __v version key
  toJSON: {
    transform: function(doc, ret) {
      delete ret.googleTokens;
      return ret;
    }
  }
});

// Create indexes separately to avoid duplication warnings
userSchema.index({ role: 1 });
userSchema.index({ onboardingStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ provider: 1, googleId: 1 }, { unique: true, sparse: true });

// Virtual for user ID as string
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

userSchema.virtual('canChangePassword').get(function() {
  return this.provider === 'email';
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret: any) {
    delete ret._id;
    delete ret.password; // Never include password in JSON
    ret.isTestGiven = ret.isTestGiven;
    return ret;
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with configurable salt rounds
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function(): Promise<void> {
  this.lastLoginAt = new Date();
  await this.save({ validateBeforeSave: false });
};

// Instance method to mark email as verified
userSchema.methods.markEmailAsVerified = async function(): Promise<void> {
  this.isEmailVerified = true;
  await this.save({ validateBeforeSave: false });
};

// Instance method to update onboarding status
userSchema.methods.updateOnboardingStatus = async function(status: OnboardingStatus): Promise<void> {
  this.onboardingStatus = status;
  if (status === OnboardingStatus.COMPLETED) {
    this.isOnboarded = true;
  }
  await this.save({ validateBeforeSave: false });
};

// Instance method to complete onboarding
userSchema.methods.completeOnboarding = async function(data: { 
  goals: string[]; 
  interests?: string[] 
}): Promise<void> {
  this.goals = data.goals;
  this.onboardingStatus = OnboardingStatus.COMPLETED;
  this.isOnboarded = true;
  await this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find verified users
userSchema.statics.findVerified = function() {
  return this.find({ isEmailVerified: true, isActive: true });
};

// Static method to find users by onboarding status
userSchema.statics.findByOnboardingStatus = function(status: OnboardingStatus) {
  return this.find({ onboardingStatus: status });
};

// Export the model
const User = mongoose.model<IUser>('User', userSchema);
export default User;