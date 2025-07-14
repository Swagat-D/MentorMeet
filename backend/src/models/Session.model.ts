// backend/src/models/Session.model.ts - Session Model for Student Progress Tracking
import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  mentorId: Types.ObjectId;
  subject: string;
  scheduledTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration: number; // in minutes
  sessionType: 'video' | 'audio' | 'chat';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  studentRating?: number;
  mentorRating?: number;
  studentReview?: string;
  mentorReview?: string;
  sessionNotes?: string;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  duration: { type: Number, required: true, min: 15, max: 240 }, // 15 minutes to 4 hours
  sessionType: { 
    type: String, 
    enum: ['video', 'audio', 'chat'], 
    default: 'video' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'], 
    default: 'scheduled' 
  },
  studentRating: { type: Number, min: 1, max: 5 },
  mentorRating: { type: Number, min: 1, max: 5 },
  studentReview: { type: String, maxlength: 1000 },
  mentorReview: { type: String, maxlength: 1000 },
  sessionNotes: { type: String, maxlength: 2000 },
  recordingUrl: { type: String }
}, {
  timestamps: true
});

// Indexes for performance
sessionSchema.index({ studentId: 1, scheduledTime: -1 });
sessionSchema.index({ mentorId: 1, scheduledTime: -1 });
sessionSchema.index({ status: 1, scheduledTime: 1 });
sessionSchema.index({ scheduledTime: 1 });

export const Session = model<ISession>('Session', sessionSchema);
export default Session;