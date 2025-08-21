// backend/src/routes/booking.routes.ts - Updated for Manual Booking Flow
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateSchema } from '../validations/auth.validation';
import bookingController from '../controllers/booking.controller';
import MentorProfileService from '../services/mentorProfile.service';
import ScheduleGenerationService from '../services/scheduleGeneration.service';
import { z } from 'zod';
import notificationsService from 'services/notifications.service';
import { Session } from 'models';
import { paymentService } from 'services/booking.service';

const router = Router();

// Debug endpoint to check mentor's manual schedule
router.get('/debug/mentor/:mentorId/schedule', async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    console.log('🔍 Debug: Checking mentor schedule for:', mentorId);
    
    if (!mentorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.json({
        success: false,
        error: 'Invalid ObjectId format',
        mentorId,
        format: 'Expected 24 character hex string'
      });
    }
    
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    
    if (!mentorProfile) {
      return res.json({
        success: false,
        error: 'Mentor profile not found',
        mentorId,
        suggestion: 'Check if mentor has completed profile setup'
      });
    }

    return res.json({
      success: true,
      mentor: {
        _id: mentorProfile._id,
        userId: mentorProfile.userId,
        displayName: mentorProfile.displayName,
        hourlyRateINR: mentorProfile.hourlyRateINR,
        sessionDurations: mentorProfile.sessionDurations || [60],
        scheduleType: mentorProfile.scheduleType || 'manual',
        weeklySchedule: mentorProfile.weeklySchedule || {}
      },
      scheduleAnalysis: {
        hasSchedule: !!mentorProfile.weeklySchedule,
        availableDays: mentorProfile.weeklySchedule ? 
          Object.keys(mentorProfile.weeklySchedule).filter(day => 
            mentorProfile.weeklySchedule[day]?.isAvailable
          ) : [],
        totalTimeSlots: mentorProfile.weeklySchedule ? 
          Object.values(mentorProfile.weeklySchedule).reduce((total: number, day: any) => 
            total + (day?.timeSlots?.length || 0), 0
          ) : 0
      }
    });
    
  } catch (error: any) {
    return res.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Debug endpoint to test availability generation
router.get('/debug/mentor/:mentorId/availability/:date', async (req, res) => {
  try {
    const { mentorId, date } = req.params;
    
    console.log('🔍 Debug: Testing availability generation for:', { mentorId, date });
    
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    
    if (!mentorProfile) {
      return res.json({
        success: false,
        error: 'Mentor profile not found'
      });
    }

    if (!mentorProfile.weeklySchedule) {
      return res.json({
        success: false,
        error: 'Mentor has no schedule configured',
        mentorProfile: {
          displayName: mentorProfile.displayName,
          hasSchedule: false
        }
      });
    }

    const availableSlots = await ScheduleGenerationService.generateAvailableSlots(mentorId, date);
    
    return res.json({
      success: true,
      mentor: {
        displayName: mentorProfile.displayName,
        hourlyRateINR: mentorProfile.hourlyRateINR,
        sessionDurations: mentorProfile.sessionDurations
      },
      date,
      weeklySchedule: mentorProfile.weeklySchedule,
      generatedSlots: availableSlots,
      summary: {
        totalSlots: availableSlots.length,
        availableSlots: availableSlots.filter(slot => slot.isAvailable).length
      }
    });
    
  } catch (error: any) {
    return res.json({
      success: false,
      error: error.message
    });
  }
});

// Apply authentication to all routes below
router.use(authenticate);

// Validation schemas
const availableSlotsSchema = z.object({
  body: z.object({
    mentorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  }),
});

const createBookingSchema = z.object({
  body: z.object({
    mentorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID'),
    timeSlot: z.object({
      id: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      date: z.string(),
      price: z.number().positive(),
      duration: z.number().positive(),
      sessionType: z.enum(['video']),
      slotId: z.string(), // Reference to mentor's schedule slot ID
    }),
    sessionType: z.enum(['video']),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject too long'),
    notes: z.string().max(1000, 'Notes too long').optional(),
    paymentMethodId: z.string().min(1, 'Payment method is required'),
  }),
});

const cancelBookingSchema = z.object({
  body: z.object({
    reason: z.string().max(500, 'Reason too long').optional(),
  }),
});

const userBookingsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['upcoming', 'completed', 'cancelled', 'pending', 'confirmed']).optional(),
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  }),
});

// Main booking endpoints
router.post(
  '/available-slots',
  validateSchema(availableSlotsSchema),
  bookingController.getAvailableSlots
);

router.post(
  '/create',
  validateSchema(createBookingSchema),
  bookingController.createBooking
);

router.get(
  '/user-bookings',
  validateSchema(userBookingsQuerySchema),
  bookingController.getUserBookings
);

router.get(
  '/:bookingId',
  (req, res, next) => {
    const bookingId = req.params.bookingId;
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
      });
    }
    return next();
  },
  bookingController.getBookingDetails
);

router.put(
  '/:bookingId/cancel',
  validateSchema(cancelBookingSchema),
  bookingController.cancelBooking
);

// Mentor-specific endpoints for session management
router.get('/mentor/pending-sessions', async (req, res) => {
  try {
    const mentorId = req.userId;
    
    return bookingController.getUserBookings(
      {
        ...req,
        query: {
          status: 'pending',
          mentorId // Filter by mentor
        }
      } as any,
      res,
      (() => {}) 
    );
    
  } catch (error: any) {
    console.error('❌ Error fetching pending sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Accept session and provide meeting link
router.put('/:sessionId/accept', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { meetingUrl, meetingProvider = 'other' } = req.body;
    const mentorId = req.userId;
    
    if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }
    
    if (!meetingUrl || !meetingUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting URL is required',
      });
    }
    
    // Validate meeting URL format
    try {
      new URL(meetingUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting URL format',
      });
    }
    
    const { Session } = await import('../models/Session.model');
    const notificationService = notificationsService;
    
    // Find and update session
    const session = await Session.findById(sessionId)
      .populate('studentId', 'firstName lastName email')
      .populate('mentorId', 'firstName lastName email');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    // Verify mentor owns this session
    if (session.mentorId._id.toString() !== mentorId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this session',
      });
    }
    
    // Check if session is in correct status
    if (session.status !== 'pending_mentor_acceptance') {
      return res.status(400).json({
        success: false,
        message: 'Session is not pending acceptance',
        currentStatus: session.status,
      });
    }
    
    // Check if session hasn't passed auto-decline time
    if (new Date() > session.autoDeclineAt) {
      return res.status(400).json({
        success: false,
        message: 'Session acceptance deadline has passed',
      });
    }
    
    // Update session
    session.status = 'confirmed';
    session.meetingUrl = meetingUrl.trim();
    session.meetingProvider = meetingProvider;
    session.mentorAcceptedAt = new Date();
    
    await session.save();
    
    // Send confirmation emails
    try {
      await notificationService.sendSessionAcceptanceNotification({
        sessionId: session._id.toString(),
        mentorId: (session.mentorId as any)._id.toString(),
        studentId: (session.studentId as any)._id.toString(),
        mentorEmail: (session.mentorId as any).email,
        studentEmail: (session.studentId as any).email,
        mentorName: `${(session.mentorId as any).firstName} ${(session.mentorId as any).lastName}`,
        studentName: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
        subject: session.subject,
        scheduledTime: session.scheduledTime.toISOString(),
        duration: session.duration,
        meetingLink: meetingUrl
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send acceptance emails:', emailError);
      // Don't fail the acceptance for email issues
    }
    
    return res.json({
      success: true,
      message: 'Session accepted successfully',
      data: {
        sessionId: session._id,
        status: session.status,
        meetingUrl: session.meetingUrl,
        acceptedAt: session.mentorAcceptedAt,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error accepting session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Decline session
router.put('/:sessionId/decline', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    const session = await Session.findById(sessionId)
      .populate('mentorId')
      .populate('studentId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Update session status
    session.status = 'cancelled';
    session.cancellationReason = reason || 'Declined by mentor';
    session.cancelledBy = 'mentor';
    session.cancelledAt = new Date();

    let refundProcessed = false;
    if (session.price > 0 && session.paymentId) {
      try {
        // Use the paymentService to call refundPayment
        const refundResult = await paymentService.refundPayment(session.paymentId, session.price);
        if (refundResult.success) {
          session.refundId = refundResult.paymentId;
          session.refundStatus = 'processed';
          session.paymentStatus = 'refunded';
          refundProcessed = true;
        }
      } catch (refundError) {
        console.error('⚠️ Refund failed:', refundError);
        session.refundStatus = 'failed';
      }
    }

    await session.save();

    // Send cancellation emails
    try {
      await notificationsService.sendCancellationNotification({
        sessionId: session._id.toString(),
        mentorEmail: (session.mentorId as any).email,
        studentEmail: (session.studentId as any).email,
        mentorName: `${(session.mentorId as any).firstName} ${(session.mentorId as any).lastName}`,
        studentName: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
        subject: session.subject,
        scheduledTime: session.scheduledTime.toISOString(),
        cancelledBy: 'mentor',
        reason: reason || 'Declined by mentor',
        refundAmount: session.price,
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send cancellation emails:', emailError);
    }

    return res.json({
      success: true,
      message: 'Session declined successfully',
      data: {
        sessionId: session._id,
        status: session.status,
        refundProcessed,
        refundAmount: session.price,
      },
    });

  } catch (error: any) {
    console.error('❌ Error declining session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to decline session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Payment validation endpoint
router.get('/payment/validate', async (req, res) => {
  try {
    const { paymentMethodId } = req.query;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required',
      });
    }

    // Mock payment validation - replace with real payment service
    const isValid = typeof paymentMethodId === 'string' && 
      paymentMethodId.startsWith('pm_') && 
      paymentMethodId.length > 10;
    
    return res.json({
      success: true,
      data: {
        valid: isValid,
        paymentMethodId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Payment validation failed',
      error: error.message,
    });
  }
});

// Rate a session
router.post('/:sessionId/rate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, review } = req.body;
    const userId = req.userId;
    
    if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const { Session } = await import('../models/Session.model');
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    const isStudent = session.studentId.toString() === userId;
    const isMentor = session.mentorId.toString() === userId;
    
    if (!isStudent && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to rate this session',
      });
    }
    
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate completed sessions',
      });
    }
    
    // Update rating
    if (isStudent) {
      session.studentRating = rating;
      session.studentReview = review || '';
    } else {
      session.mentorRating = rating;
      session.mentorReview = review || '';
    }
    
    await session.save();
    
    return res.json({
      success: true,
      message: 'Session rated successfully',
      data: {
        sessionId,
        rating,
        review: review || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to rate session',
      error: error.message,
    });
  }
});

// Join session endpoint (for tracking)
router.post('/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }

    // TODO: Implement session join tracking
    console.log(`📊 User joined session: ${sessionId}`);
    
    return res.json({
      success: true,
      message: 'Session join tracked',
      data: {
        sessionId,
        joinedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to track session join',
      error: error.message,
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Manual booking system operational',
    timestamp: new Date().toISOString(),
    features: {
      manualBooking: true,
      emailNotifications: true,
      paymentProcessing: true,
      autoDecline: true,
    },
  });
});

// Error handling middleware for booking routes
router.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Booking route error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors,
    });
  }
  
  if (error.message?.includes('payment')) {
    return res.status(503).json({
      success: false,
      message: 'Payment service temporarily unavailable',
      code: 'PAYMENT_UNAVAILABLE',
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

export default router;