import { Router, Request, Response } from 'express';
import withAuth from '../middleware/auth.middleware.js';
import { IUser } from '../models/User.model.js';
import { Session } from '../models/Session.model.js';
import { IFavoriteSubject, StudentProgress } from '../models/StudentProgress.model.js';
import { Achievement } from '../models/Achievement.model.js';
import { LearningInsight, ILearningInsight } from '../models/LearningInsight.model.js';
import { getWeekStart, calculateCurrentStreak } from '../utils/dateHelpers.js';
import { ObjectId } from 'mongodb';

const router = Router();

// GET /api/v1/student/progress/:studentId?
export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const studentId = req.params.studentId || req.user!._id;
    
    console.log('📊 Fetching progress for student:', studentId);
    
    // Validate student ID format
    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    // Get or create progress record
    let progress = await StudentProgress.findOne({ studentId: new ObjectId(studentId) });
    
    if (!progress) {
      console.log('🔄 Creating new progress record...');
      progress = await calculateAndCreateProgress(typeof studentId === 'string' ? studentId : studentId.toString());
    }
    
    // Get recent achievements
    const achievements = await Achievement.find({ studentId: new ObjectId(studentId) })
      .sort({ earnedAt: -1 })
      .limit(3);
    
    // Calculate current week progress
    const weekStart = getWeekStart();
    const weekSessions = await Session.countDocuments({
      studentId: new ObjectId(studentId),
      status: 'completed',
      scheduledTime: { $gte: weekStart }
    });
    
    // Update weekly goal progress
    if (progress && progress.weeklyGoal) {
      progress.weeklyGoal.completed = weekSessions;
      await progress.save();
    }
    
    const percentage = progress && progress.weeklyGoal && progress.weeklyGoal.target > 0 
      ? Math.min((weekSessions / progress.weeklyGoal.target) * 100, 100)
      : 0;
    
    const responseData = {
      ...(progress ? progress.toObject() : {}),
      weeklyGoal: {
        ...(progress && progress.weeklyGoal ? progress.weeklyGoal : { target: 3, completed: 0, weekStart }),
        percentage: Math.round(percentage * 10) / 10
      },
      recentAchievements: achievements.map(ach => ({
        title: ach.title,
        description: ach.description,
        earnedAt: ach.earnedAt.toISOString(),
        icon: ach.icon,
        type: ach.type
      }))
    };
    
    return res.json({
      success: true,
      data: responseData
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching student progress:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch student progress' 
    });
  }
};

// GET /api/v1/student/sessions/upcoming/:studentId?
export const getUpcomingSessions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const studentId = req.params.studentId || req.user!._id;
    const limit = parseInt(req.query.limit as string) || 5;
    
    console.log('📅 Fetching upcoming sessions for student:', studentId);
    
    // Validate student ID format
    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    const sessions = await Session.find({
      studentId: new ObjectId(studentId),
      status: { $in: ['scheduled', 'confirmed'] },
      scheduledTime: { $gte: new Date() }
    })
    .populate('mentorId', 'name firstName lastName avatar profilePhoto email')
    .sort({ scheduledTime: 1 })
    .limit(limit);
    
    const formattedSessions = sessions.map(session => {
      const mentor = session.mentorId as any;
      const mentorName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || 'Unknown Mentor';
      
      return {
        _id: session._id,
        mentorId: mentor._id,
        mentorName,
        mentorAvatar: mentor.avatar || mentor.profilePhoto || generateDefaultAvatar(mentorName),
        subject: session.subject,
        scheduledTime: session.scheduledTime.toISOString(),
        duration: session.duration,
        sessionType: session.sessionType || 'video',
        status: session.status
      };
    });
    
    return res.json({
      success: true,
      data: formattedSessions
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching upcoming sessions:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch upcoming sessions' 
    });
  }
};

// GET /api/v1/student/insights/:studentId?
export const getLearningInsights = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const studentId = req.params.studentId || req.user!._id;
    
    console.log('💡 Fetching learning insights for student:', studentId);
    
    // Validate student ID format
    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    // Get existing active insights
    let insights = await LearningInsight.find({
      studentId: new ObjectId(studentId),
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ]
    }).sort({ priority: -1, createdAt: -1 });
    
    // Generate new insights if needed
    if (insights.length < 3) {
      console.log('🔄 Generating new insights...');
      const newInsights = await generateInsights(typeof studentId === 'string' ? studentId : studentId.toString());
      
      // Fetch the newly created insights
      const newInsightDocs = await LearningInsight.find({
        _id: { $in: newInsights.map(i => i._id) }
      });
      
      insights = [...insights, ...newInsightDocs];
    }
    
    return res.json({
      success: true,
      data: insights.slice(0, 4)
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching learning insights:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch learning insights' 
    });
  }
};

// GET /api/v1/student/achievements/:studentId?
export const getAchievements = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const studentId = req.params.studentId || req.user!._id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log('🏆 Fetching achievements for student:', studentId);
    
    // Validate student ID format
    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    const achievements = await Achievement.find({ studentId: new ObjectId(studentId) })
      .sort({ earnedAt: -1 })
      .limit(limit);
    
    return res.json({
      success: true,
      data: achievements
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching achievements:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch achievements' 
    });
  }
};

// PUT /api/v1/student/goal/weekly
export const updateWeeklyGoal = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const studentId = req.user!._id;
    const { target } = req.body;
    
    console.log('🎯 Updating weekly goal for student:', studentId, 'Target:', target);
    
    // Validate input
    if (!target || typeof target !== 'number' || target < 1 || target > 20) {
      return res.status(400).json({
        success: false,
        message: 'Target must be a number between 1 and 20 sessions per week'
      });
    }
    
    // Validate student ID format
    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    // Calculate current week progress
    const weekStart = getWeekStart();
    const weekSessions = await Session.countDocuments({
      studentId: new ObjectId(studentId),
      status: 'completed',
      scheduledTime: { $gte: weekStart }
    });
    
    const updatedProgress = await StudentProgress.findOneAndUpdate(
      { studentId: new ObjectId(studentId) },
      { 
        $set: { 
          'weeklyGoal.target': target,
          'weeklyGoal.completed': weekSessions,
          'weeklyGoal.weekStart': weekStart,
          updatedAt: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log('✅ Weekly goal updated successfully');
    
    return res.json({
      success: true,
      message: 'Weekly goal updated successfully',
      data: {
        weeklyGoal: updatedProgress?.weeklyGoal
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error updating weekly goal:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update weekly goal' 
    });
  }
};

// Helper Functions
const calculateAndCreateProgress = async (studentId: string): Promise<typeof StudentProgress.prototype> => {
  console.log('🔄 Calculating progress for student:', studentId);
  
  try {
    const sessions = await Session.find({ studentId: new ObjectId(studentId) });
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    // Calculate total learning hours
    const totalHours = completedSessions.reduce((sum, session) => {
      const start = new Date(session.actualStartTime || session.scheduledTime);
      const end = new Date(session.actualEndTime || new Date(start.getTime() + session.duration * 60000));
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    }, 0);
    
    // Calculate average rating
    const ratingsSum = completedSessions.reduce((sum, s) => sum + (s.studentRating || 0), 0);
    const averageRating = completedSessions.length > 0 ? ratingsSum / completedSessions.length : 0;
    
    // Calculate completion rate
    const completionRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;
    
    // Calculate streak
    const streakData = calculateCurrentStreak(completedSessions);
    
    // Group by subjects
    const subjectStats: { [key: string]: { count: number; totalRating: number; totalHours: number } } = {};
    
    completedSessions.forEach(session => {
      if (!subjectStats[session.subject]) {
        subjectStats[session.subject] = { count: 0, totalRating: 0, totalHours: 0 };
      }
      subjectStats[session.subject].count++;
      subjectStats[session.subject].totalRating += session.studentRating || 0;
      subjectStats[session.subject].totalHours += session.duration / 60;
    });
    
    const favoriteSubjects: IFavoriteSubject[] = Object.entries(subjectStats)
      .map(([subject, stats]) => ({
        subject,
        sessionsCount: stats.count,
        averageRating: stats.count > 0 ? stats.totalRating / stats.count : 0,
        totalHours: stats.totalHours
      }))
      .sort((a, b) => b.sessionsCount - a.sessionsCount)
      .slice(0, 5);
    
    // Generate monthly stats
    const monthlyStats = generateMonthlyStats(completedSessions);
    
    const progressData = {
      studentId: new ObjectId(studentId),
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      noShowSessions: sessions.filter(s => s.status === 'no-show').length,
      totalLearningHours: Math.round(totalHours * 10) / 10,
      averageSessionRating: Math.round(averageRating * 10) / 10,
      completionRate: Math.round(completionRate),
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
      favoriteSubjects,
      lastSessionDate: completedSessions.length > 0 
        ? completedSessions[completedSessions.length - 1].scheduledTime 
        : undefined,
      weeklyGoal: {
        target: 3,
        completed: 0,
        weekStart: getWeekStart()
      },
      monthlyStats
    };
    
    return await StudentProgress.create(progressData);
  } catch (error) {
    console.error('❌ Error calculating progress:', error);
    throw error;
  }
};

const generateMonthlyStats = (completedSessions: any[]) => {
  const monthlyData: { [key: string]: { sessions: number; hours: number; totalRating: number; count: number } } = {};
  
  completedSessions.forEach(session => {
    const month = new Date(session.scheduledTime).toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { sessions: 0, hours: 0, totalRating: 0, count: 0 };
    }
    monthlyData[month].sessions++;
    monthlyData[month].hours += session.duration / 60;
    if (session.studentRating) {
      monthlyData[month].totalRating += session.studentRating;
      monthlyData[month].count++;
    }
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      sessionsCompleted: data.sessions,
      hoursLearned: Math.round(data.hours * 10) / 10,
      averageRating: data.count > 0 ? Math.round((data.totalRating / data.count) * 10) / 10 : 0
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12); // Last 12 months
};

const generateInsights = async (studentId: string): Promise<ILearningInsight[]> => {
  try {
    const progress = await StudentProgress.findOne({ studentId: new ObjectId(studentId) });
    if (!progress) return [];
    
    const insights: Partial<ILearningInsight>[] = [];
    
    // Streak insights
    if (progress.currentStreak >= 7) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'streak',
        title: `🔥 ${progress.currentStreak} Day Streak!`,
        description: 'You\'re on fire! Keep up the consistent learning.',
        icon: 'local-fire-department',
        color: '#FF6B35',
        priority: 4,
        isActive: true
      });
    } else if (progress.currentStreak >= 3) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'streak',
        title: `⚡ ${progress.currentStreak} Day Streak`,
        description: 'Great consistency! Try to reach a 7-day streak.',
        icon: 'trending-up',
        color: '#10B981',
        priority: 3,
        isActive: true
      });
    }
    
    // Performance insights
    if (progress.averageSessionRating >= 4.5) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'milestone',
        title: '⭐ Excellent Performance',
        description: `Your average rating is ${progress.averageSessionRating.toFixed(1)}/5. You're doing great!`,
        icon: 'star',
        color: '#F59E0B',
        priority: 3,
        isActive: true
      });
    }
    
    // Goal insights
    const weekSessions = await Session.countDocuments({
      studentId: new ObjectId(studentId),
      status: 'completed',
      scheduledTime: { $gte: getWeekStart() }
    });
    
    if (weekSessions >= progress.weeklyGoal.target) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'goal',
        title: '🎯 Weekly Goal Achieved!',
        description: `You've completed ${weekSessions} sessions this week. Well done!`,
        icon: 'check-circle',
        color: '#10B981',
        priority: 4,
        isActive: true
      });
    } else if (weekSessions === progress.weeklyGoal.target - 1) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'goal',
        title: '🎯 Almost There!',
        description: 'Just one more session to reach your weekly goal.',
        action: 'Book a session',
        actionRoute: '/booking',
        icon: 'trending-up',
        color: '#3B82F6',
        priority: 5,
        isActive: true
      });
    }
    
    // Subject recommendations
    if (progress.favoriteSubjects.length > 0) {
      const topSubject = progress.favoriteSubjects[0];
      if (topSubject.averageRating >= 4.0) {
        insights.push({
          studentId: new ObjectId(studentId),
          type: 'recommendation',
          title: `📚 Master ${topSubject.subject}`,
          description: `You're excelling in ${topSubject.subject}. Consider advanced topics?`,
          action: 'Find advanced mentors',
          actionRoute: `/(tabs)/search?subject=${encodeURIComponent(topSubject.subject)}&level=advanced`,
          icon: 'school',
          color: '#8B5CF6',
          priority: 2,
          isActive: true
        });
      }
    }
    
    // Learning hour milestones
    if (progress.totalLearningHours >= 100) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'milestone',
        title: '🎓 Century Club!',
        description: `You've completed ${progress.totalLearningHours} hours of learning. Incredible dedication!`,
        icon: 'emoji-events',
        color: '#FFD700',
        priority: 5,
        isActive: true
      });
    } else if (progress.totalLearningHours >= 50) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'milestone',
        title: '🌟 50 Hours Milestone',
        description: `You're halfway to 100 hours! Keep up the great work.`,
        icon: 'auto-awesome',
        color: '#9C27B0',
        priority: 3,
        isActive: true
      });
    }
    
    // Default insight for new users
    if (progress.totalSessions === 0) {
      insights.push({
        studentId: new ObjectId(studentId),
        type: 'recommendation',
        title: '🚀 Start Your Journey',
        description: 'Book your first session with a mentor to begin tracking your progress.',
        action: 'Find Mentors',
        actionRoute: '/(tabs)/search',
        icon: 'school',
        color: '#8B4513',
        priority: 5,
        isActive: true
      });
    }
    
    // Save insights to database
    const validInsights = insights.filter(i => i.studentId !== undefined) as ILearningInsight[];
    if (validInsights.length > 0) {
      const savedInsights = await LearningInsight.insertMany(validInsights);
      return savedInsights as ILearningInsight[];
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error generating insights:', error);
    return [];
  }
};

const generateDefaultAvatar = (name: string): string => {
  const firstName = name.split(' ')[0] || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=8B4513&color=fff&size=200&bold=true`;
};

// Route definitions with proper middleware
router.get('/progress/:studentId?', withAuth.authenticate, getStudentProgress);
router.get('/sessions/upcoming/:studentId?', withAuth.authenticate, getUpcomingSessions);
router.get('/insights/:studentId?', withAuth.authenticate, getLearningInsights);
router.get('/achievements/:studentId?', withAuth.authenticate, getAchievements);
router.put('/goal/weekly', withAuth.authenticate, updateWeeklyGoal);

export default router;