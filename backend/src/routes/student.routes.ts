import { Router, Request, Response } from 'express';
import withAuth, { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { Session } from '@/models/Session.model';
import { IFavoriteSubject, StudentProgress } from '@/models/StudentProgress.model';
import { Achievement } from '@/models/Achievement.model';
import { LearningInsight, ILearningInsight } from '@/models/LearningInsight.model';
import { ObjectId } from 'mongodb';
import { getWeekStart, calculateCurrentStreak } from '@/utils/dateHelpers';

const router = Router();

// GET /api/student/progress/:studentId?
export const getStudentProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.userId;
    
    console.log('📊 Fetching progress for student:', studentId);
    
    // Get or create progress record
    let progress = await StudentProgress.findOne({ studentId: new ObjectId(studentId) });
    
    if (!progress) {
      console.log('🔄 Creating new progress record...');
      progress = await calculateAndCreateProgress(studentId);
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
    }
    const percentage = progress && progress.weeklyGoal && progress.weeklyGoal.target > 0 
      ? (weekSessions / progress.weeklyGoal.target) * 100 
      : 0;
    
    const responseData = {
      ...(progress ? progress.toObject() : {}),
      weeklyGoal: {
        ...(progress && progress.weeklyGoal ? progress.weeklyGoal : {}),
        percentage: Math.min(percentage, 100)
      },
      recentAchievements: achievements.map(ach => ({
        title: ach.title,
        description: ach.description,
        earnedAt: ach.earnedAt.toISOString(),
        icon: ach.icon
      }))
    };
    
    res.json({
      success: true,
      data: responseData
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching student progress:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch student progress' 
    });
  }
};

// GET /api/student/sessions/upcoming/:studentId?
export const getUpcomingSessions = withAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 5;
    
    console.log('📅 Fetching upcoming sessions for student:', studentId);
    
    const sessions = await Session.find({
      studentId: new ObjectId(studentId),
      status: { $in: ['scheduled', 'confirmed'] },
      scheduledTime: { $gte: new Date() }
    })
    .populate('mentorId', 'firstName lastName profilePhoto')
    .sort({ scheduledTime: 1 })
    .limit(limit);
    
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      mentorName: `${(session.mentorId as any).firstName} ${(session.mentorId as any).lastName}`,
      mentorAvatar: (session.mentorId as any).profilePhoto || generateDefaultAvatar((session.mentorId as any).firstName),
      subject: session.subject,
      scheduledTime: session.scheduledTime.toISOString(),
      duration: session.duration,
      sessionType: session.sessionType,
      status: session.status
    }));
    
    res.json({
      success: true,
      data: formattedSessions
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching upcoming sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch upcoming sessions' 
    });
  }
});

// GET /api/student/insights/:studentId?
export const getLearningInsights = withAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.userId;
    
    console.log('💡 Fetching learning insights for student:', studentId);
    
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
      const newInsights = await generateInsights(studentId);
      const newInsightDocs = await LearningInsight.find({
        _id: { $in: newInsights.map(i => i._id) }
      });
      insights = [...insights, ...newInsightDocs];
    }
    
    res.json({
      success: true,
      data: insights.slice(0, 4)
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching learning insights:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch learning insights' 
    });
  }
});

// GET /api/student/achievements/:studentId?
export const getAchievements = withAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log('🏆 Fetching achievements for student:', studentId);
    
    const achievements = await Achievement.find({ studentId: new ObjectId(studentId) })
      .sort({ earnedAt: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      data: achievements
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching achievements:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch achievements' 
    });
  }
});

// PUT /api/student/goal/weekly
export const updateWeeklyGoal = withAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { target } = req.body;
    
    if (!target || target < 1 || target > 20) {
      res.status(400).json({
        success: false,
        message: 'Target must be between 1 and 20 sessions per week'
      });
      return;
    }
    
    await StudentProgress.findOneAndUpdate(
      { studentId: new ObjectId(studentId) },
      { 
        $set: { 
          'weeklyGoal.target': target,
          'weeklyGoal.weekStart': getWeekStart(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Weekly goal updated successfully'
    });
    return;
    
  } catch (error: any) {
    console.error('❌ Error updating weekly goal:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update weekly goal' 
    });
    return;
  }
});

// Helper Functions
const calculateAndCreateProgress = async (studentId: string): Promise<typeof StudentProgress.prototype> => {
  console.log('🔄 Calculating progress for student:', studentId);
  
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
    monthlyStats: []
  };
  
  return await StudentProgress.create(progressData);
};

const generateInsights = async (studentId: string): Promise<ILearningInsight[]> => {
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
      priority: 4
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
      priority: 3
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
      priority: 4
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
      priority: 5
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
        priority: 2
      });
    }
  }
  
  // Save insights to database
  const validInsights = insights.filter(i => i.studentId !== undefined) as ILearningInsight[];
  const savedInsights = await LearningInsight.insertMany(validInsights);
  return savedInsights as ILearningInsight[];
};

const generateDefaultAvatar = (firstName: string): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=8B4513&color=fff&size=200`;
};

// Route definitions
router.get('/progress/:studentId?', withAuth.authenticate, getStudentProgress);
router.get('/sessions/upcoming/:studentId?', getUpcomingSessions);
router.get('/insights/:studentId?', getLearningInsights);
router.get('/achievements/:studentId?', getAchievements);
router.put('/goal/weekly', updateWeeklyGoal);

export default router;

