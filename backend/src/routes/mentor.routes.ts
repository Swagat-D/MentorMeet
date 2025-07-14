// backend/src/routes/mentor.routes.ts - Complete Mentor Routes Implementation
import { Router, Request, Response } from 'express';
import withAuth from '@/middleware/auth.middleware';
import {IUser } from '@/models/User.model'
import { Mentor } from '@/models/Mentor.model';
import { Session } from '@/models/Session.model';
import { Review } from '@/models/Review.model';
import { ObjectId } from 'mongodb';

const router = Router();

// GET /api/v1/mentors/search - Search mentors with filters
export const searchMentors = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Searching mentors with query:', req.query);

    const {
      expertise,
      minPrice,
      maxPrice,
      minRating,
      minExperience,
      languages,
      isOnline,
      isVerified,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      search
    } = req.query;

    // Build filter object
    const filter: any = { isActive: true };

    // Expertise filter
    if (expertise && typeof expertise === 'string') {
      const expertiseArray = expertise.split(',').map(e => e.trim());
      filter.expertise = { $in: expertiseArray };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter['pricing.hourlyRate'] = {};
      if (minPrice) filter['pricing.hourlyRate'].$gte = parseFloat(minPrice as string);
      if (maxPrice) filter['pricing.hourlyRate'].$lte = parseFloat(maxPrice as string);
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating as string) };
    }

    // Experience filter
    if (minExperience) {
      filter.experience = { $gte: parseInt(minExperience as string) };
    }

    // Languages filter
    if (languages && typeof languages === 'string') {
      const languageArray = languages.split(',').map(l => l.trim());
      filter['languages.language'] = { $in: languageArray };
    }

    // Online status filter
    if (isOnline !== undefined) {
      filter.isOnline = isOnline === 'true';
    }

    // Verified filter
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    // Text search
    if (search && typeof search === 'string') {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    switch (sortBy) {
      case 'rating':
        sort.rating = sortOrder === 'asc' ? 1 : -1;
        sort.totalReviews = -1; // Secondary sort
        break;
      case 'price':
        sort['pricing.hourlyRate'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'experience':
        sort.experience = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'popularity':
        sort.totalStudents = sortOrder === 'asc' ? 1 : -1;
        sort.totalSessions = -1; // Secondary sort
        break;
      case 'response_time':
        sort.responseTime = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sort.rating = -1;
        sort.totalReviews = -1;
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population
    const [mentors, total] = await Promise.all([
      Mentor.find(filter)
        .populate('userId', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Mentor.countDocuments(filter)
    ]);

    // Get filter options for frontend
    const [availableExpertise, priceRange, availableLanguages] = await Promise.all([
      Mentor.distinct('expertise', { isActive: true }),
      Mentor.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            min: { $min: '$pricing.hourlyRate' },
            max: { $max: '$pricing.hourlyRate' }
          }
        }
      ]),
      Mentor.distinct('languages.language', { isActive: true })
    ]);

    const result = {
      mentors: mentors.map((mentor: any) => ({
        _id: mentor._id,
        userId: mentor.userId,
        displayName: mentor.displayName,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        email: mentor.email,
        profileImage: mentor.profileImage,
        bio: mentor.bio,
        expertise: mentor.expertise,
        experience: mentor.experience,
        education: mentor.education,
        languages: mentor.languages,
        pricing: mentor.pricing,
        rating: mentor.rating,
        totalSessions: mentor.totalSessions,
        totalStudents: mentor.totalStudents,
        completionRate: mentor.completionRate,
        responseTime: mentor.responseTime,
        isOnline: mentor.isOnline,
        lastSeen: mentor.lastSeen,
        isVerified: mentor.isVerified,
        status: mentor.status,
        specialties: mentor.specialties,
        teachingStyle: mentor.teachingStyle,
        createdAt: mentor.createdAt,
        updatedAt: mentor.updatedAt
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      filters: {
        availableExpertise,
        priceRange: priceRange[0] || { min: 0, max: 1000 },
        availableLanguages
      }
    };

    console.log(`✅ Found ${mentors.length} mentors out of ${total} total`);
    
    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ Error searching mentors:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search mentors'
    });
  }
};

// GET /api/v1/mentors/featured - Get featured mentors
export const getFeaturedMentors = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 6));
    
    console.log('⭐ Fetching featured mentors, limit:', limit);

    const mentors = await Mentor.find({
      isActive: true,
      isVerified: true,
      rating: { $gte: 4.5 }
    })
    .populate('userId', 'name email avatar')
    .sort({ 
      rating: -1, 
      totalReviews: -1, 
      totalStudents: -1 
    })
    .limit(limit)
    .lean();

    const formattedMentors = mentors.map((mentor: any) => ({
      _id: mentor._id,
      userId: mentor.userId,
      displayName: mentor.displayName,
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      profileImage: mentor.profileImage,
      expertise: mentor.expertise,
      experience: mentor.experience,
      pricing: mentor.pricing,
      rating: mentor.rating,
      totalSessions: mentor.totalSessions,
      totalStudents: mentor.totalStudents,
      isOnline: mentor.isOnline,
      isVerified: mentor.isVerified,
      specialties: mentor.specialties
    }));

    console.log(`✅ Returning ${formattedMentors.length} featured mentors`);

    return res.json({
      success: true,
      data: formattedMentors
    });

  } catch (error: any) {
    console.error('❌ Error fetching featured mentors:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch featured mentors'
    });
  }
};

// GET /api/v1/mentors/trending-expertise - Get trending expertise areas
export const getTrendingExpertise = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));
    
    console.log('📈 Fetching trending expertise, limit:', limit);

    // Get expertise areas with most active mentors and recent sessions
    const trendingExpertise = await Mentor.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$expertise' },
      {
        $group: {
          _id: '$expertise',
          mentorCount: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalSessions: { $sum: '$totalSessions' }
        }
      },
      {
        $match: {
          mentorCount: { $gte: 2 }, // At least 2 mentors
          avgRating: { $gte: 4.0 }   // Good average rating
        }
      },
      {
        $sort: {
          totalSessions: -1,
          mentorCount: -1,
          avgRating: -1
        }
      },
      { $limit: limit },
      { $project: { _id: 1 } }
    ]);

    const subjects = trendingExpertise.map((item: { _id: string }) => item._id);

    console.log(`✅ Returning ${subjects.length} trending expertise areas`);

    return res.json({
      success: true,
      data: subjects
    });

  } catch (error: any) {
    console.error('❌ Error fetching trending expertise:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch trending expertise'
    });
  }
};

// GET /api/v1/mentors/expertise - Get all available expertise areas
export const getAllExpertise = async (req: Request, res: Response) => {
  try {
    console.log('📚 Fetching all expertise areas...');

    const expertise = await Mentor.distinct('expertise', { isActive: true });
    
    // Sort alphabetically
    expertise.sort((a, b) => a.localeCompare(b));

    console.log(`✅ Returning ${expertise.length} expertise areas`);

    return res.json({
      success: true,
      data: expertise
    });

  } catch (error: any) {
    console.error('❌ Error fetching expertise areas:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expertise areas'
    });
  }
};

// GET /api/v1/mentors/:mentorId - Get mentor by ID
export const getMentorById = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    
    console.log('👤 Fetching mentor by ID:', mentorId);

    // Validate mentor ID format
    if (!ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format'
      });
    }

    const mentor = await Mentor.findById(mentorId)
      .populate('userId', 'name email avatar')
      .lean();

    if (!mentor || !mentor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Get recent reviews
    const reviews = await Review.find({ mentorId: new ObjectId(mentorId) })
      .populate('studentId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const mentorData = {
      ...mentor,
      reviews: reviews.map((review: any) => ({
        studentId: review.studentId,
        studentName: (review.studentId as any)?.name || 'Anonymous',
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }))
    };

    console.log('✅ Mentor fetched successfully:', mentor.displayName);

    return res.json({
      success: true,
      data: mentorData
    });

  } catch (error: any) {
    console.error('❌ Error fetching mentor:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch mentor'
    });
  }
};

// GET /api/v1/mentors/:mentorId/availability - Get mentor availability
export const getMentorAvailability = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query;
    
    console.log('📅 Fetching mentor availability:', { mentorId, date });

    // Validate mentor ID format
    if (!ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format'
      });
    }

    const mentor = await Mentor.findById(mentorId);
    if (!mentor || !mentor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Get mentor's schedule
    const schedule = mentor.availability?.schedule || [];
    
    // If specific date requested, filter for that day
    let availableSlots = schedule;
    if (date && typeof date === 'string') {
      const targetDate = new Date(date);
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      availableSlots = schedule.filter((slot: { day: string }) => slot.day.toLowerCase() === dayName);
    }

    // Get existing sessions for the date to exclude booked slots
    let bookedSessions: any[] = [];
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);

      bookedSessions = await Session.find({
        mentorId: new ObjectId(mentorId),
        scheduledTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
      }).lean();
    }

    const availability = {
      mentorId,
      timezone: mentor.availability?.timezone || 'UTC',
      isOnline: mentor.isOnline,
      status: mentor.status,
      schedule: availableSlots,
      bookedSlots: bookedSessions.map(session => ({
        start: session.scheduledTime,
        end: new Date(session.scheduledTime.getTime() + session.duration * 60000),
        sessionId: session._id
      })),
      available: mentor.isOnline && mentor.status === 'active' && availableSlots.length > 0
    };

    console.log('✅ Mentor availability fetched successfully');

    return res.json({
      success: true,
      data: availability
    });

  } catch (error: any) {
    console.error('❌ Error fetching mentor availability:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch mentor availability'
    });
  }
};

// GET /api/v1/mentors/:mentorId/reviews - Get mentor reviews
export const getMentorReviews = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    console.log('⭐ Fetching mentor reviews:', { mentorId, page, limit });

    // Validate mentor ID format
    if (!ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format'
      });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ mentorId: new ObjectId(mentorId) })
        .populate('studentId', 'name avatar')
        .populate('sessionId', 'subject scheduledTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ mentorId: new ObjectId(mentorId) })
    ]);

    const formattedReviews = reviews.map((review: any) => ({
      _id: review._id,
      studentName: (review.studentId as any)?.name || 'Anonymous',
      studentAvatar: (review.studentId as any)?.avatar,
      rating: review.rating,
      comment: review.comment,
      subject: (review.sessionId as any)?.subject,
      sessionDate: (review.sessionId as any)?.scheduledTime,
      createdAt: review.createdAt
    }));

    const result = {
      reviews: formattedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    console.log(`✅ Returning ${reviews.length} reviews out of ${total} total`);

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ Error fetching mentor reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch mentor reviews'
    });
  }
};

// POST /api/v1/mentors/activity - Track mentor activity (for real-time updates)
export const trackMentorActivity = async (req: Request, res: Response) => {
  try {
    const { mentorIds } = req.body;
    
    console.log('🔄 Tracking mentor activity for IDs:', mentorIds);

    if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor IDs array'
      });
    }

    // Validate all mentor IDs
    const validMentorIds = mentorIds.filter(id => ObjectId.isValid(id));

    const mentors = await Mentor.find({
      _id: { $in: validMentorIds.map(id => new ObjectId(id)) },
      isActive: true
    })
    .select('_id isOnline lastSeen status')
    .lean();

    const activityMap: { [key: string]: boolean } = {};
    
    mentors.forEach((mentor: any) => {
      // Consider mentor online if they're marked online and last seen within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isRecentlyActive = mentor.lastSeen && new Date(mentor.lastSeen) > fiveMinutesAgo;
      
      activityMap[mentor._id.toString()] = mentor.isOnline && isRecentlyActive;
    });

    // Fill in false for any mentors not found
    validMentorIds.forEach(id => {
      if (!(id in activityMap)) {
        activityMap[id] = false;
      }
    });

    console.log('✅ Mentor activity tracking completed');

    return res.json({
      success: true,
      data: activityMap
    });

  } catch (error: any) {
    console.error('❌ Error tracking mentor activity:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to track mentor activity'
    });
  }
};

// PUT /api/v1/mentors/:mentorId/status - Update mentor online status (for mentors)
export const updateMentorStatus = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    const { isOnline, status } = req.body;
    const user = (req as any).user as IUser;
    const userId = req.user!._id;

    console.log('🔄 Updating mentor status:', { mentorId, isOnline, status, userId });

    // Validate mentor ID format
    if (!ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format'
      });
    }

    // Find mentor and verify ownership
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Check if user owns this mentor profile
    if (mentor.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this mentor profile'
      });
    }

    // Update status
    const updateData: any = { lastSeen: new Date() };
    
    if (typeof isOnline === 'boolean') {
      updateData.isOnline = isOnline;
    }
    
    if (status && ['active', 'inactive', 'busy', 'away'].includes(status)) {
      updateData.status = status;
    }

    await Mentor.findByIdAndUpdate(mentorId, updateData);

    console.log('✅ Mentor status updated successfully');

    return res.json({
      success: true,
      message: 'Mentor status updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating mentor status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update mentor status'
    });
  }
};

// GET /api/v1/mentors/stats/overview - Get mentor platform statistics
export const getMentorStats = async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching mentor platform statistics...');

    const [
      totalMentors,
      activeMentors,
      onlineMentors,
      verifiedMentors,
      totalSessions,
      avgRating
    ] = await Promise.all([
      Mentor.countDocuments({ isActive: true }),
      Mentor.countDocuments({ isActive: true, status: 'active' }),
      Mentor.countDocuments({ isActive: true, isOnline: true }),
      Mentor.countDocuments({ isActive: true, isVerified: true }),
      Session.countDocuments({ status: 'completed' }),
      Mentor.aggregate([
        { $match: { isActive: true, rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    const stats = {
      totalMentors,
      activeMentors,
      onlineMentors,
      verifiedMentors,
      totalSessions,
      averageRating: avgRating[0]?.avgRating || 0,
      platformHealth: {
        mentorAvailability: onlineMentors / Math.max(activeMentors, 1) * 100,
        verificationRate: verifiedMentors / Math.max(totalMentors, 1) * 100
      }
    };

    console.log('✅ Platform statistics fetched successfully');

    return res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching mentor statistics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch mentor statistics'
    });
  }
};

// Route definitions
router.get('/search', searchMentors);
router.get('/featured', getFeaturedMentors);
router.get('/trending-expertise', getTrendingExpertise);
router.get('/expertise', getAllExpertise);
router.get('/stats/overview', getMentorStats);
router.get('/:mentorId', getMentorById);
router.get('/:mentorId/availability', getMentorAvailability);
router.get('/:mentorId/reviews', getMentorReviews);
router.post('/activity', withAuth.authenticate, trackMentorActivity);
router.put('/:mentorId/status', withAuth.authenticate, updateMentorStatus);

export default router;