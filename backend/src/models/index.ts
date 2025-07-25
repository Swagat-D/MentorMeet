// backend/src/models/index.ts
import './User.model';
import './OTP.model';
import './Session.model';
import './StudentProgress.model';
import './Achievement.model';
import './LearningInsight.model';
import './Review.model';
import './RefreshToken.model';
import './PsychometricTest.model';

console.log('📋 All models imported and registered');

// Export models
export { default as User } from './User.model';
export { default as OTP } from './OTP.model';
export { default as Session } from './Session.model';
export { default as StudentProgress } from './StudentProgress.model';
export { default as Achievement } from './Achievement.model';
export { default as LearningInsight } from './LearningInsight.model';
export { default as Review } from './Review.model';
export { default as RefreshToken } from './RefreshToken.model';
export { default as PsychometricTest } from './PsychometricTest.model';