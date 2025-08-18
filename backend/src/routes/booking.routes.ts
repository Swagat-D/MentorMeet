// backend/src/routes/booking.routes.ts - Updated Routes for Cal.com API v2 Integration
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateSchema } from '../validations/auth.validation';
import bookingController from '../controllers/booking.controller';
import calComService from '../services/calcom.service';
import MentorProfileService from '../services/mentorProfile.service';
import { z } from 'zod';

const router = Router();

// Debug endpoint to check Cal.com integration status (public access)
router.get('/debug/calcom-status', async (req, res) => {
  try {
    const healthCheck = await calComService.healthCheck();
    
    return res.json({
      success: true,
      calcom: {
        healthy: healthCheck.healthy,
        apiVersion: 'v2',
        details: healthCheck.details,
        suggestions: healthCheck.suggestions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.json({ 
      success: false, 
      error: typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to find mentors with Cal.com integration
router.get('/debug/mentors-with-calcom', async (req, res) => {
  try {
    const mentorsWithSchedule = await MentorProfileService.findMentorsWithSchedule();
    
    return res.json({
      success: true,
      mentors: mentorsWithSchedule.map(m => ({
        id: m.userId,
        profileId: m._id,
        name: m.displayName,
        calComUsername: m.calComUsername,
        calComVerified: m.calComVerified,
        eventTypesCount: m.calComEventTypes?.length || 0,
        hourlyRateINR: m.hourlyRateINR
      }))
    });
  } catch (error) {
    return res.json({ 
      success: false, 
      error: typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error) 
    });
  }
});

// Debug endpoint to check specific mentor's Cal.com integration
router.get('/debug/mentor/:mentorId/calcom', async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    console.log('🔍 Debug: Checking Cal.com integration for mentor:', mentorId);
    
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

    type EventType = {
      id: number;
      title: string;
      length: number;
      [key: string]: any;
    };
    let eventTypes: EventType[] = [];
    let calcomHealthy = false;
    let calcomError = null;

    if (mentorProfile.calComUsername && mentorProfile.calComVerified) {
      try {
        eventTypes = await calComService.getMentorEventTypes(mentorProfile.calComUsername);
        calcomHealthy = true;
      } catch (error: any) {
        calcomError = error.message;
      }
    }
    
    return res.json({
      success: true,
      mentor: {
        _id: mentorProfile._id,
        userId: mentorProfile.userId,
        displayName: mentorProfile.displayName,
        calComUsername: mentorProfile.calComUsername,
        calComVerified: mentorProfile.calComVerified,
        hourlyRateINR: mentorProfile.hourlyRateINR,
        storedEventTypes: mentorProfile.calComEventTypes || []
      },
      calcom: {
        healthy: calcomHealthy,
        liveEventTypes: eventTypes,
        error: calcomError
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

// Debug endpoint to test availability for a specific mentor
router.get('/debug/mentor/:mentorId/availability/:date', async (req, res) => {
  try {
    const { mentorId, date } = req.params;
    
    console.log('🔍 Debug: Testing availability for:', { mentorId, date });
    
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    
    if (!mentorProfile) {
      return res.json({
        success: false,
        error: 'Mentor profile not found'
      });
    }

    if (!mentorProfile.calComUsername || !mentorProfile.calComVerified) {
      return res.json({
        success: false,
        error: 'Mentor Cal.com integration not setup',
        calComUsername: mentorProfile.calComUsername,
        calComVerified: mentorProfile.calComVerified
      });
    }

    let allSlots: any[] = [];
    let eventTypes: any[] = [];
    let errors: any[] = [];

    try {
      eventTypes = await calComService.getMentorEventTypes(mentorProfile.calComUsername);
      
      for (const eventType of eventTypes) {
        try {
          const slots = await calComService.getAvailableSlots(
            mentorProfile.calComUsername,
            eventType.id,
            date
          );
          allSlots.push(...slots.map(slot => ({
            ...slot,
            eventTypeTitle: eventType.title,
            eventTypeDuration: eventType.length
          })));
        } catch (eventError: any) {
          errors.push({
            eventTypeId: eventType.id,
            eventTypeTitle: eventType.title,
            error: eventError.message
          });
        }
      }
    } catch (error: any) {
      errors.push({
        stage: 'fetch_event_types',
        error: error.message
      });
    }
    
    return res.json({
      success: true,
      mentor: {
        displayName: mentorProfile.displayName,
        calComUsername: mentorProfile.calComUsername,
        hourlyRateINR: mentorProfile.hourlyRateINR
      },
      eventTypes,
      availableSlots: allSlots,
      errors,
      summary: {
        eventTypesFound: eventTypes.length,
        totalSlots: allSlots.length,
        errorsCount: errors.length
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
      eventTypeId: z.number().positive(), // Cal.com event type ID
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
    status: z.enum(['upcoming', 'completed', 'cancelled']).optional(),
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  }),
});

// Main booking endpoints with Cal.com v2 integration
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

// Cal.com integration endpoints
router.get('/calcom/health-check', async (req, res) => {
  try {
    const healthCheck = await calComService.healthCheck();
    
    return res.json({
      success: healthCheck.healthy,
      message: healthCheck.healthy ? 'Cal.com integration is healthy' : 'Cal.com integration has issues',
      data: healthCheck.details,
      suggestions: healthCheck.suggestions,
    });
  } catch (error: any) {
    console.error('❌ Cal.com health check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check Cal.com integration status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/calcom/mentor/:mentorId/event-types', async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    if (!mentorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format',
      });
    }

    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found',
      });
    }

    if (!mentorProfile.calComUsername || !mentorProfile.calComVerified) {
      return res.status(400).json({
        success: false,
        message: 'Mentor Cal.com integration not configured',
      });
    }

    const eventTypes = await calComService.getMentorEventTypes(mentorProfile.calComUsername);
    
    return res.json({
      success: true,
      message: 'Event types retrieved successfully',
      data: {
        mentorCalComUsername: mentorProfile.calComUsername,
        eventTypes,
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to get mentor event types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event types',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Test endpoint for specific slot availability
router.post('/calcom/test-availability', async (req, res) => {
  try {
    const { mentorId, eventTypeId, date } = req.body;
    
    if (!mentorId || !eventTypeId || !date) {
      return res.status(400).json({
        success: false,
        message: 'mentorId, eventTypeId, and date are required',
      });
    }

    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    
    if (!mentorProfile || !mentorProfile.calComUsername) {
      return res.status(404).json({
        success: false,
        message: 'Mentor or Cal.com integration not found',
      });
    }

    const slots = await calComService.getAvailableSlots(
      mentorProfile.calComUsername,
      eventTypeId,
      date
    );
    
    return res.json({
      success: true,
      message: 'Availability test completed',
      data: {
        mentorCalComUsername: mentorProfile.calComUsername,
        eventTypeId,
        date,
        availableSlots: slots,
      },
    });
  } catch (error: any) {
    console.error('❌ Availability test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Availability test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Clear Cal.com cache endpoint (for development/debugging)
router.post('/calcom/clear-cache', async (req, res) => {
  try {
    calComService.clearCache();
    
    return res.json({
      success: true,
      message: 'Cal.com cache cleared successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
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

    // TODO: Implement session rating logic
    // For now, just return success
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

// Add to booking.routes.ts
router.get('/debug/calcom-raw/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const response = await calComService.getRaw(`/event-types?username=${username}`);
    
    return res.json({
      success: true,
      username,
      fullResponse: response.data,
      eventTypeGroups: response.data?.data?.eventTypeGroups,
      allEventTypesFlat: response.data?.data?.eventTypeGroups?.flatMap((group: any) => 
        (group.eventTypes || []).map((et: any) => ({
          id: et.id,
          title: et.title,
          slug: et.slug,
          hidden: et.hidden,
          disabled: et.disabled,
          archived: et.archived,
          teamId: et.teamId,
          userId: et.userId,
          ownerId: et.ownerId,
          length: et.length,
          price: et.price,
          status: et.status,
          createdAt: et.createdAt,
          updatedAt: et.updatedAt
        }))
      )
    });
  } catch (error: any) {
    return res.json({
      success: false,
      error: error.message,
      response: error.response?.data
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Booking system operational with Cal.com v2 integration',
    timestamp: new Date().toISOString(),
    integrations: {
      database: 'connected',
      calcom: !!process.env.CALCOM_API_KEY,
      calcomApiVersion: 'v2',
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
  
  if (error.message?.includes('Cal.com')) {
    return res.status(503).json({
      success: false,
      message: 'Cal.com service temporarily unavailable',
      code: 'CALCOM_UNAVAILABLE',
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

export default router;