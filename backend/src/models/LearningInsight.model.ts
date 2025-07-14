import { Schema, model, Document, Types } from 'mongoose';

export interface ILearningInsight extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  type: 'improvement' | 'milestone' | 'recommendation' | 'streak' | 'goal';
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  icon: string;
  color: string;
  priority: number; // 1-5, higher is more important
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const learningInsightSchema = new Schema<ILearningInsight>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['improvement', 'milestone', 'recommendation', 'streak', 'goal'], 
    required: true 
  },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  action: { type: String, maxlength: 50 },
  actionRoute: { type: String, maxlength: 200 },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  priority: { type: Number, required: true, min: 1, max: 5 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

learningInsightSchema.index({ studentId: 1, isActive: 1, priority: -1 });
learningInsightSchema.index({ expiresAt: 1 });

export const LearningInsight = model<ILearningInsight>('LearningInsight', learningInsightSchema);
