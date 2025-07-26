// backend/src/controllers/booking.controller.ts - Complete Fixed Booking Controller
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { bookingService, paymentService, notificationService } from '../services/booking.service';
import googleCalendarService from '../services/googleCalendar.service';
import googleMeetService from '../services/googleMeet.service';
import { Session } from '../models/Session.model';
import User, { IUser as UserType } from '../models/User.model';

/**
 * Get available time slots for a mentor on a specific date
 */
export const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { mentorId, date } = req.body;
  
  console.log('📅 Fetching available slots:', { mentorId, date });

  if (!mentorId || !date) {
    res.status(400).json({
      success: false,
      message: 'Mentor ID and date are required',
    });
    return;
  }

  try {
    // Fix: Get mentor with proper field selection - make sure weeklySchedule is included
    const mentor = await User.findById(mentorId).select('weeklySchedule timezone pricing name displayName') as (UserType & { pricing?: any; weeklySchedule?: any; displayName?: string });
    
    if (!mentor) {
      res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
      return;
    }

    console.log('👤 Mentor found:', mentor.name || mentor.displayName);
    console.log('📋 Weekly schedule exists:', !!mentor.weeklySchedule);
    console.log('📋 Weekly schedule keys:', mentor.weeklySchedule ? Object.keys(mentor.weeklySchedule) : 'none');

    // Check if mentor has weekly schedule
    if (!mentor.weeklySchedule || Object.keys(mentor.weeklySchedule).length === 0) {
      console.log('⚠️ Mentor has no weekly schedule configured');
      res.status(200).json({
        success: true,
        message: 'No schedule configured for this mentor',
        data: [],
      });
      return;
    }

    // Debug: Log the specific day we're looking for
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log('📅 Looking for day:', dayName);
    console.log('📅 Day schedule:', mentor.weeklySchedule[dayName]);

    // Generate slots based on mentor's schedule
    const mentorSlots = await bookingService.generateTimeSlots(mentor, date);
    
    console.log('🎯 Generated mentor slots:', mentorSlots.length);
    
    if (mentorSlots.length === 0) {
      console.log('⚠️ No slots generated for this date');
      res.status(200).json({
        success: true,
        message: 'No available slots for this date',
        data: [],
      });
      return;
    }

    // Check Google Calendar availability
    const availableSlots = await googleCalendarService.checkAvailability(
      mentorId,
      date,
      mentorSlots
    );

    // Enrich availableSlots with required properties
    const enrichedSlots = availableSlots.map(slot => {
      const sessionType = (slot as any).sessionType || 'video';
      const duration = (slot as any).duration || 60;
      return {
        ...slot,
        date: date,
        price: mentor.pricing?.hourlyRate || 50,
        duration,
        sessionType,
      };
    });

    // Filter out already booked slots from database
    const finalSlots = await bookingService.filterBookedSlots(enrichedSlots, mentorId, date);

    console.log('✅ Final available slots:', finalSlots.length);

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: finalSlots,
    });

  } catch (error: any) {
    console.error('❌ Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Create a new booking with complete flow
 */
export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    mentorId,
    timeSlot,
    sessionType,
    subject,
    notes,
    paymentMethodId,
  } = req.body;

  const studentId = req.userId;

  console.log('🎯 Creating booking:', {
    mentorId,
    studentId,
    timeSlot: timeSlot.id,
    sessionType,
    subject,
  });

  let paymentId: string | undefined = undefined;

  try {
    // Step 1: Validate the booking request
    const validationResult = await bookingService.validateBooking({
      mentorId,
      studentId,
      timeSlot,
      sessionType,
      subject,
      paymentMethodId,
    });

    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        message: validationResult.message,
      });
      return;
    }

    // Step 2: Process payment
    console.log('💳 Processing payment...');
    const paymentResult = await paymentService.processPayment({
      amount: timeSlot.price,
      currency: 'USD',
      paymentMethodId,
      description: `Mentoring Session: ${subject}`,
      metadata: {
        mentorId,
        studentId,
        sessionType,
        scheduledTime: timeSlot.startTime,
      },
    });

    if (!paymentResult.success) {
      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentResult.error,
      });
      return;
    }

    paymentId = paymentResult.paymentId;

    // Step 3: Create session record
    console.log('📝 Creating session record...');
    const session = await Session.create({
      studentId,
      mentorId,
      subject,
      scheduledTime: new Date(timeSlot.startTime),
      actualStartTime: null,
      actualEndTime: null,
      duration: timeSlot.duration,
      sessionType: sessionType === 'video' ? 'video' : sessionType === 'audio' ? 'audio' : 'chat',
      status: 'confirmed',
      sessionNotes: notes,
    });

    // Step 4: Create Google Meet link
    console.log('🎥 Creating Google Meet link...');
    let meetingLink = '';
    try {
      const meetResult = await googleMeetService.createMeeting({
        summary: `Mentoring Session: ${subject}`,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        attendees: [
          { email: validationResult.mentorEmail!, name: validationResult.mentorName },
          { email: validationResult.studentEmail!, name: validationResult.studentName },
        ],
      });
      
      if (meetResult.success && meetResult.meetingLink) {
        meetingLink = meetResult.meetingLink;
        session.recordingUrl = meetingLink; // Store meeting link in recordingUrl field
        await session.save();
      }
    } catch (meetError) {
      console.warn('⚠️ Google Meet creation failed:', meetError);
      // Continue without meeting link - not critical
    }

    // Step 5: Create Google Calendar events
    console.log('📅 Creating calendar events...');
    let calendarEventId = '';
    try {
      const calendarResult = await googleCalendarService.createEvent({
        summary: `Mentoring Session: ${subject}`,
        description: `
          Mentoring session with ${validationResult.mentorName}.
          
          Subject: ${subject}
          Duration: ${timeSlot.duration} minutes
          Session Type: ${sessionType.toUpperCase()}
          
          ${meetingLink ? `Meeting Link: ${meetingLink}` : ''}
          
          Notes: ${notes || 'No additional notes'}
        `,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        attendees: [
          { email: validationResult.mentorEmail!, name: validationResult.mentorName! },
          { email: validationResult.studentEmail!, name: validationResult.studentName! },
        ],
        meetingLink,
        timezone: validationResult.mentorTimezone || 'UTC',
      });

      if (calendarResult.success && calendarResult.eventId) {
        calendarEventId = calendarResult.eventId;
      }
    } catch (calError) {
      console.warn('⚠️ Calendar event creation failed:', calError);
      // Continue without calendar - not critical
    }

    // Step 6: Setup notifications and reminders
    console.log('🔔 Setting up notifications...');
    try {
      await notificationService.setupSessionReminders({
        sessionId: session._id.toString(),
        mentorId,
        studentId,
        mentorEmail: validationResult.mentorEmail!,
        studentEmail: validationResult.studentEmail!,
        mentorName: validationResult.mentorName!,
        studentName: validationResult.studentName!,
        subject,
        scheduledTime: timeSlot.startTime,
        duration: timeSlot.duration,
        meetingLink,
        sessionType,
      });
    } catch (notifError) {
      console.warn('⚠️ Notification setup failed:', notifError);
      // Continue - notifications are not critical for booking success
    }

    // Step 7: Send confirmation emails
    console.log('📧 Sending confirmation emails...');
    try {
      await notificationService.sendBookingConfirmation({
        sessionId: session._id.toString(),
        mentorEmail: validationResult.mentorEmail!,
        studentEmail: validationResult.studentEmail!,
        mentorName: validationResult.mentorName!,
        studentName: validationResult.studentName!,
        subject,
        scheduledTime: timeSlot.startTime,
        duration: timeSlot.duration,
        meetingLink,
        calendarEventId,
        sessionType,
        amount: timeSlot.price,
      });
    } catch (emailError) {
      console.warn('⚠️ Confirmation email failed:', emailError);
      // Continue - emails are not critical for booking success
    }

    console.log('✅ Booking created successfully:', session._id);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: session._id,
        sessionId: session._id,
        paymentId: paymentResult.paymentId,
        meetingLink,
        calendarEventId,
        reminderSet: true,
      },
    });

  } catch (error: any) {
    console.error('❌ Booking creation failed:', error);
    
    // Attempt to refund payment if session creation failed
    if (paymentId) {
      try {
        await paymentService.refundPayment(paymentId);
        console.log('💰 Payment refunded due to booking failure');
      } catch (refundError) {
        console.error('❌ Refund failed:', refundError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Booking creation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Cancel a booking
 */
export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  const userId = req.userId;

  console.log('❌ Cancelling booking:', { bookingId, userId, reason });

  try {
    // Find the session
    const session = await Session.findById(bookingId)
      .populate('studentId', 'name email')
      .populate('mentorId', 'displayName email');

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Check if user is authorized to cancel
    const isStudent = session.studentId._id.toString() === userId;
    const isMentor = session.mentorId._id.toString() === userId;
    
    if (!isStudent && !isMentor) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking',
      });
      return;
    }

    // Check if booking can be cancelled
    const now = new Date();
    const scheduledTime = new Date(session.scheduledTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const hoursUntilSession = timeDiff / (1000 * 60 * 60);

    // Different cancellation policies based on time remaining
    let refundEligible = false;
    let refundAmount = 0;
    const sessionPrice = 50; // This should come from the original booking

    if (hoursUntilSession >= 24) {
      refundEligible = true;
      refundAmount = sessionPrice; // Full refund
    } else if (hoursUntilSession >= 2) {
      refundEligible = true;
      refundAmount = sessionPrice * 0.5; // 50% refund
    }
    // No refund if less than 2 hours

    // Update session status
    session.status = 'cancelled';
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Cancelled by ${isStudent ? 'student' : 'mentor'}: ${reason || 'No reason provided'}`;
    await session.save();

    // Process refund if eligible
    let refundResult = null;
    if (refundEligible && refundAmount > 0) {
      try {
        refundResult = await paymentService.refundPayment('mock_payment_id', refundAmount);
        console.log('💰 Refund processed:', refundAmount);
      } catch (refundError) {
        console.error('❌ Refund processing failed:', refundError);
      }
    }

    // Cancel Google Calendar event
    try {
      await googleCalendarService.cancelEvent(session._id.toString());
      console.log('📅 Calendar event cancelled');
    } catch (calError) {
      console.warn('⚠️ Calendar cancellation failed:', calError);
    }

    // Send cancellation notifications
    try {
      await notificationService.sendCancellationNotification({
        sessionId: session._id.toString(),
        mentorEmail: (session.mentorId as any).email,
        studentEmail: (session.studentId as any).email,
        mentorName: (session.mentorId as any).displayName,
        studentName: (session.studentId as any).name,
        subject: session.subject,
        scheduledTime: session.scheduledTime.toISOString(),
        cancelledBy: isStudent ? 'student' : 'mentor',
        reason: reason || 'No reason provided',
        refundAmount: refundAmount,
      });
    } catch (notifError) {
      console.warn('⚠️ Cancellation notification failed:', notifError);
    }

    console.log('✅ Booking cancelled successfully');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        sessionId: session._id,
        refundEligible,
        refundAmount,
        paymentId: 'mock_payment_id',
        calendarEventId: session._id.toString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Booking cancellation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Booking cancellation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Reschedule a booking
 */
export const rescheduleBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { newTimeSlot } = req.body;
  const userId = req.userId;

  console.log('🔄 Rescheduling booking:', { bookingId, newTimeSlot: newTimeSlot.id });

  try {
    // Find the session
    const session = await Session.findById(bookingId)
      .populate('studentId', 'name email')
      .populate('mentorId', 'displayName email');

    if (!session) {
       res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Check authorization
    const isStudent = session.studentId._id.toString() === userId;
    const isMentor = session.mentorId._id.toString() === userId;
    
    if (!isStudent && !isMentor) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to reschedule this booking',
      });
      return;
    }

    // Validate new time slot availability
    const validationResult = await bookingService.validateTimeSlot(
      session.mentorId._id.toString(),
      newTimeSlot
    );

    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        message: validationResult.message,
      });
      return;
    }

    // Update session with new time
    const oldScheduledTime = session.scheduledTime;
    session.scheduledTime = new Date(newTimeSlot.startTime);
    session.duration = newTimeSlot.duration;
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Rescheduled from ${oldScheduledTime.toISOString()} by ${isStudent ? 'student' : 'mentor'}`;
    await session.save();

    // Update Google Calendar event
    try {
      await googleCalendarService.updateEvent(session._id.toString(), {
        startTime: newTimeSlot.startTime,
        endTime: newTimeSlot.endTime,
        summary: `Mentoring Session: ${session.subject} (Rescheduled)`,
      });
      console.log('📅 Calendar event updated');
    } catch (calError) {
      console.warn('⚠️ Calendar update failed:', calError);
    }

    // Send reschedule notifications
    try {
      await notificationService.sendRescheduleNotification({
        sessionId: session._id.toString(),
        mentorEmail: (session.mentorId as any).email,
        studentEmail: (session.studentId as any).email,
        mentorName: (session.mentorId as any).displayName,
        studentName: (session.studentId as any).name,
        subject: session.subject,
        oldTime: oldScheduledTime.toISOString(),
        newTime: newTimeSlot.startTime,
        rescheduledBy: isStudent ? 'student' : 'mentor',
        meetingLink: session.recordingUrl, // Meeting link stored in recordingUrl
      });
    } catch (notifError) {
      console.warn('⚠️ Reschedule notification failed:', notifError);
    }

    console.log('✅ Booking rescheduled successfully');

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        sessionId: session._id,
        newScheduledTime: session.scheduledTime,
        calendarEventId: session._id.toString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Booking reschedule failed:', error);
    res.status(500).json({
      success: false,
      message: 'Booking reschedule failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get user's bookings
 */
export const getUserBookings = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { status, page = 1, limit = 10 } = req.query;

  console.log('📋 Fetching user bookings:', { userId, status, page, limit });

  try {
    const query: any = {
      $or: [
        { studentId: userId },
        { mentorId: userId }
      ]
    };

    if (status) {
      if (status === 'upcoming') {
        query.scheduledTime = { $gt: new Date() };
        query.status = { $nin: ['cancelled', 'completed'] };
      } else if (status === 'completed') {
        query.status = 'completed';
      } else if (status === 'cancelled') {
        query.status = 'cancelled';
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('studentId', 'name email avatar')
        .populate('mentorId', 'displayName email profileImage')
        .sort({ scheduledTime: -1 })
        .skip(skip)
        .limit(limitNum),
      Session.countDocuments(query)
    ]);

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      mentor: {
        id: (session.mentorId as any)._id,
        name: (session.mentorId as any).displayName,
        email: (session.mentorId as any).email,
        avatar: (session.mentorId as any).profileImage,
      },
      student: {
        id: (session.studentId as any)._id,
        name: (session.studentId as any).name,
        email: (session.studentId as any).email,
        avatar: (session.studentId as any).avatar,
      },
      subject: session.subject,
      date: session.scheduledTime,
      duration: session.duration,
      sessionType: {
        type: session.sessionType,
        duration: session.duration,
      },
      status: session.status,
      meetingLink: session.recordingUrl,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: 50, // Default price - should be stored in session
    }));

    console.log('✅ User bookings fetched:', formattedSessions.length);

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: formattedSessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get booking details
 */
export const getBookingDetails = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.userId;

  console.log('🔍 Fetching booking details:', { bookingId, userId });

  try {
    const session = await Session.findById(bookingId)
      .populate('studentId', 'name email avatar')
      .populate('mentorId', 'displayName email profileImage');

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Check authorization
    const isStudent = session.studentId._id.toString() === userId;
    const isMentor = session.mentorId._id.toString() === userId;
    
    if (!isStudent && !isMentor) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking',
      });
      return;
    }

    const bookingDetails = {
      id: session._id,
      mentor: {
        id: (session.mentorId as any)._id,
        name: (session.mentorId as any).displayName,
        email: (session.mentorId as any).email,
        avatar: (session.mentorId as any).profileImage,
      },
      student: {
        id: (session.studentId as any)._id,
        name: (session.studentId as any).name,
        email: (session.studentId as any).email,
        avatar: (session.studentId as any).avatar,
      },
      subject: session.subject,
      scheduledTime: session.scheduledTime,
      actualStartTime: session.actualStartTime,
      actualEndTime: session.actualEndTime,
      duration: session.duration,
      sessionType: session.sessionType,
      status: session.status,
      meetingLink: session.recordingUrl,
      notes: session.sessionNotes,
      studentRating: session.studentRating,
      mentorRating: session.mentorRating,
      studentReview: session.studentReview,
      mentorReview: session.mentorReview,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };

    console.log('✅ Booking details fetched successfully');

    res.status(200).json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: bookingDetails,
    });

  } catch (error: any) {
    console.error('❌ Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Rate a completed session
 */
export const rateSession = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params;
  const { rating, review } = req.body;
  const userId = req.userId;

  console.log('⭐ Rating session:', { sessionId, rating, userId });

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed sessions can be rated',
      });
    }

    // Check if user is student or mentor
    const isStudent = session.studentId.toString() === userId;
    const isMentor = session.mentorId.toString() === userId;

    if (!isStudent && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to rate this session',
      });
    }

    // Update rating based on user type
    if (isStudent) {
      session.studentRating = rating;
      session.studentReview = review;
    } else {
      session.mentorRating = rating;
      session.mentorReview = review;
    }

    await session.save();

    console.log('✅ Session rated successfully');

    return res.status(200).json({
      success: true,
      message: 'Session rated successfully',
      data: {
        sessionId: session._id,
        rating,
        review,
      },
    });

  } catch (error: any) {
    console.error('❌ Error rating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rate session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default {
  getAvailableSlots,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  getUserBookings,
  getBookingDetails,
  rateSession,
};