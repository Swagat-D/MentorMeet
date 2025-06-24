// src/models/OTP.model.ts - OTP Model for Email Verification
import mongoose, { Document, Schema } from 'mongoose';

// OTP Types
export enum OTPType {
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset',
  PHONE_VERIFICATION = 'phone-verification'
}

export enum OTPStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

// OTP Interface
export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  userId?: mongoose.Types.ObjectId;
  code: string;
  type: OTPType;
  status: OTPStatus;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  verifiedAt?: Date;
  
  // Metadata for security
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  isExpired(): boolean;
  isExhausted(): boolean;
  canAttempt(): boolean;
  incrementAttempts(): Promise<void>;
  markAsVerified(): Promise<void>;
  markAsExpired(): Promise<void>;
}

// OTP Schema
const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    index: true
  },
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  code: {
    type: String,
    required: [true, 'OTP code is required'],
    length: [6, 'OTP code must be exactly 6 digits'],
    match: [/^\d{6}$/, 'OTP code must be 6 digits']
  },
  
  type: {
    type: String,
    enum: Object.values(OTPType),
    required: [true, 'OTP type is required'],
    index: true
  },
  
  status: {
    type: String,
    enum: Object.values(OTPStatus),
    default: OTPStatus.PENDING,
    index: true
  },
  
  attempts: {
    type: Number,
    default: 0,
    min: [0, 'Attempts cannot be negative'],
    max: [10, 'Too many attempts']
  },
  
  maxAttempts: {
    type: Number,
    default: 5,
    min: [1, 'Max attempts must be at least 1'],
    max: [10, 'Max attempts cannot exceed 10']
  },
  
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for auto-deletion
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Metadata for security tracking
  ipAddress: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        // Basic IP validation (IPv4 and IPv6)
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  
  userAgent: {
    type: String,
    default: null,
    maxlength: [500, 'User agent too long']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes for better query performance
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ email: 1, type: 1, status: 1 });
otpSchema.index({ code: 1, type: 1 });
otpSchema.index({ userId: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }); // For TTL
otpSchema.index({ createdAt: -1 });

// Virtual for OTP ID as string
otpSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Transform for JSON serialization
otpSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.code; // Never include actual OTP code in JSON responses
    return ret;
  }
});

// Instance method to check if OTP is expired
otpSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if OTP attempts are exhausted
otpSchema.methods.isExhausted = function(): boolean {
  return this.attempts >= this.maxAttempts;
};

// Instance method to check if OTP can be attempted
otpSchema.methods.canAttempt = function(): boolean {
  return !this.isExpired() && !this.isExhausted() && this.status === OTPStatus.PENDING;
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = async function(): Promise<void> {
  this.attempts += 1;
  
  // Mark as failed if max attempts reached
  if (this.attempts >= this.maxAttempts) {
    this.status = OTPStatus.FAILED;
  }
  
  await this.save({ validateBeforeSave: false });
};

// Instance method to mark as verified
otpSchema.methods.markAsVerified = async function(): Promise<void> {
  this.status = OTPStatus.VERIFIED;
  this.verifiedAt = new Date();
  await this.save({ validateBeforeSave: false });
};

// Instance method to mark as expired
otpSchema.methods.markAsExpired = async function(): Promise<void> {
  this.status = OTPStatus.EXPIRED;
  await this.save({ validateBeforeSave: false });
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function(email: string, code: string, type: OTPType) {
  return this.findOne({
    email: email.toLowerCase(),
    code,
    type,
    status: OTPStatus.PENDING,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to find pending OTPs for email and type
otpSchema.statics.findPendingOTPs = function(email: string, type: OTPType) {
  return this.find({
    email: email.toLowerCase(),
    type,
    status: OTPStatus.PENDING,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to cleanup expired OTPs (manual cleanup if needed)
otpSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lte: new Date() } },
      { status: { $in: [OTPStatus.VERIFIED, OTPStatus.FAILED] } }
    ]
  });
};

// Pre-save middleware to auto-expire if needed
otpSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === OTPStatus.PENDING) {
    this.status = OTPStatus.EXPIRED;
  }
  next();
});

// Export the model
const OTP = mongoose.model<IOTP>('OTP', otpSchema);
export default OTP;