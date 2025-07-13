import { Schema, model, Document, Types } from 'mongoose';
import { getWeekStart } from '@/utils/dateHelpers';

export interface IFavoriteSubject {
  subject: string;
  sessionsCount: number;
  averageRating: number;
  totalHours: number;
}

export interface IWeeklyGoal {
  target: number;
  completed: number;
  weekStart: Date;
}

export interface IMonthlyStats {
  month: string; // YYYY-MM
  sessionsCompleted: number;
  hoursLearned: number;
  averageRating: number;
}

export interface IStudentProgress extends Document {
  studentId: Types.ObjectId;
  
  // Session Stats
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  
  // Learning Stats
  totalLearningHours: number;
  averageSessionRating: number;
  completionRate: number; // percentage
  
  // Streak Tracking
  currentStreak: number;
  longestStreak: number;
  lastSessionDate?: Date;
  
  // Subject Performance
  favoriteSubjects: IFavoriteSubject[];
  
  // Goals
  weeklyGoal: IWeeklyGoal;
  
  // Monthly Stats
  monthlyStats: IMonthlyStats[];
  
  createdAt: Date;
  updatedAt: Date;
}

const studentProgressSchema = new Schema<IStudentProgress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Session Stats
  totalSessions: { type: Number, default: 0 },
  completedSessions: { type: Number, default: 0 },
  cancelledSessions: { type: Number, default: 0 },
  noShowSessions: { type: Number, default: 0 },
  
  // Learning Stats
  totalLearningHours: { type: Number, default: 0 },
  averageSessionRating: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 }, // percentage
  
  // Streak Tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastSessionDate: { type: Date },
  
  // Subject Performance
  favoriteSubjects: [{
    subject: { type: String, required: true },
    sessionsCount: { type: Number, required: true },
    averageRating: { type: Number, required: true },
    totalHours: { type: Number, required: true }
  }],
  
  // Goals
  weeklyGoal: {
    target: { type: Number, default: 3 }, // sessions per week
    completed: { type: Number, default: 0 },
    weekStart: { type: Date, default: () => getWeekStart() }
  },
  
  // Monthly Stats
  monthlyStats: [{
    month: { type: String, required: true }, // YYYY-MM
    sessionsCompleted: { type: Number, required: true },
    hoursLearned: { type: Number, required: true },
    averageRating: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

export const StudentProgress = model<IStudentProgress>('StudentProgress', studentProgressSchema);