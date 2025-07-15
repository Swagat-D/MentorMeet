// backend/src/models/PsychometricTest.model.ts - Production-Ready Model
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

// Main Psychometric Test Document Interface
export interface IPsychometricTest extends Document {
  userId: Types.ObjectId;
  
  // Test Metadata
  testId: string; // Unique test identifier
  status: 'in_progress' | 'completed' | 'abandoned';
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
  
  // Progress tracking
  lastActiveSection?: string;
  progressData?: {
    currentQuestionIndex: number;
    partialResponses: { [key: string]: any };
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isComplete(): boolean;
  calculateOverallResults(): IAssessmentResults;
  generateSummary(): string;
  getNextSection(): string | null;
}

// Optimized Schema Definitions
const riasecScoresSchema = new Schema<IRiasecScores>({
  R: { type: Number, default: 0, min: 0, max: 54 },
  I: { type: Number, default: 0, min: 0, max: 54 },
  A: { type: Number, default: 0, min: 0, max: 54 },
  S: { type: Number, default: 0, min: 0, max: 54 },
  E: { type: Number, default: 0, min: 0, max: 54 },
  C: { type: Number, default: 0, min: 0, max: 54 },
}, { _id: false });

const brainScoresSchema = new Schema<IBrainScores>({
  L1: { type: Number, default: 0, min: 0, max: 40 },
  L2: { type: Number, default: 0, min: 0, max: 40 },
  R1: { type: Number, default: 0, min: 0, max: 40 },
  R2: { type: Number, default: 0, min: 0, max: 40 },
}, { _id: false });

const stepsScoresSchema = new Schema<IStepsScores>({
  S: { type: Number, default: 0, min: 0, max: 5 },
  T: { type: Number, default: 0, min: 0, max: 5 },
  E: { type: Number, default: 0, min: 0, max: 5 },
  P: { type: Number, default: 0, min: 0, max: 5 },
  Speaking: { type: Number, default: 0, min: 0, max: 5 },
}, { _id: false });

const personalInsightsSchema = new Schema<IPersonalInsights>({
  whatYouLike: { 
    type: String, 
    required: true, 
    minlength: 10,
    maxlength: 500,
    trim: true
  },
  whatYouAreGoodAt: { 
    type: String, 
    required: true, 
    minlength: 10,
    maxlength: 500,
    trim: true
  },
  recentProjects: { 
    type: String, 
    required: true, 
    minlength: 10,
    maxlength: 500,
    trim: true
  },
  characterStrengths: [{
    type: String,
    maxlength: 100,
    trim: true
  }],
  valuesInLife: [{
    type: String,
    maxlength: 100,
    trim: true
  }],
}, { _id: false });

const testResultSchema = new Schema<ITestResult>({
  sectionId: { 
    type: String, 
    required: true,
    enum: ['riasec', 'brainProfile', 'employability']
  },
  sectionName: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  completedAt: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  timeSpent: { 
    type: Number, 
    required: true, 
    min: 0,
    max: 7200 // 2 hours max
  },
  responses: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  scores: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  interpretation: { 
    type: String, 
    required: true,
    maxlength: 3000
  },
  recommendations: [{
    type: String,
    maxlength: 300
  }],
}, { _id: false });

const assessmentResultsSchema = new Schema<IAssessmentResults>({
  hollandCode: { 
    type: String, 
    required: true, 
    minlength: 1,
    maxlength: 6,
    match: /^[RIASEC]+$/
  },
  dominantBrainQuadrants: [{
    type: String,
    enum: ['L1', 'L2', 'R1', 'R2']
  }],
  employabilityQuotient: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 10 
  },
  overallInterpretation: { 
    type: String, 
    required: true,
    maxlength: 5000
  },
  careerRecommendations: [{
    type: String,
    maxlength: 150
  }],
  learningStyleRecommendations: [{
    type: String,
    maxlength: 300
  }],
  skillDevelopmentAreas: [{
    type: String,
    maxlength: 150
  }],
}, { _id: false });

// Main Schema with Performance Optimizations
const psychometricTestSchema = new Schema<IPsychometricTest>({
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
    index: true,
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
    required: true,
    index: true
  },
  
  completedAt: { 
    type: Date,
    index: true
  },
  
  totalTimeSpent: { 
    type: Number, 
    default: 0, 
    min: 0,
    max: 14400 // 4 hours max
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
  
  lastActiveSection: {
    type: String,
    enum: ['riasec', 'brainProfile', 'employability', 'personalInsights']
  },
  
  progressData: {
    currentQuestionIndex: { 
      type: Number, 
      default: 0,
      min: 0
    },
    partialResponses: { 
      type: Schema.Types.Mixed, 
      default: {} 
    }
  }
  
}, {
  timestamps: true,
  versionKey: false,
  // Optimize for read operations
  read: 'primaryPreferred',
  // Optimize write operations
  writeConcern: { w: 'majority', j: true }
});

// Compound Indexes for Performance
psychometricTestSchema.index({ userId: 1, status: 1 });
psychometricTestSchema.index({ userId: 1, createdAt: -1 });
psychometricTestSchema.index({ testId: 1, userId: 1 });
psychometricTestSchema.index({ status: 1, completedAt: -1 });
psychometricTestSchema.index({ 'overallResults.hollandCode': 1 });

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

// Instance method to check if test is complete
psychometricTestSchema.methods.isComplete = function(): boolean {
  return Object.values(this.sectionsCompleted).every(Boolean);
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

// Helper method for generating overall interpretation
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
  
  return `Your assessment reveals a ${primaryInterest} personality with ${primaryBrain} thinking preferences. Your Holland Code ${hollandCode} indicates strong alignment with these characteristics. Your employability skills are at a ${employabilityLevel} level (${employabilityQuotient}/10), suggesting ${employabilityQuotient >= 7 ? 'strong job readiness' : 'opportunities for professional development'}.`;
};

// Helper method for generating career recommendations
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
  
  return [...new Set(recommendations)].slice(0, 10);
};

// Helper method for generating learning recommendations
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

// Helper method for generating skill development areas
psychometricTestSchema.methods.generateSkillDevelopmentAreas = function(stepsScores: IStepsScores): string[] {
  const skillMappings = {
    S: 'Self-management skills',
    T: 'Teamwork and collaboration',
    E: 'Enterprising and leadership',
    P: 'Problem-solving abilities',
    Speaking: 'Communication skills'
  };
  
  const developmentAreas: string[] = [];
  Object.entries(stepsScores).forEach(([key, score]) => {
    if (score < 3.5) {
      developmentAreas.push(skillMappings[key as keyof typeof skillMappings]);
    }
  });
  
  return developmentAreas.length > 0 ? developmentAreas : ['Continue developing all skill areas'];
};

// Instance method to generate summary
psychometricTestSchema.methods.generateSummary = function(): string {
  let summary = '';
  
  if (this.riasecResult) {
    const riasecScores = this.riasecResult.scores as IRiasecScores;
    const topType = Object.entries(riasecScores)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    summary += `Your dominant career interest is ${topType[0]}. `;
  }
  
  if (this.brainProfileResult) {
    const brainScores = this.brainProfileResult.scores as IBrainScores;
    const dominantQuadrant = Object.entries(brainScores)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
    summary += `Your learning style is ${dominantQuadrant}. `;
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

// Pre-save middleware for auto-completion and validation
psychometricTestSchema.pre('save', function(next) {
  // Auto-complete test if all sections are done
  if (this.isComplete() && this.status === 'in_progress') {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Calculate overall results if not already done
    if (!this.overallResults) {
      try {
        this.overallResults = this.calculateOverallResults();
      } catch (error) {
        console.error('Error calculating overall results:', error);
      }
    }
  }
  
  // Validate time spent
  if (this.totalTimeSpent < 0) {
    this.totalTimeSpent = 0;
  }
  
  next();
});

// Post-save middleware for logging
psychometricTestSchema.post('save', function(doc) {
  const completionPercentage = Math.round((Object.values(doc.sectionsCompleted).filter(Boolean).length / 4) * 100);
  console.log(`📋 Test saved: ${doc.testId} - Status: ${doc.status} - Completion: ${completionPercentage}%`);
});

// Static methods for analytics
psychometricTestSchema.statics.getCompletionStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$totalTimeSpent' }
      }
    }
  ]);
};

psychometricTestSchema.statics.getHollandCodeDistribution = async function() {
  return await this.aggregate([
    {
      $match: { 
        status: 'completed',
        'overallResults.hollandCode': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$overallResults.hollandCode',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// TTL Index for abandoned tests (cleanup after 30 days)
psychometricTestSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { status: 'abandoned' }
  }
);

// Export the model
export const PsychometricTest = model<IPsychometricTest>('PsychometricTest', psychometricTestSchema);
export default PsychometricTest;

console.log('✅ PsychometricTest model registered with optimizations');