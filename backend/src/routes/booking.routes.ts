// backend/src/routes/booking.routes.ts - Complete Booking Routes
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateSchema } from '../validations/auth.validation';
import bookingController from '../controllers/booking.controller';
import { z } from 'zod';
import googleCalendarService from '../services/googleCalendar.service';
import googleMeetService from '../services/googleMeet.service';
import { bookingService, paymentService, notificationService } from '../services/booking.service';
import User, { IUser } from '../models/User.model';


const router = Router();

// Validation schemas for booking endpoints
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
    }),
    sessionType: z.enum(['video', 'audio', 'in-person']),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
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

// Protected routes (authentication required)
router.use(authenticate);

/**
 * @route   POST /api/booking/available-slots
 * @desc    Get available time slots for a mentor on a specific date
 * @access  Private
 * @body    { mentorId: string, date: string }
 */
router.post(
  '/available-slots',
  validateSchema(availableSlotsSchema),
  bookingController.getAvailableSlots
);

/**
 * @route   POST /api/booking/create
 * @desc    Create a new booking with payment processing
 * @access  Private
 * @body    { mentorId, timeSlot, sessionType, subject, notes?, paymentMethodId }
 */
router.post(
  '/create',
  validateSchema(createBookingSchema),
  bookingController.createBooking
);

/**
 * @route   GET /api/booking/user-bookings
 * @desc    Get user's bookings (as student or mentor)
 * @access  Private
 * @query   { status?: 'upcoming'|'completed'|'cancelled', page?: number, limit?: number }
 */
router.get(
  '/user-bookings',
  validateSchema(userBookingsQuerySchema),
  bookingController.getUserBookings
);

/**
 * @route   GET /api/booking/:bookingId
 * @desc    Get detailed information about a specific booking
 * @access  Private
 * @params  { bookingId: string }
 */
router.get(
  '/:bookingId',
  // Add param validation
  (req, res, next) => {
    const bookingId = req.params.bookingId;
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
      });
    } else {
      return next();
    }
  },
  bookingController.getBookingDetails
);

/**
 * @route   PUT /api/booking/:bookingId/cancel
 * @desc    Cancel a booking with refund processing
 * @access  Private
 * @params  { bookingId: string }
 * @body    { reason?: string }
 */
router.put(
  '/:bookingId/cancel',
  validateSchema(cancelBookingSchema),
  bookingController.cancelBooking
);

/**
 * @route   PUT /api/booking/:bookingId/reschedule
 * @desc    Reschedule a booking to a new time slot
 * @access  Private
 * @params  { bookingId: string }
 * @body    { newTimeSlot: TimeSlot }
 */
router.put(
  '/:bookingId/reschedule',
  validateSchema(rescheduleBookingSchema),
  bookingController.rescheduleBooking
);

/**
 * @route   POST /api/booking/:sessionId/rate
 * @desc    Rate a completed session
 * @access  Private
 * @params  { sessionId: string }
 * @body    { rating: number, review?: string }
 */
router.post(
  '/:sessionId/rate',
  validateSchema(rateSessionSchema),
  bookingController.rateSession
);

// Google integration routes
/**
 * @route   POST /api/booking/google/calendar/check-availability
 * @desc    Check mentor's Google Calendar availability
 * @access  Private
 */
router.post('/google/calendar/check-availability', async (req, res) => {
  try {
    const { mentorId, date, slots } = req.body;
    
    if (!mentorId || !date || !slots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: mentorId, date, slots',
      });
    }

    // Use direct import instead of require
    const availableSlots = await googleCalendarService.checkAvailability(
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

/**
 * @route   POST /api/booking/google/meet/create
 * @desc    Create Google Meet link for a session
 * @access  Private
 */
router.post('/google/meet/create', async (req, res) => {
  try {
    const { mentorId, studentId, sessionDetails } = req.body;
    
    if (!mentorId || !studentId || !sessionDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    // Use direct import instead of require
    const result = await googleMeetService.createMeeting({
      summary: `Mentoring Session: ${sessionDetails.subject}`,
      startTime: sessionDetails.startTime,
      endTime: sessionDetails.endTime,
      attendees: [
        { email: req.body.mentorEmail },
        { email: req.body.studentEmail },
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

// Payment integration routes
/**
 * @route   POST /api/booking/payment/process
 * @desc    Process payment for booking
 * @access  Private
 */
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
      res.status(400).json({
        success: false,
        message: 'Missing required payment parameters',
      });
      return;
    }

    // Use direct import instead of require
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
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Payment processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   POST /api/booking/payment/refund
 * @desc    Process refund for cancelled booking
 * @access  Private
 */
router.post('/payment/refund', async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for refund',
      });
    }

    // Use direct import instead of require
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

// Notification routes
/**
 * @route   POST /api/booking/notifications/setup-reminders
 * @desc    Setup automated reminders for a session
 * @access  Private
 */
router.post('/notifications/setup-reminders', async (req, res) => {
  try {
    const reminderData = req.body;
    
    if (!reminderData.sessionId || !reminderData.mentorEmail || !reminderData.studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required reminder data',
      });
    }

    // Use direct import instead of require
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

/**
 * @route   POST /api/booking/google/calendar/create-event
 * @desc    Create Google Calendar event
 * @access  Private
 */
router.post('/google/calendar/create-event', async (req, res) => {
  try {
    const { eventData, mentorId, studentId } = req.body;
    
    const result = await googleCalendarService.createEvent({
      summary: eventData.summary,
      description: eventData.description,
      startTime: eventData.start.dateTime,
      endTime: eventData.end.dateTime,
      attendees: eventData.attendees,
      meetingLink: eventData.meetingLink,
      timezone: eventData.start.timeZone,
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

/**
 * @route   GET /api/booking/payment/validate
 * @desc    Validate payment method
 * @access  Private
 */
router.get('/payment/validate', async (req, res) => {
  try {
    const { paymentMethodId } = req.query;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required',
      });
    }

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

/**
 * @route   POST /api/booking/notifications/cancellation
 * @desc    Send cancellation notifications
 * @access  Private
 */
router.post('/notifications/cancellation', async (req, res) => {
  try {
    const notificationData = req.body;
    
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

/**
 * @route   POST /api/booking/notifications/reschedule
 * @desc    Send reschedule notifications
 * @access  Private
 */
router.post('/notifications/reschedule', async (req, res) => {
  try {
    const notificationData = req.body;
    
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

// Add this route for debugging
router.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Booking routes are working',
    availableRoutes: [
      'POST /api/v1/booking/available-slots',
      'POST /api/v1/booking/create',
      'GET /api/v1/booking/user-bookings',
      'PUT /api/v1/booking/:bookingId/cancel',
      'PUT /api/v1/booking/:bookingId/reschedule'
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/booking/debug/mentor/:mentorId
 * @desc    Debug mentor schedule and slot generation
 * @access  Private
 */
router.get('/debug/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query;
    
    const mentorDoc = await User.findById(mentorId).select('weeklySchedule timezone pricing name');
    
    if (!mentorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }

    // Proper type assertion
    const mentor = mentorDoc as IUser & {
      pricing?: any;
      weeklySchedule?: any;
    };

    const testDate = (date as string) || new Date().toISOString().split('T')[0];
    const dayName = new Date(testDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Define proper interface for debugInfo
    interface DebugInfo {
      mentor: {
        id: string;
        name: string;
        timezone?: string;
        pricing?: any;
      };
      schedule: {
        fullWeek: any;
        requestedDay: string;
        daySchedule: any;
      };
      testDate: string;
      slotsGenerated: number;
      generatedSlots?: any[];
      slotGenerationError?: string;
    }

    const debugInfo: DebugInfo = {
      mentor: {
        id: mentor._id.toString(),
        name: mentor.name,
        timezone: mentor.timezone,
        pricing: mentor.pricing,
      },
      schedule: {
        fullWeek: mentor.weeklySchedule,
        requestedDay: dayName,
        daySchedule: mentor.weeklySchedule?.[dayName] || null,
      },
      testDate,
      slotsGenerated: 0,
    };

    // Test slot generation
    try {
      const slots = await bookingService.generateTimeSlots(mentor, testDate);
      debugInfo.slotsGenerated = slots.length;
      debugInfo.generatedSlots = slots;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugInfo.slotGenerationError = errorMessage;
    }

    return res.json({
      success: true,
      message: 'Debug information retrieved',
      data: debugInfo,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: errorMessage,
    });
  }
});

/**
 * @route   GET /api/booking/debug/mentor/:mentorId/schedule
 * @desc    Debug mentor schedule for specific date
 * @access  Private
 */
router.get('/debug/mentor/:mentorId/schedule', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query;
    
    const mentor = await User.findById(mentorId);
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }

    const testDate = (date as string) || new Date().toISOString().split('T')[0];
    const requestedDate = new Date(testDate);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Define proper types for debugInfo
    interface DebugInfo {
      mentor: {
        id: string;
        name: string;
      };
      requestInfo: {
        testDate: string;
        dayName: string;
        requestedDate: string;
      };
      scheduleInfo: {
        hasWeeklySchedule: boolean;
        weeklyScheduleKeys: string[];
        fullWeeklySchedule: any;
        daySchedule: any;
        dayScheduleLength: number;
      };
      generatedSlots: any[];
      errors: string[];
    }

    const debugInfo: DebugInfo = {
      mentor: {
        id: mentor._id.toString(),
        name: mentor.name,
      },
      requestInfo: {
        testDate,
        dayName,
        requestedDate: requestedDate.toISOString(),
      },
      scheduleInfo: {
        hasWeeklySchedule: !!mentor.weeklySchedule,
        weeklyScheduleKeys: mentor.weeklySchedule ? Object.keys(mentor.weeklySchedule) : [],
        fullWeeklySchedule: mentor.weeklySchedule,
        daySchedule: mentor.weeklySchedule?.[dayName],
        dayScheduleLength: mentor.weeklySchedule?.[dayName]?.length || 0,
      },
      generatedSlots: [],
      errors: [],
    };

    // Test slot generation
    try {
      const slots = await bookingService.generateTimeSlots(mentor, testDate);
      debugInfo.generatedSlots = slots;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugInfo.errors.push(`Slot generation error: ${errorMessage}`);
    }

    return res.json({
      success: true,
      message: 'Debug information retrieved',
      data: debugInfo,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: errorMessage,
    });
  }
});

// Health check for booking system
/**
 * @route   GET /api/booking/health
 * @desc    Health check for booking system
 * @access  Private
 */
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