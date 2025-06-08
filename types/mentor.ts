// types/mentor.ts - Mentor and Session Type Definitions
export interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpfulCount: number;
}

export interface SessionType {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  price: number;
  type: 'video_call' | 'audio_call' | 'chat' | 'in_person';
  maxParticipants: number;
  isPopular?: boolean;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  field?: string;
  gpa?: string;
  honors?: string[];
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
  skills: string[];
  current?: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Availability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  timezone: string;
}

export interface MentorStats {
  totalSessions: number;
  totalStudents: number;
  averageRating: number;
  responseTime: string; // "within 2 hours"
  completionRate: number; // percentage
  repeatStudents: number;
  yearsOfExperience: number;
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  rating: number;
  location: string;
  timezone: string;
  languages: string[];
  subjects: string[];
  sessionTypes: SessionType[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  reviews: Review[];
  availability: Availability[];
  stats: MentorStats;
  isVerified: boolean;
  isPremium: boolean;
  isOnline: boolean;
  lastActive: string;
  joinedDate: string;
  hourlyRate: number;
  specialties: string[];
  teachingStyle: string[];
  badges: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
}

export interface Session {
  id: string;
  mentor: {
    id: string;
    name: string;
    avatar: string;
  };
  mentee: {
    id: string;
    name: string;
    avatar: string;
  };
  subject: string;
  sessionType: SessionType;
  date: string;
  duration: number;
  price: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled';
  meetingLink?: string;
  notes?: string;
  materials?: string[];
  recording?: string;
  feedback?: {
    mentorRating: number;
    menteeRating: number;
    mentorComment?: string;
    menteeComment?: string;
  };
  userRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  subjects: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  availability: string[];
  sessionTypes: string[];
  location?: string;
  experience: string;
  languages: string[];
  sortBy: 'rating' | 'price' | 'experience' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

export interface MentorSearchResult {
  mentors: Mentor[];
  totalCount: number;
  hasNextPage: boolean;
  filters: SearchFilters;
}

export type MentorCardVariant = 'default' | 'compact' | 'featured' | 'list';