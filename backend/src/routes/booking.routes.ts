// backend/src/routes/booking.routes.ts - Updated Routes for Cal.com Integration
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateSchema } from '../validations/auth.validation';
import bookingController from '../controllers/booking.controller';
import calComService from '../services/calcom.service';
import MentorProfileService from '../services/mentorProfile.service';
import { z } from 'zod';
import { User } from 'models';

const router = Router();

// Debug endpoint to find mentors with schedules (public access)
router.get('/find-mentors-with-schedule', async (req, res) => {
  try {
    // Using the mentorProfiles collection (not users collection)
    const mentorsWithSchedule = await MentorProfileService.findMentorsWithSchedule();
    
    return res.json({
      success: true,
      mentors: mentorsWithSchedule.map(m => ({
        id: m.userId, // This is the userId that links to users collection
        profileId: m._id, // This is the mentorProfile _id
        name: m.displayName,
        hasSchedule: !!m.weeklySchedule,
        hasPricing: !!m.pricing,
      }))
    });
  } catch (error) {
    return res.json({ 
      success: false, 
      error: typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error) 
    });
  }
});

// Test endpoint to check mentor profile and schedule
router.get('/debug/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query;
    
    // Use the debug utility
    const { runBookingDebug } = await import('../utils/bookingDebug');
    const debugInfo = await runBookingDebug(mentorId, date as string);

    return res.json({
      success: true,
      message: 'Debug information retrieved',
      data: debugInfo,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message,
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
      sessionType: z.enum(['video', 'audio', 'in-person']),
    }),
    sessionType: z.enum(['video', 'audio', 'in-person']).optional(),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject too long'),
    notes: z.string().max(1000, 'Notes too long').optional(),
    paymentMethodId: z.string().min(1, 'Payment method is required'),
  }),
});

const rescheduleBookingSchema = z.object({
  body: z.object({
    newTimeSlot: z.object({
      id: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      date: z.string(),
      price: z.number().positive(),
      duration: z.number().positive(),
      sessionType: z.enum(['video', 'audio', 'in-person']),
    }),
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

router.put(
  '/:bookingId/reschedule',
  validateSchema(rescheduleBookingSchema),
  bookingController.rescheduleBooking
);

// Cal.com integration endpoints
router.post('/calcom/sync-mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    if (!mentorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format',
      });
    }

    const result = await calComService.syncMentorAvailability(mentorId);
    
    return res.json({
      success: result,
      message: result ? 'Mentor availability synced with Cal.com' : 'Failed to sync with Cal.com',
    });
  } catch (error: any) {
    console.error('❌ Cal.com sync failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync with Cal.com',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/calcom/create-event-type/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    if (!mentorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format',
      });
    }

    const eventType = await calComService.createMentorEventType(mentorId);
    
    return res.json({
      success: !!eventType,
      message: eventType ? 'Event type created in Cal.com' : 'Failed to create event type',
      data: eventType,
    });
  } catch (error: any) {
    console.error('❌ Cal.com event type creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Cal.com event type',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Test Cal.com connection
router.get('/calcom/test', async (req, res) => {
  try {
    const hasApiKey = !!process.env.CALCOM_API_KEY;
    const apiUrl = process.env.CALCOM_API_URL || 'https://api.cal.com/v1';
    
    return res.json({
      success: true,
      message: 'Cal.com configuration',
      data: {
        configured: hasApiKey,
        apiUrl,
        apiKeyLength: process.env.CALCOM_API_KEY?.length || 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Cal.com test failed',
      error: error.message,
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Booking system operational',
    timestamp: new Date().toISOString(),
    integrations: {
      database: 'connected',
      calcom: !!process.env.CALCOM_API_KEY,
    },
  });
});

export default router;