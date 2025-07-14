// backend/src/models/PsychometricTest.model.ts - Complete Psychometric Test Model
import { Schema, model, Document, Types } from 'mongoose';

// RIASEC Scores Interface (Section A)
export interface IRiasecScores {
  R: number; // Realistic (Doers)
  I: number; // Investigative (Thinkers)
  A: number; // Artistic (Creators)
  S: number; // Social (Helpers)
  E: number; // Enterprising (Persuaders)
  C: number; // Conventional (Organizers)
}

// Brain Profile Scores Interface (Section B)
export interface IBrainScores {
  L1: number; // Analyst and Realist
  L2: number; // Conservative/Organizer
  R1: number; // Strategist and Imaginative
  R2: number; // Socializer and Empathic
}

// STEPS Scores Interface (Section C)
export interface IStepsScores {
  S: number; // Self Management
  T: number; // Team Work
  E: number; // Enterprising
  P: number; // Problem Solving
  Speaking: number; // Speaking & Listening
}

// Personal Insights Interface (Section D)
export interface IPersonalInsights {
  whatYouLike: string;
  whatYouAreGoodAt: string;
  recentProjects: string;
  characterStrengths: string[];
  valuesInLife: string[];
}

// Individual Test Results
export interface ITestResult {
  sectionId: string;
  sectionName: string;
  completedAt: Date;
  timeSpent: number; // in minutes
  responses: { [questionId: string]: any };
  scores: IRiasecScores | IBrainScores | IStepsScores;
  interpretation: string;
  recommendations: string[];
}

// Complete Assessment Results
export interface IAssessmentResults {
  hollandCode: string; // Top 3 RIASEC letters
  dominantBrainQuadrants: string[]; // Top 2 brain quadrants
  employabilityQuotient: number; // STEPS score out of 10
  overallInterpretation: string;
  careerRecommendations: string[];
  learningStyleRecommendations: string[];
  skillDevelopmentAreas: string[];
}

// Main Psychometric Test Document
export interface IPsychometricTest extends Document {
  userId: Types.ObjectId;
  
  // Test Metadata
  testId: string; // Unique test identifier
  status: 'in_progress' | 'completed' | 'abandoned';
  isComplete(): boolean;
  calculateOverallResults(): IAssessmentResults;
  generateSummary(): string;
  startedAt: Date;
  completedAt?: Date;
  totalTimeSpent: number; // in minutes
  
  // Section Completion Status
  sectionsCompleted: {
    riasec: boolean;
    brainProfile: boolean;
    employability: boolean;
    personalInsights: boolean;
  };
  
  // Individual Section Results
  riasecResult?: ITestResult;
  brainProfileResult?: ITestResult;
  employabilityResult?: ITestResult;
  personalInsightsResult?: {
    sectionId: string;
    sectionName: string;
    completedAt: Date;
    responses: IPersonalInsights;
  };
  
  // Overall Assessment Results (calculated when all sections complete)
  overallResults?: IAssessmentResults;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definition
const riasecScoresSchema = new Schema<IRiasecScores>({
  R: { type: Number, default: 0, min: 0 },
  I: { type: Number, default: 0, min: 0 },
  A: { type: Number, default: 0, min: 0 },
  S: { type: Number, default: 0, min: 0 },
  E: { type: Number, default: 0, min: 0 },
  C: { type: Number, default: 0, min: 0 },
}, { _id: false });

const brainScoresSchema = new Schema<IBrainScores>({
  L1: { type: Number, default: 0, min: 0 },
  L2: { type: Number, default: 0, min: 0 },
  R1: { type: Number, default: 0, min: 0 },
  R2: { type: Number, default: 0, min: 0 },
}, { _id: false });

const stepsScoresSchema = new Schema<IStepsScores>({
  S: { type: Number, default: 0, min: 0, max: 5 },
  T: { type: Number, default: 0, min: 0, max: 5 },
  E: { type: Number, default: 0, min: 0, max: 5 },
  P: { type: Number, default: 0, min: 0, max: 5 },
  Speaking: { type: Number, default: 0, min: 0, max: 5 },
}, { _id: false });

const personalInsightsSchema = new Schema<IPersonalInsights>({
  whatYouLike: { type: String, required: true, maxlength: 500 },
  whatYouAreGoodAt: { type: String, required: true, maxlength: 500 },
  recentProjects: { type: String, required: true, maxlength: 500 },
  characterStrengths: [{ type: String, maxlength: 100 }],
  valuesInLife: [{ type: String, maxlength: 100 }],
}, { _id: false });

const testResultSchema = new Schema<ITestResult>({
  sectionId: { type: String, required: true },
  sectionName: { type: String, required: true },
  completedAt: { type: Date, required: true },
  timeSpent: { type: Number, required: true, min: 0 },
  responses: { type: Schema.Types.Mixed, required: true },
  scores: { type: Schema.Types.Mixed, required: true },
  interpretation: { type: String, required: true, maxlength: 2000 },
  recommendations: [{ type: String, maxlength: 200 }],
}, { _id: false });

const assessmentResultsSchema = new Schema<IAssessmentResults>({
  hollandCode: { type: String, required: true, maxlength: 3 },
  dominantBrainQuadrants: [{ type: String, enum: ['L1', 'L2', 'R1', 'R2'] }],
  employabilityQuotient: { type: Number, required: true, min: 0, max: 10 },
  overallInterpretation: { type: String, required: true, maxlength: 3000 },
  careerRecommendations: [{ type: String, maxlength: 100 }],
  learningStyleRecommendations: [{ type: String, maxlength: 200 }],
  skillDevelopmentAreas: [{ type: String, maxlength: 100 }],
}, { _id: false });

interface IPsychometricTestDocument extends IPsychometricTest, Document {
  isComplete(): boolean;
  calculateOverallResults(): any;
  generateSummary(): string;
}

const psychometricTestSchema = new Schema<IPsychometricTestDocument>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  testId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `PSY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
  },
  
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'abandoned'], 
    default: 'in_progress',
    index: true
  },
  
  startedAt: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  
  completedAt: { 
    type: Date 
  },
  
  totalTimeSpent: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  
  sectionsCompleted: {
    riasec: { type: Boolean, default: false },
    brainProfile: { type: Boolean, default: false },
    employability: { type: Boolean, default: false },
    personalInsights: { type: Boolean, default: false },
  },
  
  riasecResult: testResultSchema,
  brainProfileResult: testResultSchema,
  employabilityResult: testResultSchema,
  personalInsightsResult: {
    sectionId: { type: String },
    sectionName: { type: String },
    completedAt: { type: Date },
    responses: personalInsightsSchema,
  },
  
  overallResults: assessmentResultsSchema,
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
psychometricTestSchema.index({ userId: 1, status: 1 });
psychometricTestSchema.index({ testId: 1 });
psychometricTestSchema.index({ createdAt: -1 });
psychometricTestSchema.index({ completedAt: -1 });

// Virtual for completion percentage
psychometricTestSchema.virtual('completionPercentage').get(function() {
  const completed = Object.values(this.sectionsCompleted).filter(Boolean).length;
  return Math.round((completed / 4) * 100);
});

// Instance method to get next incomplete section
psychometricTestSchema.methods.getNextSection = function(): string | null {
  const sections = ['riasec', 'brainProfile', 'employability', 'personalInsights'];
  for (const section of sections) {
    if (!this.sectionsCompleted[section]) {
      return section;
    }
  }
  return null;
};

// Instance method to calculate overall results
psychometricTestSchema.methods.calculateOverallResults = function(): IAssessmentResults {
  if (!this.isComplete()) {
    throw new Error('Cannot calculate results for incomplete assessment');
  }
  
  // Calculate Holland Code (top 3 RIASEC scores)
  const riasecScores = this.riasecResult?.scores as IRiasecScores;
  const sortedRiasec = Object.entries(riasecScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([letter]) => letter);
  const hollandCode = sortedRiasec.join('');
  
  // Calculate dominant brain quadrants (top 2)
  const brainScores = this.brainProfileResult?.scores as IBrainScores;
  const dominantBrainQuadrants = Object.entries(brainScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([quadrant]) => quadrant);
  
  // Calculate employability quotient
  const stepsScores = this.employabilityResult?.scores as IStepsScores;
  const avgStepsScore = Object.values(stepsScores).reduce((a, b) => a + b, 0) / 5;
  const employabilityQuotient = Math.round((avgStepsScore / 5) * 10 * 10) / 10;
  
  // Generate interpretations and recommendations
  const overallInterpretation = this.generateOverallInterpretation(
    hollandCode, 
    dominantBrainQuadrants, 
    employabilityQuotient
  );
  
  const careerRecommendations = this.generateCareerRecommendations(hollandCode);
  const learningStyleRecommendations = this.generateLearningRecommendations(dominantBrainQuadrants);
  const skillDevelopmentAreas = this.generateSkillDevelopmentAreas(stepsScores);
  
  return {
    hollandCode,
    dominantBrainQuadrants,
    employabilityQuotient,
    overallInterpretation,
    careerRecommendations,
    learningStyleRecommendations,
    skillDevelopmentAreas
  };
};

// Helper methods for generating interpretations
psychometricTestSchema.methods.generateOverallInterpretation = function(
  hollandCode: string, 
  brainQuadrants: string[], 
  employabilityQuotient: number
): string {
  const riasecDescriptions = {
    R: 'hands-on and practical',
    I: 'analytical and research-oriented',
    A: 'creative and expressive',
    S: 'people-focused and helpful',
    E: 'leadership-oriented and persuasive',
    C: 'organized and detail-oriented'
  };
  
  const brainDescriptions = {
    L1: 'logical and analytical',
    L2: 'organized and systematic',
    R1: 'creative and strategic',
    R2: 'empathetic and collaborative'
  };
  
  const primaryInterest = riasecDescriptions[hollandCode[0] as keyof typeof riasecDescriptions];
  const primaryBrain = brainDescriptions[brainQuadrants[0] as keyof typeof brainDescriptions];
  
  let employabilityLevel = 'developing';
  if (employabilityQuotient >= 8) employabilityLevel = 'excellent';
  else if (employabilityQuotient >= 6) employabilityLevel = 'good';
  else if (employabilityQuotient >= 4) employabilityLevel = 'moderate';
  
  return `Based on your assessment, you have a ${primaryInterest} personality with ${primaryBrain} thinking preferences. Your Holland Code ${hollandCode} suggests you thrive in environments that match these characteristics. Your employability skills are at a ${employabilityLevel} level (${employabilityQuotient}/10), indicating ${employabilityQuotient >= 7 ? 'strong job readiness' : 'areas for professional development'}.`;
};

psychometricTestSchema.methods.generateCareerRecommendations = function(hollandCode: string): string[] {
  const careerMappings = {
    R: ['Engineer', 'Technician', 'Mechanic', 'Farmer', 'Construction Worker'],
    I: ['Researcher', 'Scientist', 'Analyst', 'Doctor', 'Mathematician'],
    A: ['Artist', 'Designer', 'Writer', 'Musician', 'Photographer'],
    S: ['Teacher', 'Counselor', 'Social Worker', 'Nurse', 'Coach'],
    E: ['Manager', 'Entrepreneur', 'Sales Representative', 'Lawyer', 'Politician'],
    C: ['Accountant', 'Administrator', 'Data Entry Clerk', 'Librarian', 'Secretary']
  };
  
  const recommendations: string[] = [];
  for (const letter of hollandCode) {
    recommendations.push(...careerMappings[letter as keyof typeof careerMappings]);
  }
  
  // Remove duplicates and return top 10
  return [...new Set(recommendations)].slice(0, 10);
};

psychometricTestSchema.methods.generateLearningRecommendations = function(brainQuadrants: string[]): string[] {
  const learningMappings = {
    L1: ['Use logical frameworks and step-by-step approaches', 'Focus on facts and data-driven learning'],
    L2: ['Create structured study schedules', 'Use detailed notes and organized materials'],
    R1: ['Engage in creative problem-solving', 'Use visual aids and mind maps'],
    R2: ['Learn through group discussions', 'Seek mentors who provide emotional support']
  };
  
  const recommendations: string[] = [];
  for (const quadrant of brainQuadrants) {
    recommendations.push(...learningMappings[quadrant as keyof typeof learningMappings]);
  }
  
  return recommendations;
};

psychometricTestSchema.methods.generateSkillDevelopmentAreas = function(stepsScores: IStepsScores): string[] {
  const skillMappings = {
    S: 'Self-management skills',
    T: 'Teamwork and collaboration',
    E: 'Enterprising and leadership',
    P: 'Problem-solving abilities',
    Speaking: 'Communication skills'
  };
  
  // Identify areas with scores below 3.5
  const developmentAreas: string[] = [];
  Object.entries(stepsScores).forEach(([key, score]) => {
    if (score < 3.5) {
      developmentAreas.push(skillMappings[key as keyof typeof skillMappings]);
    }
  });
  
  return developmentAreas.length > 0 ? developmentAreas : ['Continue developing all skill areas'];
};

// Add instance methods to your schema
psychometricTestSchema.methods.isComplete = function(): boolean {
  // Define your completion logic
  const requiredSections = ['riasec', 'brainProfile', 'employability', 'personalInsights'];
  
  return requiredSections.every(section => {
    switch(section) {
      case 'riasec':
        return this.riasecResult && Object.keys(this.riasecResult).length > 0;
      case 'brainProfile':
        return this.brainProfileResult && Object.keys(this.brainProfileResult).length > 0;
      case 'employability':
        return this.employabilityResult && Object.keys(this.employabilityResult).length > 0;
      case 'personalInsights':
        return this.personalInsightsResult && Object.keys(this.personalInsightsResult).length > 0;
      default:
        return false;
    }
  });
};

psychometricTestSchema.methods.generateSummary = function(): string {
  let summary = '';
  
  if (this.riasecResult) {
    const topType = Object.entries(this.riasecResult)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    summary += `Your dominant career interest is ${topType[0]}. `;
  }
  
  if (this.brainProfileResult) {
    summary += `Your learning style is ${this.brainProfileResult.dominantQuadrant}. `;
  }
  
  return summary.trim();
};

// Static method to find user's latest test
psychometricTestSchema.statics.findLatestByUser = function(userId: Types.ObjectId) {
  return this.findOne({ userId })
    .sort({ createdAt: -1 })
    .exec();
};

// Static method to find completed tests
psychometricTestSchema.statics.findCompletedByUser = function(userId: Types.ObjectId) {
  return this.find({ 
    userId, 
    status: 'completed' 
  })
    .sort({ completedAt: -1 })
    .exec();
};

// Pre-save middleware
psychometricTestSchema.pre('save', function(next) {
  // Auto-complete test if all sections are done
  if (this.isComplete() && this.status === 'in_progress') {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Calculate overall results if not already done
    if (!this.overallResults) {
      this.overallResults = this.calculateOverallResults();
    }
  }
  
  next();
});

// Export the model
export const PsychometricTest = model<IPsychometricTest>('PsychometricTest', psychometricTestSchema);
export default PsychometricTest;