import { Router, Request, Response } from 'express';
import withAuth from '../middleware/auth.middleware.js';
import { IUser, UserRole } from '../models/User.model.js'
import User from '../models/User.model.js';
import { ObjectId } from 'mongodb';
import mongoose, { PipelineStage } from 'mongoose';

const router = Router();

// GET /api/v1/mentors/search - Search mentors with filters
export const searchMentors = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Searching mentors with query:', req.query);

    const {
      expertise,
      subjects,
      minPrice,
      maxPrice,
      minRating,
      minExperience,
      languages,
      location,
      isOnline,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      search
    } = req.query;

    const pipeline: any[] = [
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true
        }
      },
      
      {
        $lookup: {
          from: 'mentorProfiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      
      {
        $match: {
          'mentorProfile.0': { $exists: true }
        }
      },
      
      {
        $unwind: '$mentorProfile'
      }
    ];

    const matchConditions: any = {};

    if (expertise && typeof expertise === 'string') {
      const expertiseArray = expertise.split(',').map(e => e.trim());
      matchConditions['mentorProfile.expertise'] = { $in: expertiseArray };
    }

    if (subjects && typeof subjects === 'string') {
      const subjectsArray = subjects.split(',').map(s => s.trim());
      matchConditions.$or = [
        { 'mentorProfile.subjects': { $in: subjectsArray } },
        { 'mentorProfile.subjects.name': { $in: subjectsArray } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      matchConditions['mentorProfile.pricing.hourlyRate'] = {};
      if (minPrice) matchConditions['mentorProfile.pricing.hourlyRate'].$gte = parseFloat(minPrice as string);
      if (maxPrice) matchConditions['mentorProfile.pricing.hourlyRate'].$lte = parseFloat(maxPrice as string);
    }

    // Languages filter
    if (languages && typeof languages === 'string') {
      const languageArray = languages.split(',').map(l => l.trim());
      matchConditions['mentorProfile.languages'] = { $in: languageArray };
    }

    // Location filter
    if (location && typeof location === 'string') {
      matchConditions['mentorProfile.location'] = { $regex: location, $options: 'i' };
    }

    // Text search
    if (search && typeof search === 'string') {
      matchConditions.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'mentorProfile.displayName': { $regex: search, $options: 'i' } },
        { 'mentorProfile.bio': { $regex: search, $options: 'i' } },
        { 'mentorProfile.expertise': { $regex: search, $options: 'i' } }
      ];
    }

    // Add match conditions to pipeline ONLY if there are filters
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add project stage to format the response
    pipeline.push({
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        isActive: 1,
        createdAt: 1,
        mentorProfile: {
          _id: '$mentorProfile._id',
          firstName: '$mentorProfile.firstName',
          lastName: '$mentorProfile.lastName',
          displayName: '$mentorProfile.displayName',
          bio: '$mentorProfile.bio',
          location: '$mentorProfile.location',
          timezone: '$mentorProfile.timezone',
          languages: '$mentorProfile.languages',
          expertise: '$mentorProfile.expertise',
          subjects: '$mentorProfile.subjects',
          teachingStyles: '$mentorProfile.teachingStyles',
          specializations: '$mentorProfile.specializations',
          pricing: '$mentorProfile.pricing',
          weeklySchedule: '$mentorProfile.weeklySchedule',
          isProfileComplete: '$mentorProfile.isProfileComplete',
          profileStep: '$mentorProfile.profileStep',
          socialLinks: '$mentorProfile.socialLinks',
          achievements: '$mentorProfile.achievements',
          preferences: '$mentorProfile.preferences',
          // Default values for missing fields
          rating: { $ifNull: ['$mentorProfile.rating', 4.5] },
          totalSessions: { $ifNull: ['$mentorProfile.totalSessions', 0] },
          totalStudents: { $ifNull: ['$mentorProfile.totalStudents', 0] },
          isOnline: { $ifNull: ['$mentorProfile.isOnline', false] },
          isVerified: { $ifNull: ['$mentorProfile.isVerified', false] }
        }
      }
    });

    // Add sorting
    const sortField: any = {};
    switch (sortBy) {
      case 'rating':
        sortField['mentorProfile.rating'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'price':
        sortField['mentorProfile.pricing.hourlyRate'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'experience':
        sortField['mentorProfile.totalSessions'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'popularity':
        sortField['mentorProfile.totalStudents'] = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortField['mentorProfile.rating'] = -1;
    }
    pipeline.push({ $sort: sortField });

    // Add pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Count total documents
    const countPipeline = [...pipeline, { $count: "total" }];
    
    // Add pagination to main pipeline
    pipeline.push({ $skip: skip }, { $limit: limitNum });

    // Execute both queries
    const [mentorsResult, countResult] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    // Format the response to match frontend expectations
    const mentors = mentorsResult.map((mentor: any) => ({
      _id: mentor._id,
      userId: mentor._id,
      displayName: mentor.mentorProfile.displayName || `${mentor.firstName} ${mentor.lastName}`,
      firstName: mentor.mentorProfile.firstName || mentor.firstName,
      lastName: mentor.mentorProfile.lastName || mentor.lastName,
      email: mentor.email,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.mentorProfile.displayName || mentor.firstName)}&background=8B4513&color=fff&size=200`,
      bio: mentor.mentorProfile.bio,
      expertise: mentor.mentorProfile.expertise || [],
      subjects: mentor.mentorProfile.subjects?.map((s: any) => typeof s === 'string' ? s : s.name) || [],
      location: mentor.mentorProfile.location,
      timezone: mentor.mentorProfile.timezone,
      languages: mentor.mentorProfile.languages || [],
      pricing: mentor.mentorProfile.pricing || { hourlyRate: 50, currency: 'USD' },
      rating: mentor.mentorProfile.rating || 4.5,
      totalSessions: mentor.mentorProfile.totalSessions || 0,
      totalStudents: mentor.mentorProfile.totalStudents || 0,
      isOnline: mentor.mentorProfile.isOnline || false,
      isVerified: mentor.mentorProfile.isVerified || false,
      teachingStyles: mentor.mentorProfile.teachingStyles || [],
      specializations: mentor.mentorProfile.specializations || [],
      weeklySchedule: mentor.mentorProfile.weeklySchedule,
      socialLinks: mentor.mentorProfile.socialLinks || {},
      achievements: mentor.mentorProfile.achievements,
      preferences: mentor.mentorProfile.preferences,
      createdAt: mentor.createdAt,
      updatedAt: mentor.mentorProfile.updatedAt
    }));

    // Get filter options
    const filterOptions = await getFilterOptions();

    const result = {
      mentors,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      filters: filterOptions
    };

    
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

    const pipeline: PipelineStage[] = [
      // Match mentor users
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true,
        }
      },
      
      {
        $lookup: {
          from: 'mentorProfiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      
      // Filter for complete profiles
      {
        $match: {
          'mentorProfile.0': { $exists: true },
        }
      },
      
      { $unwind: { path: '$mentorProfile' } },
      
      // Project required fields
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          mentorProfile: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            displayName: 1,
            bio: 1,
            expertise: 1,
            subjects: 1,
            pricing: 1,
            location: 1,
            timezone: 1,
            languages: 1,
            teachingStyles: 1,
            specializations: 1,
            socialLinks: 1,
            achievements: 1,
            preferences: 1,
            weeklySchedule: 1,
            rating: { $ifNull: ['$rating', 4.5] },
            totalSessions: { $ifNull: ['$totalSessions', 0] },
            totalStudents: { $ifNull: ['$totalStudents', 0] },
            isOnline: { $ifNull: ['$isOnline', false] },
            isVerified: { $ifNull: ['$isVerified', true] }
          }
        }
      },
      
      // Sort by rating and sessions
      {
        $sort: {
          createdAt: -1
        }
      },
      
      { $limit: limit }
    ];

    const mentorsResult = await User.aggregate(pipeline);

    const formattedMentors = mentorsResult.map((mentor: any) => ({
      _id: mentor._id,
      userId: mentor._id,
      displayName: mentor.mentorProfile.displayName || `${mentor.firstName} ${mentor.lastName}`,
      firstName: mentor.mentorProfile.firstName || mentor.firstName,
      lastName: mentor.mentorProfile.lastName || mentor.lastName,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.mentorProfile.displayName || mentor.firstName)}&background=8B4513&color=fff&size=200`,
      expertise: mentor.mentorProfile.expertise || [],
      subjects: mentor.mentorProfile.subjects?.map((s: any) => typeof s === 'string' ? s : s.name) || [],
      pricing: mentor.mentorProfile.pricing || { hourlyRate: 50, currency: 'USD' },
      rating: mentor.mentorProfile.rating || 4.5,
      totalSessions: mentor.mentorProfile.totalSessions || 0,
      totalStudents: mentor.mentorProfile.totalStudents || 0,
      isOnline: mentor.mentorProfile.isOnline || false,
      isVerified: mentor.mentorProfile.isVerified || true,
      location: mentor.mentorProfile.location,
      timezone: mentor.mentorProfile.timezone,
      languages: mentor.mentorProfile.languages || [],
      teachingStyles: mentor.mentorProfile.teachingStyles || [],
      specializations: mentor.mentorProfile.specializations || [],
      socialLinks: mentor.mentorProfile.socialLinks || {},
      bio: mentor.mentorProfile.bio,
      achievements: mentor.mentorProfile.achievements,
      preferences: mentor.mentorProfile.preferences,
      weeklySchedule: mentor.mentorProfile.weeklySchedule
    }));


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

    const pipeline: PipelineStage[] = [
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true,
        }
      },
      {
        $lookup: {
          from: 'mentorProfiles', // FIXED: Capital P
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      {
        $match: {
          'mentorProfile.0': { $exists: true },
          'mentorProfile.isProfileComplete': true
        }
      },
      { $unwind: { path: '$mentorProfile' } },
      { $unwind: { path: '$mentorProfile.expertise' } },
      {
        $group: {
          _id: '$mentorProfile.expertise',
          mentorCount: { $sum: 1 },
          avgRating: { $avg: { $ifNull: ['$mentorProfile.rating', 4.5] } }
        }
      },
      {
        $match: {
          mentorCount: { $gte: 1 }
        }
      },
      {
        $sort: {
          mentorCount: -1,
          avgRating: -1
        }
      },
      { $limit: limit },
      { $project: { _id: 1 } }
    ];

    const trendingExpertise = await User.aggregate(pipeline);
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

    const mentorResult = await User.aggregate([
      {
        $match: {
          _id: new ObjectId(mentorId),
          role: UserRole.MENTOR,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'mentorProfiles', // FIXED: Capital P
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      {
        $match: {
          'mentorProfile.0': { $exists: true }
        }
      },
      { $unwind: '$mentorProfile' },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          createdAt: 1,
          mentorProfile: 1
        }
      }
    ]);

    if (!mentorResult.length) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    const mentor = mentorResult[0];
    
    const mentorData = {
      _id: mentor._id,
      userId: mentor._id,
      firstName: mentor.mentorProfile.firstName || mentor.firstName,
      lastName: mentor.mentorProfile.lastName || mentor.lastName,
      email: mentor.email,
      displayName: mentor.mentorProfile.displayName,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.mentorProfile.displayName || mentor.firstName)}&background=8B4513&color=fff&size=200`,
      bio: mentor.mentorProfile.bio,
      location: mentor.mentorProfile.location,
      timezone: mentor.mentorProfile.timezone,
      languages: mentor.mentorProfile.languages || [],
      expertise: mentor.mentorProfile.expertise || [],
      subjects: mentor.mentorProfile.subjects?.map((s: any) => typeof s === 'string' ? s : s.name) || [],
      teachingStyles: mentor.mentorProfile.teachingStyles || [],
      specializations: mentor.mentorProfile.specializations || [],
      pricing: mentor.mentorProfile.pricing || { hourlyRate: 50, currency: 'USD' },
      weeklySchedule: mentor.mentorProfile.weeklySchedule || {},
      rating: mentor.mentorProfile.rating || 4.5,
      totalSessions: mentor.mentorProfile.totalSessions || 0,
      totalStudents: mentor.mentorProfile.totalStudents || 0,
      totalReviews: mentor.mentorProfile.totalReviews || 0,
      isOnline: mentor.mentorProfile.isOnline || false,
      isVerified: mentor.mentorProfile.isVerified || false,
      lastSeen: mentor.mentorProfile.lastSeen,
      responseTime: mentor.mentorProfile.responseTime || 60,
      socialLinks: mentor.mentorProfile.socialLinks || {},
      achievements: mentor.mentorProfile.achievements,
      preferences: mentor.mentorProfile.preferences,
      createdAt: mentor.createdAt,
      updatedAt: mentor.mentorProfile.updatedAt
    };

    console.log('✅ Mentor fetched successfully:', mentorData.displayName);

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

// GET /api/v1/mentors/expertise - Get all available expertise areas
export const getAllExpertise = async (req: Request, res: Response) => {
  try {
    console.log('📚 Fetching all expertise areas...');

    const expertise = await User.aggregate([
      { $match: { role: UserRole.MENTOR, isActive: true } },
      {
        $lookup: {
          from: 'mentorProfiles', // FIXED: Capital P
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      { $match: { 'mentorProfile.0': { $exists: true } } },
      { $unwind: '$mentorProfile' },
      { $unwind: '$mentorProfile.expertise' },
      { $group: { _id: '$mentorProfile.expertise' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 1 } }
    ]);
    
    const expertiseList = expertise.map((item: any) => item._id);

    console.log(`✅ Returning ${expertiseList.length} expertise areas`);

    return res.json({
      success: true,
      data: expertiseList
    });

  } catch (error: any) {
    console.error('❌ Error fetching expertise areas:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expertise areas'
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
      avgRating
    ] = await Promise.all([
      // Total mentors with complete profiles
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles', // FIXED: Capital P
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        {
          $match: {
            'mentorProfile.0': { $exists: true },
            'mentorProfile.isProfileComplete': true
          }
        },
        { $count: "total" }
      ]),
      
      // Active mentors (those who submitted applications)
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles', 
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        {
          $match: {
            'mentorProfile.0': { $exists: true },
            'mentorProfile.applicationSubmitted': true
          }
        },
        { $count: "total" }
      ]),
      
      // Online mentors
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        {
          $match: {
            'mentorProfile.0': { $exists: true },
            'mentorProfile.isOnline': true
          }
        },
        { $count: "total" }
      ]),
      
      // Verified mentors
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        {
          $match: {
            'mentorProfile.0': { $exists: true },
            'mentorProfile.isVerified': true
          }
        },
        { $count: "total" }
      ]),
      
      // Average rating
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles', 
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        { $match: { 'mentorProfile.0': { $exists: true } } },
        { $unwind: '$mentorProfile' },
        {
          $group: {
            _id: null,
            avgRating: { $avg: { $ifNull: ['$mentorProfile.rating', 4.5] } }
          }
        }
      ])
    ]);

    const stats = {
      totalMentors: totalMentors[0]?.total || 0,
      activeMentors: activeMentors[0]?.total || 0,
      onlineMentors: onlineMentors[0]?.total || 0,
      verifiedMentors: verifiedMentors[0]?.total || 0,
      averageRating: avgRating[0]?.avgRating || 4.5,
      platformHealth: {
        mentorAvailability: onlineMentors[0]?.total > 0 ? 
          (onlineMentors[0].total / Math.max(activeMentors[0]?.total || 1, 1)) * 100 : 0,
        verificationRate: verifiedMentors[0]?.total > 0 ? 
          (verifiedMentors[0].total / Math.max(totalMentors[0]?.total || 1, 1)) * 100 : 0
      }
    };


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

export const debugMentorData = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Debug: Checking mentor data...');

    // Check Users collection
    const mentorUsers = await User.find({ role: UserRole.MENTOR }).limit(5);
    console.log('👥 Mentor users found:', mentorUsers.length);

    // Check MentorProfiles collection directly
    let mentorProfilesCount = 0;
    let sampleProfile = null;
    if (mongoose.connection.db) {
      mentorProfilesCount = await mongoose.connection.db.collection('mentorProfiles').countDocuments();
      sampleProfile = await mongoose.connection.db.collection('mentorProfiles').findOne();
    }
    console.log('📋 MentorProfiles count:', mentorProfilesCount);
    console.log('📄 Sample profile:', sampleProfile);

    // Test aggregation step by step
    const step1 = await User.aggregate([
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true
        }
      }
    ]);
    console.log('🔸 Step 1 - Mentor users:', step1.length);

    const step2 = await User.aggregate([
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'mentorProfiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      }
    ]);
    console.log('🔸 Step 2 - After lookup:', step2.length);

    const step3 = await User.aggregate([
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'mentorProfiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      {
        $match: {
          'mentorProfile.0': { $exists: true }
        }
      }
    ]);
    console.log('🔸 Step 3 - With profile exists:', step3.length);

    // Check if the issue is with the profile completion filters
    const step4 = await User.aggregate([
      {
        $match: {
          role: UserRole.MENTOR,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'mentorProfiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'mentorProfile'
        }
      },
      {
        $match: {
          'mentorProfile.0': { $exists: true }
        }
      }
    ]);
    console.log('🔸 Step 4 - Final result:', step4.length);

    // Return debug info
    return res.json({
      success: true,
      debug: {
        mentorUsersCount: mentorUsers.length,
        mentorProfilesCount,
        sampleMentorUser: mentorUsers[0] || null,
        sampleMentorProfile: sampleProfile,
        aggregationSteps: {
          step1: step1.length,
          step2: step2.length,
          step3: step3.length,
          step4: step4.length
        },
        firstMatchedUser: step4[0] || null
      }
    });

  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

// Helper function to get filter options
async function getFilterOptions() {
  try {
    const [expertiseResult, subjectsResult, languagesResult, priceResult] = await Promise.all([
      // Get all expertise
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles', 
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        { $match: { 'mentorProfile.0': { $exists: true } } },
        { $unwind: '$mentorProfile' },
        { $unwind: '$mentorProfile.expertise' },
        { $group: { _id: '$mentorProfile.expertise' } },
        { $sort: { _id: 1 } }
      ]),
      
      // Get all subjects
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        { $match: { 'mentorProfile.0': { $exists: true } } },
        { $unwind: '$mentorProfile' },
        { $unwind: '$mentorProfile.subjects' },
        { 
          $project: { 
            subject: { 
              $cond: { 
                if: { $type: "$mentorProfile.subjects" }, 
                then: "$mentorProfile.subjects.name", 
                else: "$mentorProfile.subjects" 
              } 
            } 
          } 
        },
        { $group: { _id: '$subject' } },
        { $sort: { _id: 1 } }
      ]),
      
      // Get all languages
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles', 
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        { $match: { 'mentorProfile.0': { $exists: true } } },
        { $unwind: '$mentorProfile' },
        { $unwind: '$mentorProfile.languages' },
        { $group: { _id: '$mentorProfile.languages' } },
        { $sort: { _id: 1 } }
      ]),
      
      // Get price range
      User.aggregate([
        { $match: { role: UserRole.MENTOR, isActive: true } },
        {
          $lookup: {
            from: 'mentorProfiles', 
            localField: '_id',
            foreignField: 'userId',
            as: 'mentorProfile'
          }
        },
        { $match: { 'mentorProfile.0': { $exists: true } } },
        { $unwind: '$mentorProfile' },
        {
          $group: {
            _id: null,
            min: { $min: '$mentorProfile.pricing.hourlyRate' },
            max: { $max: '$mentorProfile.pricing.hourlyRate' }
          }
        }
      ])
    ]);

    return {
      availableExpertise: expertiseResult.map((item: any) => item._id),
      availableSubjects: subjectsResult.map((item: any) => item._id),
      availableLanguages: languagesResult.map((item: any) => item._id),
      priceRange: priceResult[0] || { min: 10, max: 200 }
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      availableExpertise: [],
      availableSubjects: [],
      availableLanguages: [],
      priceRange: { min: 10, max: 200 }
    };
  }
}

// Route definitions
router.get('/debug', debugMentorData);
router.get('/search', searchMentors);
router.get('/featured', getFeaturedMentors);
router.get('/trending-expertise', getTrendingExpertise);
router.get('/expertise', getAllExpertise);
router.get('/stats/overview', getMentorStats);
router.get('/:mentorId', getMentorById);

export default router;