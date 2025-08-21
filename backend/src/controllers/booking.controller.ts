// backend/src/controllers/booking.controller.ts - Updated for Manual Booking Flow
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import MentorProfileService from '../services/mentorProfile.service';
import ScheduleGenerationService from '../services/scheduleGeneration.service';
import { notificationService, paymentService } from '../services/booking.service';

/**
 * Get available time slots using mentor's manual schedule
 */
export const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { mentorId, date } = req.body;
  
  console.log('📅 Fetching available slots from mentor schedule:', { mentorId, date });

  if (!mentorId || !date) {
    res.status(400).json({
      success: false,
      message: 'Mentor ID and date are required',
    });
    return;
  }

  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid mentor ID format',
      });
      return;
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    requestedDate.setHours(0, 0, 0, 0);
    
    if (requestedDate < today) {
      res.status(200).json({
        success: true,
        message: 'Past dates are not available for booking',
        data: [],
        info: {
          type: 'past_date',
          suggestion: 'Please select tomorrow or a future date for booking'
        }
      });
      return;
    }

    // Get mentor profile
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    if (!mentorProfile) {
      res.status(404).json({
        success: false,
        message: 'Mentor profile not found',
        info: {
          type: 'no_profile',
          suggestion: 'This mentor needs to complete their profile setup'
        }
      });
      return;
    }

    console.log('✅ Mentor profile found:', {
      profileId: mentorProfile._id,
      displayName: mentorProfile.displayName,
      hasSchedule: !!mentorProfile.weeklySchedule
    });

    // Check if mentor has schedule configured
    if (!mentorProfile.weeklySchedule) {
      res.status(400).json({
        success: false,
        message: 'Mentor has not configured their availability schedule',
        info: {
          type: 'no_schedule',
          suggestion: 'This mentor needs to set up their weekly availability'
        }
      });
      return;
    }

    // Generate available slots from mentor's schedule
    const availableSlots = await ScheduleGenerationService.generateAvailableSlots(mentorId, date);

    console.log(`✅ Generated ${availableSlots.length} available slots`);

    if (availableSlots.length === 0) {
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
      res.status(200).json({
        success: true,
        message: `No available slots for ${dayName}`,
        data: [],
        info: {
          type: 'no_slots_available',
          suggestion: 'Try selecting a different date or check the mentor\'s availability schedule'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: availableSlots,
      meta: {
        source: 'manual_schedule',
        mentorDisplayName: mentorProfile.displayName,
        totalSlots: availableSlots.length,
        fetchedAt: new Date().toISOString()
      }
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
 * Create booking with payment-first flow (manual)
 */
export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { mentorId, timeSlot, subject, notes, paymentMethodId } = req.body;
  const studentId = req.userId;

  console.log('🎯 Creating manual booking:', { 
    mentorId, 
    studentId, 
    timeSlot: timeSlot.id, 
    subject 
  });

  // Start database transaction for atomic operations
  try {
  // Step 1: Validate booking request (no session needed)
  const validationResult = await validateBookingRequest({
    mentorId,
    studentId,
    timeSlot,
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

  // Step 2: Get participant details (no session needed)
  const [mentor, student] = await Promise.all([
    User.findById(mentorId),
    User.findById(studentId)
  ]);

  if (!mentor || !student) {
    res.status(400).json({
      success: false,
      message: 'Participant not found',
    });
    return;
  }

  // Step 3: Verify slot is still available
  const isSlotAvailable = await ScheduleGenerationService.isSlotAvailable(
    mentorId,
    timeSlot.startTime,
    timeSlot.duration
  );
  
  if (!isSlotAvailable) {
    res.status(400).json({
      success: false,
      message: 'Selected time slot is no longer available. Please select another time.',
      code: 'SLOT_UNAVAILABLE'
    });
    return;
  }

  // Step 4: Process payment
  console.log('💳 Processing payment before booking creation...');
  const paymentResult = await paymentService.processPayment({
    amount: timeSlot.price,
    currency: 'INR',
    paymentMethodId,
    description: `Mentoring session: ${subject}`,
    metadata: { 
      mentorId, 
      studentId, 
      sessionType: 'mentoring',
      timeSlot: timeSlot.startTime
    }
  });

  if (!paymentResult.success) {
    res.status(400).json({
      success: false,
      message: 'Payment failed: ' + paymentResult.error,
      code: 'PAYMENT_FAILED'
    });
    return;
  }

  console.log('✅ Payment processed successfully:', paymentResult.paymentId);

  // Step 5: Create session record (no transaction)
  const scheduledTime = new Date(timeSlot.startTime);
  const autoDeclineAt = new Date(scheduledTime.getTime() - (2 * 60 * 60 * 1000));

  const sessionRecord = new Session({
    studentId,
    mentorId,
    subject,
    scheduledTime,
    duration: timeSlot.duration,
    sessionType: 'video',
    status: 'pending_mentor_acceptance',
    sessionNotes: notes || '',
    autoDeclineAt, // Explicitly set autoDeclineAt
    
    // Manual booking specific fields
    slotId: timeSlot.slotId,
    bookingSource: 'manual',
    
    // Payment fields
    price: timeSlot.price,
    currency: 'INR',
    paymentId: paymentResult.paymentId,
    paymentStatus: 'completed'
  });

  await sessionRecord.save(); // Save without transaction

  console.log('✅ Session created in database:', sessionRecord._id);

  // Rest of your code for notifications...
} catch (error: any) {
  console.error('❌ Booking creation failed:', error);
  res.status(500).json({
    success: false,
    message: 'Booking creation failed',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
});

/**
 * Cancel booking
 */
export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  const userId = req.userId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sessionRecord = await Session.findById(bookingId)
      .populate('studentId', 'firstName lastName email')
      .populate('mentorId', 'firstName lastName email')
      .session(session);

    if (!sessionRecord) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    const isStudent = sessionRecord.studentId._id.toString() === userId;
    const isMentor = sessionRecord.mentorId._id.toString() === userId;
    
    if (!isStudent && !isMentor) {
      await session.abortTransaction();
      res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking',
      });
      return;
    }

    // Update session status
    sessionRecord.status = 'cancelled';
    sessionRecord.cancellationReason = reason || 'No reason provided';
    sessionRecord.cancelledBy = isStudent ? 'student' : 'mentor';
    sessionRecord.cancelledAt = new Date();
    await sessionRecord.save({ session });

    // Process refund
    const refundAmount = sessionRecord.price || 0;
    let refundProcessed = false;
    
    if (refundAmount > 0 && sessionRecord.paymentId) {
      try {
        const refundResult = await paymentService.refundPayment(
          sessionRecord.paymentId, 
          refundAmount
        );
        refundProcessed = refundResult.success;
        
        if (refundProcessed && refundResult.paymentId) {
          sessionRecord.refundId = refundResult.paymentId;
          sessionRecord.refundStatus = 'processed';
          sessionRecord.paymentStatus = 'refunded';
          await sessionRecord.save({ session });
        }
        
        console.log('💰 Refund processed:', refundProcessed);
      } catch (refundError) {
        console.error('⚠️ Refund processing failed:', refundError);
        sessionRecord.refundStatus = 'failed';
        await sessionRecord.save({ session });
      }
    }

    await session.commitTransaction();

    // Send notifications (non-critical)
    try {
      await notificationService.sendCancellationNotification({
        sessionId: sessionRecord._id.toString(),
        mentorEmail: (sessionRecord.mentorId as any).email,
        studentEmail: (sessionRecord.studentId as any).email,
        mentorName: `${(sessionRecord.mentorId as any).firstName} ${(sessionRecord.mentorId as any).lastName}`,
        studentName: `${(sessionRecord.studentId as any).firstName} ${(sessionRecord.studentId as any).lastName}`,
        subject: sessionRecord.subject,
        scheduledTime: sessionRecord.scheduledTime.toISOString(),
        cancelledBy: isStudent ? 'student' : 'mentor',
        reason: reason || 'No reason provided',
        refundAmount,
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send cancellation emails:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        sessionId: sessionRecord._id,
        refundEligible: refundAmount > 0,
        refundAmount,
        refundProcessed,
      },
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('❌ Booking cancellation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Booking cancellation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    await session.endSession();
  }
});

/**
 * Get user's bookings
 */
export const getUserBookings = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { status, page = 1, limit = 10 } = req.query;

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
      } else if (status === 'pending') {
        query.status = 'pending_mentor_acceptance';
      } else if (status === 'confirmed') {
        query.status = 'confirmed';
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('studentId', 'firstName lastName email avatar')
        .populate('mentorId', 'firstName lastName email avatar')
        .sort({ scheduledTime: -1 })
        .skip(skip)
        .limit(limitNum),
      Session.countDocuments(query)
    ]);

    const formattedSessions = sessions.map(session => ({
      id: session._id,
      mentor: {
        id: (session.mentorId as any)._id,
        name: `${(session.mentorId as any).firstName} ${(session.mentorId as any).lastName}`,
        email: (session.mentorId as any).email,
        avatar: (session.mentorId as any).avatar,
      },
      student: {
        id: (session.studentId as any)._id,
        name: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
        email: (session.studentId as any).email,
        avatar: (session.studentId as any).avatar,
      },
      subject: session.subject,
      date: session.scheduledTime,
      duration: session.duration,
      sessionType: {
        type: 'video',
        duration: session.duration,
      },
      status: session.status,
      meetingLink: session.meetingUrl,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: session.price || 0,
      currency: session.currency || 'INR',
      meetingProvider: session.meetingProvider,
      autoDeclineAt: session.autoDeclineAt,
      mentorAcceptedAt: session.mentorAcceptedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));

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

  try {
    const session = await Session.findById(bookingId)
      .populate('studentId', 'firstName lastName email')
      .populate('mentorId', 'firstName lastName email');

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

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
        name: `${(session.mentorId as any).firstName} ${(session.mentorId as any).lastName}`,
        email: (session.mentorId as any).email,
      },
      student: {
        id: (session.studentId as any)._id,
        name: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
        email: (session.studentId as any).email,
      },
      subject: session.subject,
      scheduledTime: session.scheduledTime,
      duration: session.duration,
      sessionType: session.sessionType,
      status: session.status,
      meetingLink: session.meetingUrl,
      notes: session.sessionNotes,
      price: session.price || 0,
      currency: session.currency || 'INR',
      meetingProvider: session.meetingProvider,
      autoDeclineAt: session.autoDeclineAt,
      mentorAcceptedAt: session.mentorAcceptedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };

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

// Helper Functions

/**
 * Enhanced booking validation
 */
async function validateBookingRequest(bookingData: any): Promise<{ isValid: boolean; message: string }> {
  try {
    const { mentorId, studentId, timeSlot, subject, paymentMethodId } = bookingData;
    
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return { isValid: false, message: 'Mentor not found' };
    }
    
    const student = await User.findById(studentId);
    if (!student) {
      return { isValid: false, message: 'Student not found' };
    }
    
    if (!subject?.trim()) {
      return { isValid: false, message: 'Subject is required' };
    }
    
    if (subject.trim().length < 3) {
      return { isValid: false, message: 'Subject must be at least 3 characters' };
    }
    
    if (!paymentMethodId) {
      return { isValid: false, message: 'Payment method is required' };
    }
    
    // Check if the time slot is in the future
    const slotTime = new Date(timeSlot.startTime);
    const now = new Date();
    
    if (slotTime <= now) {
      return { isValid: false, message: 'Selected time slot is in the past' };
    }
    
    // Check minimum advance booking time (2 hours)
    const timeDiff = slotTime.getTime() - now.getTime();
    const hoursInAdvance = timeDiff / (1000 * 60 * 60);
    
    if (hoursInAdvance < 2) {
      return { isValid: false, message: 'Bookings must be made at least 2 hours in advance' };
    }
    
    return { isValid: true, message: 'Validation successful' };
    
  } catch (error: any) {
    return { isValid: false, message: 'Validation failed due to server error' };
  }
}

export default {
  getAvailableSlots,
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingDetails,
};