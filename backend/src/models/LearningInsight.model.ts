import { Schema, model, Document, Types } from 'mongoose';

export interface ILearningInsight extends Document {
  studentId: Types.ObjectId;
  
  type: 'improvement' | 'milestone' | 'recommendation' | 'streak' | 'goal';
  title: string;
  description: string;
  action?: string; // optional action text
  actionRoute?: string; // optional route for action
  icon: string;
  color: string;
  
  // Insight Data
  priority: number; // 1-5, 5 being highest
  isActive: boolean;
  expiresAt?: Date; // optional expiration
  
  // Tracking
  viewedAt?: Date;
  actionTakenAt?: Date;
  
  createdAt: Date;
}

const learningInsightSchema = new Schema<ILearningInsight>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { 
    type: String, 
    enum: ['improvement', 'milestone', 'recommendation', 'streak', 'goal'],
    required: true 
  },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  action: { type: String }, // optional action text
  actionRoute: { type: String }, // optional route for action
  icon: { type: String, required: true },
  color: { type: String, required: true },
  
  // Insight Data
  priority: { type: Number, default: 1, min: 1, max: 5 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }, // optional expiration
  
  // Tracking
  viewedAt: { type: Date },
  actionTakenAt: { type: Date }
}, {
  timestamps: true
});

learningInsightSchema.index({ studentId: 1, isActive: 1, priority: -1 });

export const LearningInsight = model<ILearningInsight>('LearningInsight', learningInsightSchema);