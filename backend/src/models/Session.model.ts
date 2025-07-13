import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  mentorId: Types.ObjectId;
  subject: string;
  
  // Scheduling
  scheduledTime: Date;
  duration: number; // minutes
  sessionType: 'video' | 'audio' | 'chat';
  
  // Status
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  
  // Session Details
  meetingLink?: string;
  sessionNotes?: string;
  homework?: string;
  
  // Ratings & Feedback
  studentRating?: number;
  mentorRating?: number;
  studentFeedback?: string;
  mentorFeedback?: string;
  
  // Payment
  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded';
    transactionId?: string;
  };
  
  // Metadata
  actualStartTime?: Date;
  actualEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  
  // Scheduling
  scheduledTime: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  sessionType: { type: String, enum: ['video', 'audio', 'chat'], default: 'video' },
  
  // Status
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  
  // Session Details
  meetingLink: { type: String },
  sessionNotes: { type: String },
  homework: { type: String },
  
  // Ratings & Feedback
  studentRating: { type: Number, min: 1, max: 5 },
  mentorRating: { type: Number, min: 1, max: 5 },
  studentFeedback: { type: String },
  mentorFeedback: { type: String },
  
  // Payment
  payment: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    transactionId: { type: String }
  },
  
  // Metadata
  actualStartTime: { type: Date },
  actualEndTime: { type: Date }
}, {
  timestamps: true
});

// Indexes for better performance
sessionSchema.index({ studentId: 1, scheduledTime: -1 });
sessionSchema.index({ mentorId: 1, scheduledTime: -1 });
sessionSchema.index({ status: 1, scheduledTime: 1 });

export const Session = model<ISession>('Session', sessionSchema);