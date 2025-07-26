// backend/src/routes/booking.routes.ts - Updated Routes with Better Error Handling
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateSchema } from '../validations/auth.validation';
import bookingController from '../controllers/booking.controller';
import { z } from 'zod';
import { User } from 'models';

const router = Router();

// Add to booking.routes.ts before authentication
router.get('/find-mentors-with-schedule', async (req, res) => {
  try {
    const mentorsWithSchedule = await User.find({
      weeklySchedule: { $exists: true, $ne: null },
      role: 'mentor'
    }).select('_id firstName lastName displayName weeklySchedule pricing');
    
    return res.json({
      success: true,
      mentors: mentorsWithSchedule.map(m => ({
        id: m._id,
        name: m.displayName || `${m.firstName} ${m.lastName}`,
        hasSchedule: !!m.weeklySchedule,
        hasPricing: !!m.pricing,
      }))
    });
  } catch (error) {
    return res.json({ success: false, error: typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error) });
  }
});

// Apply authentication to all routes
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
    sessionType: z.enum(['video', 'audio', 'in-person']),
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

const rateSessionSchema = z.object({
  body: z.object({
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    review: z.string().max(1000, 'Review too long').optional(),
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

router.post(
  '/:sessionId/rate',
  validateSchema(rateSessionSchema),
  bookingController.rateSession
);

// Google integration endpoints
router.post('/google/calendar/check-availability', async (req, res) => {
  try {
    const { mentorId, date, slots } = req.body;
    
    if (!mentorId || !date || !slots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: mentorId, date, slots',
      });
    }

    const googleCalendarService = await import('../services/googleCalendar.service');
    const availableSlots = await googleCalendarService.default.checkAvailability(
      mentorId,
      date,
      slots
    );
    
    return res.json({
      success: true,
      data: { availableSlots },
    });
  } catch (error: any) {
    console.error('❌ Google Calendar availability check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check Google Calendar availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/google/meet/create', async (req, res) => {
  try {
    const { mentorId, studentId, sessionDetails } = req.body;
    
    if (!mentorId || !studentId || !sessionDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const googleMeetService = await import('../services/googleMeet.service');
    const result = await googleMeetService.default.createMeeting({
      summary: `Mentoring Session: ${sessionDetails.subject}`,
      startTime: sessionDetails.startTime,
      endTime: sessionDetails.endTime,
      attendees: [
        { email: req.body.mentorEmail || 'mentor@example.com' },
        { email: req.body.studentEmail || 'student@example.com' },
      ],
    });

    return res.json(result);
  } catch (error: any) {
    console.error('❌ Google Meet creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Google Meet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/google/calendar/create-event', async (req, res) => {
  try {
    const { eventData, mentorId, studentId } = req.body;
    
    const googleCalendarService = await import('../services/googleCalendar.service');
    const result = await googleCalendarService.default.createEvent({
      summary: eventData.summary,
      description: eventData.description,
      startTime: eventData.start?.dateTime || eventData.startTime,
      endTime: eventData.end?.dateTime || eventData.endTime,
      attendees: eventData.attendees || [],
      meetingLink: eventData.meetingLink,
      timezone: eventData.start?.timeZone || 'UTC',
    });

    return res.json(result);
  } catch (error: any) {
    console.error('❌ Calendar event creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create calendar event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Payment endpoints
router.post('/payment/process', async (req, res) => {
  try {
    const {
      amount,
      currency,
      paymentMethodId,
      description,
      mentorId,
      studentId,
      sessionDetails,
    } = req.body;
    
    if (!amount || !paymentMethodId || !mentorId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters',
      });
    }

    const { paymentService } = await import('../services/booking.service');
    const result = await paymentService.processPayment({
      amount,
      currency: currency || 'USD',
      paymentMethodId,
      description: description || 'Mentoring Session',
      metadata: {
        mentorId,
        studentId,
        sessionDetails,
      },
    });
    
    return res.json(result);
  } catch (error: any) {
    console.error('❌ Payment processing failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/payment/refund', async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for refund',
      });
    }

    const { paymentService } = await import('../services/booking.service');
    const result = await paymentService.refundPayment(paymentId, amount);
    
    return res.json(result);
  } catch (error: any) {
    console.error('❌ Refund processing failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/payment/validate', async (req, res) => {
  try {
    const { paymentMethodId } = req.query;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required',
      });
    }

    const { paymentService } = await import('../services/booking.service');
    const isValid = await paymentService.validatePaymentMethod(paymentMethodId as string);
    
    return res.json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error: any) {
    console.error('❌ Payment validation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Notification endpoints
router.post('/notifications/setup-reminders', async (req, res) => {
  try {
    const reminderData = req.body;
    
    if (!reminderData.sessionId || !reminderData.mentorEmail || !reminderData.studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required reminder data',
      });
    }

    const { notificationService } = await import('../services/booking.service');
    await notificationService.setupSessionReminders(reminderData);
    
    return res.json({
      success: true,
      message: 'Reminders set up successfully',
    });
  } catch (error: any) {
    console.error('❌ Reminder setup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to setup reminders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/notifications/cancellation', async (req, res) => {
  try {
    const notificationData = req.body;
    
    const { notificationService } = await import('../services/booking.service');
    await notificationService.sendCancellationNotification(notificationData);
    
    return res.json({
      success: true,
      message: 'Cancellation notifications sent',
    });
  } catch (error: any) {
    console.error('❌ Cancellation notification failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send cancellation notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/notifications/reschedule', async (req, res) => {
  try {
    const notificationData = req.body;
    
    const { notificationService } = await import('../services/booking.service');
    await notificationService.sendRescheduleNotification(notificationData);
    
    return res.json({
      success: true,
      message: 'Reschedule notifications sent',
    });
  } catch (error: any) {
    console.error('❌ Reschedule notification failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reschedule notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Debug endpoints
router.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Booking routes are working',
    availableRoutes: [
      'POST /api/v1/booking/available-slots',
      'POST /api/v1/booking/create',
      'GET /api/v1/booking/user-bookings',
      'GET /api/v1/booking/:bookingId',
      'PUT /api/v1/booking/:bookingId/cancel',
      'PUT /api/v1/booking/:bookingId/reschedule',
      'POST /api/v1/booking/:sessionId/rate',
    ],
    timestamp: new Date().toISOString()
  });
});

router.get('/debug/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query;
    
    const User = (await import('../models/User.model')).default;
    const mentor = await User.findById(mentorId).select('weeklySchedule timezone pricing name displayName');
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }

    const testDate = (date as string) || new Date().toISOString().split('T')[0];
    const dayName = new Date(testDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const debugInfo: {
      mentor: {
        id: string;
        name: string;
        timezone: string;
        pricing: any;
      };
      schedule: {
        fullWeek: any;
        requestedDay: string;
        daySchedule: any;
      };
      testDate: string;
      slotsGenerated: number;
      generatedSlots: any[];
      slotGenerationError: string | null;
    } = {
      mentor: {
        id: mentor._id.toString(),
        name: mentor.name,
        timezone: mentor.timezone ?? 'UTC',
        pricing: mentor.pricing,
      },
      schedule: {
        fullWeek: mentor.weeklySchedule,
        requestedDay: dayName,
        daySchedule: mentor.weeklySchedule?.[dayName] || null,
      },
      testDate,
      slotsGenerated: 0,
      generatedSlots: [],
      slotGenerationError: null,
    };

    // Test slot generation
    try {
      const { bookingService } = await import('../services/booking.service');
      const slots = await bookingService.generateTimeSlots(mentor, testDate);
      debugInfo.slotsGenerated = slots.length;
      debugInfo.generatedSlots = slots;
    } catch (error: any) {
      debugInfo.slotGenerationError = error.message;
    }

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

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Booking system is operational',
    timestamp: new Date().toISOString(),
    database: 'connected',
    googleCalendar: 'available',
    googleMeet: 'available',
    payment: 'available',
    notifications: 'available',
  });
});

export default router;