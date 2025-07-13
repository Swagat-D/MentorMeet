import { Schema, model, Document, Types } from 'mongoose';

export interface IAchievementCriteria {
  metric: string; // e.g., 'total_sessions', 'streak_days'
  threshold: number; // e.g., 10, 30
  subject?: string; // optional, for subject-specific achievements
}

export interface IAchievement extends Document {
  studentId: Types.ObjectId;
  
  type: 'session_milestone' | 'streak' | 'rating' | 'subject_mastery' | 'consistency';
  title: string;
  description: string;
  icon: string;
  
  // Achievement Criteria
  criteria: IAchievementCriteria;
  
  earnedAt: Date;
  createdAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { 
    type: String, 
    enum: ['session_milestone', 'streak', 'rating', 'subject_mastery', 'consistency'],
    required: true 
  },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  
  // Achievement Criteria
  criteria: {
    metric: { type: String, required: true },
    threshold: { type: Number, required: true },
    subject: { type: String }
  },
  
  earnedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

achievementSchema.index({ studentId: 1, earnedAt: -1 });

export const Achievement = model<IAchievement>('Achievement', achievementSchema);