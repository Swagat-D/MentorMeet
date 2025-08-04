// backend/src/controllers/booking.controller.ts - Updated with Cal.com API v2 Integration
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import calComService from '../services/calcom.service';
import MentorProfileService from '../services/mentorProfile.service';
import { notificationService, paymentService } from '../services/booking.service';

/**
 * Get available time slots using Cal.com API v2
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

    // Get mentor profile with Cal.com integration
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
      calComUsername: mentorProfile.calComUsername,
      calComVerified: mentorProfile.calComVerified
    });

    // Validate Cal.com integration
    if (!mentorProfile.calComUsername || !mentorProfile.calComVerified) {
      res.status(400).json({
        success: false,
        message: 'Mentor has not set up Cal.com integration',
        info: {
          type: 'no_calcom_setup',
          suggestion: 'This mentor needs to complete their Cal.com setup'
        }
      });
      return;
    }

    // Get all available slots for all mentor's event types
    let allSlots: any[] = [];
    
    try {
      // Get mentor's event types from Cal.com
      const eventTypes = await calComService.getMentorEventTypes(mentorProfile.calComUsername);
      
      console.log(`📋 Event types response:`, JSON.stringify(eventTypes, null, 2));
      
      if (eventTypes.length === 0) {
        // Enhanced debugging for no event types
        console.warn(`⚠️ No event types found for ${mentorProfile.calComUsername}`);
        console.warn(`🔍 Mentor profile details:`, {
          calComUsername: mentorProfile.calComUsername,
          calComVerified: mentorProfile.calComVerified,
          storedEventTypes: mentorProfile.calComEventTypes
        });
        
        // Try to get raw Cal.com user info for debugging
        try {
          const debugInfo = await calComService.getRaw('/me');
          console.log(`🐛 Cal.com user info:`, debugInfo.data);
        } catch (debugError) {
          console.error(`🐛 Failed to get Cal.com user info:`, debugError);
        }
        
        res.status(200).json({
          success: true,
          message: 'No event types configured for this mentor',
          data: [],
          info: {
            type: 'no_event_types',
            suggestion: 'This mentor needs to configure event types in Cal.com',
            debug: {
              username: mentorProfile.calComUsername,
              verified: mentorProfile.calComVerified,
              storedEventTypes: mentorProfile.calComEventTypes?.length || 0
            }
          }
        });
        return;
      }

      console.log(`📋 Found ${eventTypes.length} event types for ${mentorProfile.calComUsername}`);
      console.log(`📋 Event types:`, eventTypes.map(et => ({ id: et.id, title: et.title, length: et.length })));

      // Fetch slots for each event type
      for (const eventType of eventTypes) {
        try {
          console.log(`🔍 Fetching slots for event type ${eventType.id} (${eventType.title})`);
          const slots = await calComService.getAvailableSlots(
            mentorProfile.calComUsername,
            eventType.id,
            date
          );
          
          console.log(`📊 Event type ${eventType.id} returned ${slots.length} slots`);
          allSlots.push(...slots);
        } catch (eventTypeError: any) {
          console.warn(`⚠️ Failed to fetch slots for event type ${eventType.id}:`, eventTypeError.message);
          // Continue with other event types
        }
      }

      console.log(`✅ Cal.com returned ${allSlots.length} total slots across all event types`);

    } catch (calcomError: any) {
      console.error('❌ Cal.com API failed:', calcomError.message);
      console.error('❌ Full error:', calcomError);
      
      res.status(500).json({
        success: false,
        message: 'Unable to fetch available slots from Cal.com. Please try again later.',
        info: {
          type: 'calcom_unavailable',
          suggestion: 'Cal.com service is temporarily unavailable',
          debug: {
            error: calcomError.message,
            username: mentorProfile.calComUsername
          }
        }
      });
      return;
    }

    // Filter out database conflicts (sessions already booked through our system)
    const finalSlots = await filterDatabaseConflicts(allSlots, mentorId, date);

    console.log(`✅ Final available slots: ${finalSlots.length} (after filtering conflicts)`);

    res.status(200).json({
      success: true,
      message: finalSlots.length > 0 ? 
        'Available slots retrieved successfully' : 
        'No available slots for this date',
      data: finalSlots,
      meta: {
        source: 'calcom_v2',
        mentorCalComUsername: mentorProfile.calComUsername,
        totalEventTypes: mentorProfile.calComEventTypes?.length || 0,
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
 * Create booking with payment-first flow and Cal.com integration
 */
export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { mentorId, timeSlot, subject, notes, paymentMethodId } = req.body;
  const studentId = req.userId;

  console.log('🎯 Creating booking with payment-first flow:', { 
    mentorId, 
    studentId, 
    timeSlot: timeSlot.id, 
    subject 
  });

  // Start database transaction for atomic operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Validate booking request
    const validationResult = await validateBookingRequest({
      mentorId,
      studentId,
      timeSlot,
      subject,
      paymentMethodId,
    });

    if (!validationResult.isValid) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: validationResult.message,
      });
      return;
    }

    // Step 2: Get participant details
    const [mentor, student] = await Promise.all([
      User.findById(mentorId).session(session),
      User.findById(studentId).session(session)
    ]);

    if (!mentor || !student) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Participant not found',
      });
      return;
    }

    // Step 3: Get mentor profile for Cal.com integration
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    if (!mentorProfile || !mentorProfile.calComUsername) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Mentor Cal.com integration not found',
      });
      return;
    }

    // Step 4: Process payment FIRST (payment-first flow)
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
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Payment failed: ' + paymentResult.error,
        code: 'PAYMENT_FAILED'
      });
      return;
    }

    console.log('✅ Payment processed successfully:', paymentResult.paymentId);

    // Step 5: Verify slot is still available (real-time check)
    const isSlotAvailable = await verifySlotAvailability(
      mentorProfile.calComUsername, 
      timeSlot
    );
    
    if (!isSlotAvailable) {
      await session.abortTransaction();
      
      // Refund payment since slot is no longer available
      if (paymentResult.paymentId) {
        await paymentService.refundPayment(paymentResult.paymentId, timeSlot.price);
      }
      
      res.status(400).json({
        success: false,
        message: 'Selected time slot is no longer available. Your payment has been refunded.',
        code: 'SLOT_UNAVAILABLE'
      });
      return;
    }

    // Step 6: Create Cal.com booking
    console.log('📝 Creating Cal.com booking...');
    let calcomResult;
    let meetingUrl = '';
    let calcomBookingUid = '';

    try {
      calcomResult = await calComService.createBooking({
        eventTypeId: timeSlot.eventTypeId,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        attendeeEmail: student.email,
        attendeeName: `${student.firstName || student.name} ${student.lastName || ''}`.trim(),
        notes: `Subject: ${subject}\n\nNotes: ${notes || 'No additional notes'}`,
        metadata: {
          mentorId,
          studentId,
          platform: 'MentorMatch',
          paymentId: paymentResult.paymentId
        }
      });

      if (calcomResult.success && calcomResult.booking) {
        meetingUrl = calcomResult.meetingUrl || '';
        calcomBookingUid = calcomResult.booking.uid || calcomResult.booking.id?.toString() || '';
        
        console.log('✅ Cal.com booking created:', {
          bookingUid: calcomBookingUid,
          hasGoogleMeetUrl: !!meetingUrl
        });
      } else {
        throw new Error(calcomResult.error || 'Cal.com booking failed');
      }

    } catch (calcomError: any) {
      console.error('❌ Critical: Cal.com booking failed:', calcomError.message);
      
      await session.abortTransaction();
      
      // Refund payment since Cal.com booking failed
      if (paymentResult.paymentId) {
        await paymentService.refundPayment(
          paymentResult.paymentId, 
          timeSlot.price
        );
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create meeting. Your payment has been refunded. Please try again.',
        error: 'Meeting creation failed',
        code: 'CALCOM_BOOKING_FAILED'
      });
      return;
    }

    // Step 7: Create session record in database (within transaction)
    const sessionRecord = new Session({
      studentId,
      mentorId,
      subject,
      scheduledTime: new Date(timeSlot.startTime),
      duration: timeSlot.duration,
      sessionType: 'video',
      status: 'confirmed',
      sessionNotes: notes || '',
      // Cal.com specific fields
      calComBookingId: calcomBookingUid,
      eventTypeId: timeSlot.eventTypeId,
      meetingUrl: meetingUrl,
      meetingProvider: 'calcom',
      // Payment fields
      price: timeSlot.price,
      currency: 'INR',
      paymentId: paymentResult.paymentId,
      paymentStatus: 'completed'
    });

    await sessionRecord.save({ session });

    console.log('✅ Session created in database:', sessionRecord._id);

    // Step 8: Commit transaction - all critical operations succeeded
    await session.commitTransaction();

    console.log('✅ Transaction committed - booking created successfully');

    // Step 9: Send notifications (non-critical, outside transaction)
    try {
      await notificationService.sendBookingConfirmation({
        sessionId: sessionRecord._id.toString(),
        mentorId: mentor._id.toString(),
        studentId: student._id.toString(),
        mentorEmail: mentor.email,
        studentEmail: student.email,
        mentorName: `${mentor.firstName} ${mentor.lastName}`,
        studentName: `${student.firstName || student.name} ${student.lastName || ''}`.trim(),
        subject: subject,
        scheduledTime: timeSlot.startTime,
        duration: timeSlot.duration,
        meetingLink: meetingUrl,
        sessionType: 'video',
        amount: `₹${timeSlot.price}`,
      });

      console.log('📧 Confirmation emails sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation emails (non-critical):', emailError);
      // Don't fail the booking for email issues
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: sessionRecord._id,
        sessionId: sessionRecord._id,
        meetingLink: meetingUrl,
        calComBookingUid: calcomBookingUid,
        paymentId: paymentResult.paymentId,
        reminderSet: true,
        calcomCreated: true,
        paymentProcessed: true
      },
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('❌ Booking creation failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Booking creation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    await session.endSession();
  }
});

/**
 * Cancel booking with Cal.com integration
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

    // Cancel Cal.com booking first
    if ((sessionRecord as any).calComBookingId) {
      try {
        await calComService.cancelBooking((sessionRecord as any).calComBookingId, reason);
        console.log('✅ Cal.com booking cancelled');
      } catch (calcomError) {
        console.error('⚠️ Failed to cancel Cal.com booking:', calcomError);
        // Continue with local cancellation even if Cal.com fails
      }
    }

    // Update session status
    sessionRecord.status = 'cancelled';
    sessionRecord.sessionNotes = `${sessionRecord.sessionNotes ? sessionRecord.sessionNotes + '\n\n' : ''}Cancelled by ${isStudent ? 'student' : 'mentor'}: ${reason || 'No reason provided'}`;
    await sessionRecord.save({ session });

    // Process refund
    const refundAmount = (sessionRecord as any).price || 0;
    let refundProcessed = false;
    
    if (refundAmount > 0 && (sessionRecord as any).paymentId) {
      try {
        const refundResult = await paymentService.refundPayment(
          (sessionRecord as any).paymentId, 
          refundAmount
        );
        refundProcessed = refundResult.success;
        console.log('💰 Refund processed:', refundProcessed);
      } catch (refundError) {
        console.error('⚠️ Refund processing failed:', refundError);
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
        calcomCancelled: true,
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

// Helper Functions

/**
 * Filter database conflicts
 */
async function filterDatabaseConflicts(slots: any[], mentorId: string, date: string): Promise<any[]> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingBookings = await Session.find({
      mentorId,
      scheduledTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $nin: ['cancelled'] },
    });
    
    console.log(`📋 Found ${existingBookings.length} existing bookings for ${date}`);
    
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
    console.error('❌ Error filtering database conflicts:', error);
    return slots;
  }
}

/**
 * Verify slot availability in real-time via Cal.com
 */
async function verifySlotAvailability(calComUsername: string, timeSlot: any): Promise<boolean> {
  try {
    console.log('🔍 Verifying slot availability in real-time via Cal.com...');
    
    // Get fresh slots from Cal.com
    const availableSlots = await calComService.getAvailableSlots(
      calComUsername, 
      timeSlot.eventTypeId, 
      timeSlot.date
    );
    
    // Check if the specific slot is still available
    const slotFound = availableSlots.some(slot => 
      slot.startTime === timeSlot.startTime && slot.isAvailable
    );
    
    if (!slotFound) {
      console.log('❌ Slot not found in Cal.com availability');
      return false;
    }
    
    console.log('✅ Slot verified as available via Cal.com');
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying slot availability:', error);
    return false; // Fail safe - if we can't verify, assume not available
  }
}

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
      meetingLink: session.meetingUrl || session.recordingUrl,
      calendarEventId: (session as any).calComBookingId || (session as any).calendarEventId,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: (session as any).price || (session as any).amount || 0,
      currency: (session as any).currency || 'INR',
      meetingProvider: session.meetingProvider || 'calcom',
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
      meetingLink: session.meetingUrl || session.recordingUrl,
      notes: session.sessionNotes,
      price: (session as any).price || (session as any).amount || 0,
      currency: (session as any).currency || 'INR',
      meetingProvider: session.meetingProvider || 'calcom',
      calendarEventId: (session as any).calComBookingId || (session as any).calendarEventId,
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

export default {
  getAvailableSlots,
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingDetails,
};