import { Schema, model, Document, Types } from 'mongoose';

export interface IAchievement extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  type: 'streak' | 'milestone' | 'completion' | 'rating' | 'hours' | 'subjects';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  metadata?: {
    streakDays?: number;
    hoursCompleted?: number;
    sessionsCompleted?: number;
    subjectsExplored?: number;
    rating?: number;
  };
}

const achievementSchema = new Schema<IAchievement>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['streak', 'milestone', 'completion', 'rating', 'hours', 'subjects'], 
    required: true 
  },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  icon: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  metadata: {
    streakDays: { type: Number },
    hoursCompleted: { type: Number },
    sessionsCompleted: { type: Number },
    subjectsExplored: { type: Number },
    rating: { type: Number }
  }
}, {
  timestamps: true
});

achievementSchema.index({ studentId: 1, earnedAt: -1 });
achievementSchema.index({ type: 1, earnedAt: -1 });

export const Achievement = model<IAchievement>('Achievement', achievementSchema);
export default Achievement;