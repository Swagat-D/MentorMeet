// frontend/services/studentService.ts - Complete Student Service Implementation
import ApiService from './api';

export interface StudentProgress {
  _id?: string;
  studentId: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  upcomingSessions: number;
  totalLearningHours: number;
  averageSessionRating: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate?: string;
  favoriteSubjects: Array<{
    subject: string;
    sessionsCount: number;
    averageRating: number;
    totalHours: number;
  }>;
  weeklyGoal: {
    target: number;
    completed: number;
    weekStart: string;
    percentage: number;
  };
  monthlyStats: Array<{
    month: string;
    sessionsCompleted: number;
    hoursLearned: number;
    averageRating: number;
  }>;
  recentAchievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingSession {
  _id: string;
  mentorName: string;
  mentorAvatar: string;
  subject: string;
  scheduledTime: string;
  duration: number;
  sessionType: 'video' | 'audio' | 'chat';
  status: 'scheduled' | 'confirmed' | 'pending';
  mentorId: string;
}

export interface LearningInsight {
  _id?: string;
  studentId: string;
  type: 'improvement' | 'milestone' | 'recommendation' | 'streak' | 'goal';
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  icon: string;
  color: string;
  priority: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Achievement {
  _id: string;
  studentId: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  type: string;
}

class StudentService {
  private static instance: StudentService;

  public static getInstance(): StudentService {
    if (!StudentService.instance) {
      StudentService.instance = new StudentService();
    }
    return StudentService.instance;
  }

  /**
   * Get student progress with enhanced error handling
   */
  async getStudentProgress(studentId?: string): Promise<StudentProgress> {
    try {
      console.log('📊 Fetching student progress...', { studentId });

      // Build URL with optional studentId parameter
      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = endpoints.GET_PROFILE.replace('/auth/me', '');
      
      const url = studentId 
        ? `${await baseUrl}/student/progress/${studentId}`
        : `${await baseUrl}/student/progress`;

      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch student progress');
      }

      // Enhance the response with calculated fields
      const progressData: StudentProgress = {
        ...response.data,
        upcomingSessions: await this.getUpcomingSessionsCount(studentId),
      };

      console.log('✅ Student progress fetched successfully:', progressData);
      return progressData;

    } catch (error: any) {
      console.error('❌ Error fetching student progress:', error);
      
      // Return default progress data if backend is unavailable
      return this.getDefaultProgress();
    }
  }

  /**
   * Get upcoming sessions for a student
   */
  async getUpcomingSessions(studentId?: string, limit: number = 5): Promise<UpcomingSession[]> {
    try {
      console.log('📅 Fetching upcoming sessions...', { studentId, limit });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = studentId
        ? `${baseUrl}/student/sessions/upcoming/${studentId}?limit=${limit}`
        : `${baseUrl}/student/sessions/upcoming?limit=${limit}`;

      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch upcoming sessions');
      }

      console.log('✅ Upcoming sessions fetched successfully:', response.data);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Get count of upcoming sessions
   */
  private async getUpcomingSessionsCount(studentId?: string): Promise<number> {
    try {
      const sessions = await this.getUpcomingSessions(studentId, 100);
      return sessions.length;
    } catch (error) {
      console.error('❌ Error getting upcoming sessions count:', error);
      return 0;
    }
  }

  /**
   * Get learning insights
   */
  async getLearningInsights(studentId?: string): Promise<LearningInsight[]> {
    try {
      console.log('💡 Fetching learning insights...', { studentId });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = studentId
        ? `${baseUrl}/student/insights/${studentId}`
        : `${baseUrl}/student/insights`;

      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch learning insights');
      }

      console.log('✅ Learning insights fetched successfully:', response.data);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching learning insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Get student achievements
   */
  async getAchievements(studentId?: string, limit: number = 10): Promise<Achievement[]> {
    try {
      console.log('🏆 Fetching achievements...', { studentId, limit });

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      
      const url = studentId
        ? `${baseUrl}/student/achievements/${studentId}?limit=${limit}`
        : `${baseUrl}/student/achievements?limit=${limit}`;

      const response = await ApiService.getUrl(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch achievements');
      }

      console.log('✅ Achievements fetched successfully:', response.data);
      return response.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching achievements:', error);
      return [];
    }
  }

  /**
   * Update weekly goal
   */
  async updateWeeklyGoal(target: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🎯 Updating weekly goal...', { target });

      if (target < 1 || target > 20) {
        throw new Error('Target must be between 1 and 20 sessions per week');
      }

      const endpoints = await import('./api').then(m => m.ApiEndpoints.getEndpoints());
      const baseUrl = (await endpoints).GET_PROFILE.replace('/auth/me', '');
      const url = `${baseUrl}/student/goal/weekly`;

      const response = await ApiService.putUrl(url, { target });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update weekly goal');
      }

      console.log('✅ Weekly goal updated successfully');
      return {
        success: true,
        message: 'Weekly goal updated successfully'
      };

    } catch (error: any) {
      console.error('❌ Error updating weekly goal:', error);
      return {
        success: false,
        message: error.message || 'Failed to update weekly goal'
      };
    }
  }

  /**
   * Get default progress data when backend is unavailable
   */
  private getDefaultProgress(): StudentProgress {
    return {
      studentId: '',
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      noShowSessions: 0,
      upcomingSessions: 0,
      totalLearningHours: 0,
      averageSessionRating: 0,
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      favoriteSubjects: [],
      weeklyGoal: {
        target: 3,
        completed: 0,
        weekStart: new Date().toISOString(),
        percentage: 0
      },
      monthlyStats: [],
      recentAchievements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get default insights when backend is unavailable
   */
  private getDefaultInsights(): LearningInsight[] {
    return [
      {
        studentId: '',
        type: 'recommendation',
        title: '🚀 Start Your Learning Journey',
        description: 'Book your first session with a mentor to begin tracking your progress.',
        action: 'Find Mentors',
        actionRoute: '/(tabs)/search',
        icon: 'school',
        color: '#8B4513',
        priority: 5,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(studentId?: string): Promise<{
    progress: StudentProgress;
    upcomingSessions: UpcomingSession[];
    insights: LearningInsight[];
    achievements: Achievement[];
  }> {
    try {
      console.log('📊 Fetching comprehensive dashboard data...');

      const [progress, upcomingSessions, insights, achievements] = await Promise.allSettled([
        this.getStudentProgress(studentId),
        this.getUpcomingSessions(studentId, 3),
        this.getLearningInsights(studentId),
        this.getAchievements(studentId, 3)
      ]);

      return {
        progress: progress.status === 'fulfilled' ? progress.value : this.getDefaultProgress(),
        upcomingSessions: upcomingSessions.status === 'fulfilled' ? upcomingSessions.value : [],
        insights: insights.status === 'fulfilled' ? insights.value : this.getDefaultInsights(),
        achievements: achievements.status === 'fulfilled' ? achievements.value : []
      };

    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      
      return {
        progress: this.getDefaultProgress(),
        upcomingSessions: [],
        insights: this.getDefaultInsights(),
        achievements: []
      };
    }
  }

  /**
   * Refresh all student data
   */
  async refreshStudentData(studentId?: string): Promise<boolean> {
    try {
      console.log('🔄 Refreshing all student data...');
      await this.getDashboardData(studentId);
      console.log('✅ Student data refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error refreshing student data:', error);
      return false;
    }
  }
}

// Export singleton instance
const studentService = StudentService.getInstance();
export default studentService;