// backend/src/controllers/booking.controller.ts - Updated with Cal.com Integration
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import calComService from '../services/calcom.service';
import { notificationService } from '../services/booking.service';
import { runBookingDebug } from '../utils/bookingDebug';
import MentorProfileService from '../services/mentorProfile.service';

// Remove the model creation - we'll use the service instead
// const mentorProfileSchema = new mongoose.Schema({}, { strict: false });
// const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema, 'mentorProfiles');

/**
 * Get available time slots for a mentor on a specific date using Cal.com
 */
export const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { mentorId, date } = req.body;
  
  console.log('📅 Fetching available slots via Cal.com:', { mentorId, date });

  if (!mentorId || !date) {
    res.status(400).json({
      success: false,
      message: 'Mentor ID and date are required',
    });
    return;
  }

  try {
    // Validate date format
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    // Check if date is in the past (but don't throw error, just return empty slots)
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

    // Find the user in users collection
    const user = await User.findById(mentorId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
      return;
    }

    // Find the mentor profile
    const mentorProfile = await MentorProfileService.findById(mentorId);
    if (!mentorProfile) {
      res.status(404).json({
        success: false,
        message: 'Mentor profile not found',
      });
      return;
    }

    // Get available slots from Cal.com
    const availableSlots = await calComService.getAvailableSlots(mentorId, date);

    // Filter out already booked slots from our database
    const finalSlots = await filterBookedSlots(availableSlots, mentorId, date);

    console.log('✅ Final available slots:', finalSlots.length);

    res.status(200).json({
      success: true,
      message: finalSlots.length > 0 ? 'Available slots retrieved successfully' : 'No available slots for this date',
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
 * Create a new booking with Cal.com integration
 */
export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { mentorId, timeSlot, subject, notes, paymentMethodId } = req.body;
  const studentId = req.userId;

  console.log('🎯 Creating booking with Cal.com:', { mentorId, studentId, timeSlot: timeSlot.id, subject });

  try {
    // Validate the booking request
    const validationResult = await validateBooking({
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

    // Double-check slot availability
    const isSlotStillAvailable = await checkSlotAvailability(mentorId, timeSlot);
    if (!isSlotStillAvailable) {
      res.status(400).json({
        success: false,
        message: 'Selected time slot is no longer available. Please select another slot.',
      });
      return;
    }

    // Get mentor and student details
    const [mentor, student] = await Promise.all([
      User.findById(mentorId),
      User.findById(studentId)
    ]);

    if (!mentor || !student) {
      res.status(400).json({
        success: false,
        message: 'Mentor or student not found',
      });
      return;
    }

    // Process payment first (mock implementation)
    const paymentResult = await processPayment({
      amount: timeSlot.price,
      currency: 'USD',
      paymentMethodId,
      description: `Mentoring session: ${subject}`,
      metadata: { mentorId, studentId, sessionType: 'mentoring' }
    });

    if (!paymentResult.success) {
      res.status(400).json({
        success: false,
        message: 'Payment failed: ' + paymentResult.error,
      });
      return;
    }

    // Create session record first
    const session = await Session.create({
      studentId,
      mentorId,
      subject,
      scheduledTime: new Date(timeSlot.startTime),
      duration: timeSlot.duration,
      sessionType: 'video',
      status: 'confirmed',
      sessionNotes: notes || '',
      price: timeSlot.price,
    });

    console.log('✅ Session created in database:', session._id);

    // Create Cal.com booking
    const calcomResult = await calComService.createBooking({
      mentorId,
      studentId,
      timeSlot,
      subject,
      notes,
      studentEmail: student.email,
      studentName: `${student.firstName} ${student.lastName}`,
      mentorEmail: mentor.email,
      mentorName: `${mentor.firstName} ${mentor.lastName}`,
    });

    let meetingUrl = '';
    let calcomBookingId = '';

    if (calcomResult.success && calcomResult.booking) {
      meetingUrl = calcomResult.meetingUrl || '';
      calcomBookingId = calcomResult.booking.id.toString();
      
      // Update session with Cal.com booking details
      session.recordingUrl = meetingUrl;
      (session as any).calendarEventId = calcomBookingId;
      (session as any).meetingProvider = 'calcom';
      await session.save();

      console.log('✅ Cal.com booking created:', calcomBookingId);
    } else {
      console.warn('⚠️ Cal.com booking failed, using fallback:', calcomResult.error);
      meetingUrl = generateFallbackMeetingUrl();
      
      session.recordingUrl = meetingUrl;
      (session as any).meetingProvider = 'fallback';
      await session.save();
    }

    // Send notifications
    try {
      await notificationService.sendBookingConfirmation({
        sessionId: session._id.toString(),
        mentorId: mentor._id.toString(),
        studentId: student._id.toString(),
        mentorEmail: mentor.email,
        studentEmail: student.email,
        mentorName: `${mentor.firstName} ${mentor.lastName}`,
        studentName: `${student.firstName} ${student.lastName}`,
        subject: subject,
        scheduledTime: timeSlot.startTime,
        duration: timeSlot.duration,
        meetingLink: meetingUrl,
        sessionType: 'video',
        amount: `$${timeSlot.price}`,
      });

      console.log('📧 Confirmation emails sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation emails:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: session._id,
        sessionId: session._id,
        meetingLink: meetingUrl,
        calendarEventId: calcomBookingId,
        paymentId: paymentResult.paymentId,
        reminderSet: true,
        calcomCreated: calcomResult.success,
      },
    });

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
 * Cancel a booking and associated Cal.com booking
 */
export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
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
        message: 'You are not authorized to cancel this booking',
      });
      return;
    }

    // Cancel Cal.com booking if exists
    if ((session as any).calendarEventId && (session as any).meetingProvider === 'calcom') {
      try {
        await calComService.cancelBooking((session as any).calendarEventId, reason);
        console.log('✅ Cal.com booking cancelled');
      } catch (calcomError) {
        console.error('⚠️ Failed to cancel Cal.com booking:', calcomError);
      }
    }

    // Update session status
    session.status = 'cancelled';
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Cancelled by ${isStudent ? 'student' : 'mentor'}: ${reason || 'No reason provided'}`;
    await session.save();

    // Process refund (mock implementation)
    const refundAmount = (session as any).price || 0;
    if (refundAmount > 0) {
      try {
        await processRefund({
          originalPaymentId: `pay_${session._id}`,
          amount: refundAmount,
          reason: reason || 'Session cancelled'
        });
        console.log('💰 Refund processed');
      } catch (refundError) {
        console.error('⚠️ Refund processing failed:', refundError);
      }
    }

    // Send cancellation notifications
    try {
      await notificationService.sendCancellationNotification({
        sessionId: session._id.toString(),
        mentorEmail: (session.mentorId as any).email,
        studentEmail: (session.studentId as any).email,
        mentorName: `${(session.mentorId as any).firstName} ${(session.mentorId as any).lastName}`,
        studentName: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
        subject: session.subject,
        scheduledTime: session.scheduledTime.toISOString(),
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
        sessionId: session._id,
        refundEligible: refundAmount > 0,
        refundAmount,
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
 * Reschedule a booking with Cal.com
 */
export const rescheduleBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { newTimeSlot } = req.body;
  const userId = req.userId;

  try {
    const session = await Session.findById(bookingId);

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    const isStudent = session.studentId.toString() === userId;
    const isMentor = session.mentorId.toString() === userId;
    
    if (!isStudent && !isMentor) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to reschedule this booking',
      });
      return;
    }

    // Check if new slot is available
    const isNewSlotAvailable = await checkSlotAvailability(session.mentorId.toString(), newTimeSlot);
    if (!isNewSlotAvailable) {
      res.status(400).json({
        success: false,
        message: 'Selected new time slot is not available',
      });
      return;
    }

    const oldScheduledTime = session.scheduledTime;

    // Reschedule Cal.com booking if exists
    if ((session as any).calendarEventId && (session as any).meetingProvider === 'calcom') {
      try {
        const rescheduleSuccess = await calComService.rescheduleBooking(
          (session as any).calendarEventId,
          newTimeSlot.startTime,
          newTimeSlot.endTime
        );
        
        if (!rescheduleSuccess) {
          throw new Error('Cal.com reschedule failed');
        }
        
        console.log('✅ Cal.com booking rescheduled');
      } catch (calcomError) {
        console.error('⚠️ Failed to reschedule Cal.com booking:', calcomError);
        res.status(400).json({
          success: false,
          message: 'Failed to reschedule with Cal.com. Please try again.',
        });
        return;
      }
    }

    // Update session details
    session.scheduledTime = new Date(newTimeSlot.startTime);
    session.duration = newTimeSlot.duration;
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Rescheduled from ${oldScheduledTime.toISOString()} to ${newTimeSlot.startTime} by ${isStudent ? 'student' : 'mentor'}`;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        sessionId: session._id,
        oldScheduledTime: oldScheduledTime,
        newScheduledTime: session.scheduledTime,
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
      meetingLink: session.recordingUrl,
      notes: session.sessionNotes,
      price: (session as any).price,
      meetingProvider: (session as any).meetingProvider,
      calendarEventId: (session as any).calendarEventId,
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
      meetingLink: session.recordingUrl,
      calendarEventId: (session as any).calendarEventId,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: (session as any).price || 75,
      meetingProvider: (session as any).meetingProvider,
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

// Helper Functions

/**
 * Filter out already booked slots from database
 */
async function filterBookedSlots(slots: any[], mentorId: string, date: string): Promise<any[]> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get existing bookings for the mentor on this date
    const existingBookings = await Session.find({
      mentorId,
      scheduledTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $nin: ['cancelled'] },
    });
    
    console.log(`📋 Found ${existingBookings.length} existing bookings for ${date}`);
    
    // Filter out conflicting slots
    return slots.filter(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.scheduledTime);
        const bookingEnd = new Date(booking.scheduledTime.getTime() + (booking.duration * 60 * 1000));
        
        const overlap = (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
        
        if (overlap) {
          console.log(`❌ Slot conflict found: ${slot.startTime} overlaps with booking at ${booking.scheduledTime}`);
        }
        
        return overlap;
      });
      
      return !hasConflict;
    });
    
  } catch (error: any) {
    console.error('❌ Error filtering booked slots:', error);
    return slots;
  }
}

/**
 * Check if a specific slot is still available
 */
async function checkSlotAvailability(mentorId: string, timeSlot: any): Promise<boolean> {
  try {
    const slotStart = new Date(timeSlot.startTime);
    const slotEnd = new Date(timeSlot.endTime);
    
    const conflictingBooking = await Session.findOne({
      mentorId,
      scheduledTime: {
        $gte: new Date(slotStart.getTime() - 1000), // 1 second buffer
        $lt: slotEnd,
      },
      status: { $nin: ['cancelled'] },
    });
    
    return !conflictingBooking;
  } catch (error) {
    console.error('❌ Error checking slot availability:', error);
    return false;
  }
}

/**
 * Generate fallback meeting URL
 */
function generateFallbackMeetingUrl(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i === 3 || i === 7) {
      code += '-';
    } else {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return `https://meet.google.com/${code}`;
}

/**
 * Process payment (mock implementation)
 */
async function processPayment(paymentData: {
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata: any;
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    console.log('💳 Processing payment:', paymentData.amount, paymentData.currency);
    
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    const isSuccessful = Math.random() > 0.05;
    
    if (isSuccessful) {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Payment processed successfully:', paymentId);
      return { success: true, paymentId };
    } else {
      return { success: false, error: 'Payment was declined' };
    }
    
  } catch (error: any) {
    console.error('❌ Payment processing error:', error);
    return { success: false, error: 'Payment processing failed' };
  }
}

/**
 * Process refund (mock implementation)
 */
async function processRefund(refundData: {
  originalPaymentId: string;
  amount: number;
  reason: string;
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    console.log('💰 Processing refund:', refundData);
    
    // Mock refund processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('✅ Refund processed:', refundId);
    
    return { success: true, refundId };
    
  } catch (error: any) {
    console.error('❌ Refund processing error:', error);
    return { success: false, error: 'Refund processing failed' };
  }
}

/**
 * Validate booking request
 */
async function validateBooking(bookingData: any): Promise<{ isValid: boolean; message: string }> {
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

/**
 * Debug endpoint for troubleshooting booking issues
 */
export const debugBooking = catchAsync(async (req: Request, res: Response) => {
  const { mentorId } = req.params;
  const { date } = req.query;

  try {
    const debugInfo = await runBookingDebug(mentorId, date as string);
    
    res.status(200).json({
      success: true,
      message: 'Debug information generated',
      data: debugInfo,
    });

  } catch (error: any) {
    console.error('❌ Debug endpoint failed:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default {
  getAvailableSlots,
  createBooking,
  getUserBookings,
  getBookingDetails,
  rescheduleBooking,
  cancelBooking,
  debugBooking,
};