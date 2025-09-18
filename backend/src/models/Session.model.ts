import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  subject: string;
  scheduledTime: Date;
  duration: number;
  sessionType: 'video' | 'audio' | 'in-person';
  status: 'pending_mentor_acceptance' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  sessionNotes?: string;
  
  meetingUrl?: string;
  meetingProvider?: 'google_meet' | 'zoom' | 'teams' | 'other';
  mentorAcceptedAt?: Date;
  autoDeclineAt: Date;
  
  slotId: string; 
  bookingSource: 'manual';
  
  price: number;
  currency: string;
  paymentId: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  refundId?: string;
  refundStatus?: 'pending' | 'processed' | 'failed';
  
  cancellationReason?: string;
  cancelledBy?: 'student' | 'mentor' | 'system';
  cancelledAt?: Date;
  
  studentRating?: number;
  mentorRating?: number;
  studentReview?: string;
  mentorReview?: string;
  
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  readonly endTime: Date;
}

function isValidGoogleMeetUrl(url: string): boolean {
  const googleMeetPatterns = [
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i,
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+-[a-z0-9-]+-[a-z0-9-]+$/i,
    /^https:\/\/meet\.google\.com\/lookup\/[a-z0-9-]+$/i
  ];
  
  return googleMeetPatterns.some(pattern => pattern.test(url.trim()));
}

const SessionSchema = new Schema<ISession>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  scheduledTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180
  },
  sessionType: {
    type: String,
    enum: ['video', 'audio', 'in-person'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['pending_mentor_acceptance', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending_mentor_acceptance',
    index: true
  },
  sessionNotes: {
    type: String,
    maxlength: 1000
  },
  
  // Manual booking specific fields
  meetingUrl: {
    type: String,
    trim: true,
    default: null, // CHANGED: Explicitly set to null initially
    validate: {
      validator: function(url: string) {
        // If URL is provided, validate it's a Google Meet URL
        if (!url) return true;
        return isValidGoogleMeetUrl(url);
      },
      message: 'Meeting URL must be a valid Google Meet link (e.g., https://meet.google.com/xyz-abc-def)'
    }
  },
  meetingProvider: {
    type: String,
    enum: ['google_meet', 'zoom', 'teams', 'other'],
    default: 'google_meet' // CHANGED: Default to Google Meet since we're enforcing it
  },
  mentorAcceptedAt: {
    type: Date
  },
  autoDeclineAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Booking details
  slotId: {
    type: String,
    required: true
  },
  bookingSource: {
    type: String,
    enum: ['manual'],
    default: 'manual'
  },
  
  // Payment fields
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  paymentId: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  refundId: {
    type: String
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed']
  },
  
  // Cancellation
  cancellationReason: {
    type: String,
    maxlength: 500
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'mentor', 'system']
  },
  cancelledAt: {
    type: Date
  },
  
  // Ratings and feedback
  studentRating: {
    type: Number,
    min: 1,
    max: 5
  },
  mentorRating: {
    type: Number,
    min: 1,
    max: 5
  },
  studentReview: {
    type: String,
    maxlength: 1000
  },
  mentorReview: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
SessionSchema.index({ mentorId: 1, scheduledTime: 1 });
SessionSchema.index({ studentId: 1, scheduledTime: 1 });
SessionSchema.index({ status: 1, scheduledTime: 1 });
SessionSchema.index({ autoDeclineAt: 1, status: 1 });

// Virtual for session end time
SessionSchema.virtual('endTime').get(function() {
  return new Date(this.scheduledTime.getTime() + (this.duration * 60 * 1000));
});

// Method to check if session conflicts with another session
SessionSchema.methods.conflictsWith = function(otherSession: ISession): boolean {
  const thisStart = this.scheduledTime;
  const thisEnd = this.endTime;
  const otherStart = otherSession.scheduledTime;
  const otherEnd = otherSession.endTime;
  
  return (
    (thisStart >= otherStart && thisStart < otherEnd) ||
    (thisEnd > otherStart && thisEnd <= otherEnd) ||
    (thisStart <= otherStart && thisEnd >= otherEnd)
  );
};

// Static method to find conflicting sessions
SessionSchema.statics.findConflicting = function(
  mentorId: mongoose.Types.ObjectId,
  scheduledTime: Date,
  duration: number,
  excludeSessionId?: mongoose.Types.ObjectId
) {
  const sessionStart = scheduledTime;
  const sessionEnd = new Date(scheduledTime.getTime() + (duration * 60 * 1000));
  
  const query: any = {
    mentorId,
    status: { $nin: ['cancelled'] },
    $or: [
      {
        scheduledTime: {
          $gte: sessionStart,
          $lt: sessionEnd
        }
      },
      {
        $expr: {
          $and: [
            { $lte: ['$scheduledTime', sessionStart] },
            { $gt: [{ $add: ['$scheduledTime', { $multiply: ['$duration', 60000] }] }, sessionStart] }
          ]
        }
      }
    ]
  };
  
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }
  
  return this.find(query);
};

// Pre-save middleware to ensure autoDeclineAt is always set
SessionSchema.pre('save', function(next) {
  // Only set autoDeclineAt if it's not already set and we have scheduledTime
  if (!this.autoDeclineAt && this.scheduledTime) {
    // Set auto-decline to 2 hours before session
    this.autoDeclineAt = new Date(this.scheduledTime.getTime() - (2 * 60 * 60 * 1000));
  }
  
  // Validate that autoDeclineAt is before scheduledTime
  if (this.autoDeclineAt && this.scheduledTime && this.autoDeclineAt >= this.scheduledTime) {
    // If autoDeclineAt is not before scheduledTime, fix it
    this.autoDeclineAt = new Date(this.scheduledTime.getTime() - (2 * 60 * 60 * 1000));
  }
  
  next();
});

// ADDED: Method to update meeting URL by mentor
SessionSchema.methods.updateMeetingUrl = function(meetingUrl: string) {
  if (!isValidGoogleMeetUrl(meetingUrl)) {
    throw new Error('Please provide a valid Google Meet URL (e.g., https://meet.google.com/xyz-abc-def)');
  }
  
  this.meetingUrl = meetingUrl;
  this.meetingProvider = 'google_meet';
  
  // If mentor is adding meeting URL, consider session as confirmed
  if (this.status === 'pending_mentor_acceptance') {
    this.status = 'confirmed';
    this.mentorAcceptedAt = new Date();
  }
};

export const Session = mongoose.model<ISession>('Session', SessionSchema);
export default Session;