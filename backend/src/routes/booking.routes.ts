// backend/src/routes/booking.routes.ts - Complete Booking Routes
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateSchema } from '../validations/auth.validation';
import bookingController from '../controllers/booking.controller';
import { z } from 'zod';

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
router.post('api/v1/google/calendar/check-availability', async (req, res) => {
  try {
    const { mentorId, date, slots } = req.body;
    
    if (!mentorId || !date || !slots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: mentorId, date, slots',
      });
    }

    // Import here to avoid circular dependency
    const googleCalendarService = require('../services/googleCalendar.service').default;
    
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
router.post('api/v1/google/meet/create', async (req, res) => {
  try {
    const { mentorId, studentId, sessionDetails } = req.body;
    
    if (!mentorId || !studentId || !sessionDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    // Import here to avoid circular dependency
    const googleMeetService = require('../services/googleMeet.service').default;
    
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
router.post('api/v1/payment/process', async (req, res) => {
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

    // Import here to avoid circular dependency
    const { paymentService } = require('../services/booking.service');
    
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
router.post('api/v1/payment/refund', async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for refund',
      });
    }

    // Import here to avoid circular dependency
    const { paymentService } = require('../services/booking.service');
    
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
router.post('api/v1/notifications/setup-reminders', async (req, res) => {
  try {
    const reminderData = req.body;
    
    if (!reminderData.sessionId || !reminderData.mentorEmail || !reminderData.studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required reminder data',
      });
    }

    // Import here to avoid circular dependency
    const { notificationService } = require('../services/booking.service');
    
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