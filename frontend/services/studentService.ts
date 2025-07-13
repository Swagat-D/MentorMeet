// services/studentService.ts - Student Progress and Data Service
import ApiService from './api';

export interface StudentProgress {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionRating: number;
  completionRate: number;
  favoriteSubjects: Array<{
    subject: string;
    sessionsCount: number;
    averageRating: number;
  }>;
  recentAchievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  weeklyGoal: {
    target: number;
    completed: number;
    percentage: number;
  };
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
}

export interface LearningInsight {
  type: 'improvement' | 'milestone' | 'recommendation' | 'streak';
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  icon: string;
  color: string;
}

class StudentService {
  /**
   * Get comprehensive student progress data
   */
  static async getStudentProgress(studentId?: string): Promise<StudentProgress> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/student/progress${studentId ? `/${studentId}` : ''}`;
      
      console.log('📊 Fetching student progress from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ApiService.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Student progress loaded');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to load progress');
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching student progress:', error);
      
      // Return default progress if API fails
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        totalLearningHours: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSessionRating: 0,
        completionRate: 0,
        favoriteSubjects: [],
        recentAchievements: [],
        weeklyGoal: { target: 5, completed: 0, percentage: 0 },
      };
    }
  }

  /**
   * Get upcoming sessions for student
   */
  static async getUpcomingSessions(studentId?: string, limit: number = 5): Promise<UpcomingSession[]> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/student/sessions/upcoming${studentId ? `/${studentId}` : ''}?limit=${limit}`;
      
      console.log('📅 Fetching upcoming sessions from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ApiService.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Found ${result.data.length} upcoming sessions`);
        return result.data;
      } else {
        console.log('📭 No upcoming sessions found');
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Get personalized learning insights
   */
  static async getLearningInsights(studentId?: string): Promise<LearningInsight[]> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/student/insights${studentId ? `/${studentId}` : ''}`;
      
      console.log('💡 Fetching learning insights from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ApiService.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Found ${result.data.length} learning insights`);
        return result.data;
      } else {
        console.log('📭 No insights available');
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching learning insights:', error);
      return [];
    }
  }

  /**
   * Get student session history
   */
  static async getSessionHistory(studentId?: string, limit: number = 10): Promise<any[]> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/student/sessions/history${studentId ? `/${studentId}` : ''}?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ApiService.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching session history:', error);
      return [];
    }
  }

  /**
   * Update weekly learning goal
   */
  static async updateWeeklyGoal(target: number): Promise<boolean> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/student/goal/weekly`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ApiService.getAuthToken()}`,
        },
        body: JSON.stringify({ target }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
      
    } catch (error: any) {
      console.error('❌ Error updating weekly goal:', error);
      return false;
    }
  }

  /**
   * Get student achievements
   */
  static async getAchievements(studentId?: string): Promise<any[]> {
    try {
      const baseUrl = await ApiService.getCurrentBackendInfo();
      const url = `${baseUrl}/api/student/achievements${studentId ? `/${studentId}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ApiService.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching achievements:', error);
      return [];
    }
  }
}

export default StudentService;