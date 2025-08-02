// backend/src/controllers/booking.controller.ts - Enhanced with Data Sync
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import calComService from '../services/calcom.service';
import mentorScheduleSyncService from '../services/mentorScheduleSync.service';
import { notificationService } from '../services/booking.service';
import MentorProfileService from '../services/mentorProfile.service';

/**
 * Get available time slots with intelligent sync handling
 */
export const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const { mentorId, date } = req.body;
  
  console.log('📅 Fetching available slots with sync intelligence:', { mentorId, date });

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

    // Step 1: Check mentor profile exists
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

    // Step 2: Check sync status and sync if needed
    const syncStatus = mentorScheduleSyncService.getSyncStatus(mentorId);
    const shouldSync = !syncStatus.lastSyncTime || 
                      (Date.now() - syncStatus.lastSyncTime > 30 * 60 * 1000); // 30 minutes

    if (shouldSync && !syncStatus.syncInProgress) {
      console.log('🔄 Mentor needs sync, triggering background sync...');
      
      // Trigger background sync (non-blocking)
      mentorScheduleSyncService.syncMentorToCalCom(mentorId)
        .then(result => {
          console.log(`✅ Background sync completed for ${mentorId}:`, result.success);
        })
        .catch(error => {
          console.error(`❌ Background sync failed for ${mentorId}:`, error);
        });
    }

    // Step 3: Fetch slots from Cal.com (primary source)
    let availableSlots: any[] = [];
    let source = 'calcom';
    
    try {
      availableSlots = await calComService.getAvailableSlots(mentorId, date);
      console.log(`✅ Cal.com returned ${availableSlots.length} slots`);
      
    } catch (calcomError: any) {
      console.error('❌ Cal.com failed, attempting fallback:', calcomError.message);
      
      // Fallback: Generate from local schedule
      try {
        availableSlots = await generateFallbackSlots(mentorProfile, date);
        source = 'fallback';
        console.log(`✅ Fallback generated ${availableSlots.length} slots`);
        
      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        
        res.status(500).json({
          success: false,
          message: 'Unable to fetch available slots. Please try again later.',
          info: {
            type: 'service_unavailable',
            suggestion: 'Both Cal.com and fallback systems are unavailable'
          }
        });
        return;
      }
    }

    // Step 4: Filter out database conflicts (double-check)
    const finalSlots = await filterDatabaseConflicts(availableSlots, mentorId, date);

    console.log(`✅ Final available slots: ${finalSlots.length} (source: ${source})`);

    res.status(200).json({
      success: true,
      message: finalSlots.length > 0 ? 
        'Available slots retrieved successfully' : 
        'No available slots for this date',
      data: finalSlots,
      meta: {
        source,
        syncStatus: {
          lastSync: syncStatus.lastSyncTime,
          needsSync: shouldSync,
          conflicts: syncStatus.conflicts.length
        }
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
 * Create booking with comprehensive validation and sync checks
 */
export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { mentorId, timeSlot, subject, notes, paymentMethodId } = req.body;
  const studentId = req.userId;

  console.log('🎯 Creating booking with enhanced validation:', { 
    mentorId, 
    studentId, 
    timeSlot: timeSlot.id, 
    subject 
  });

  // Start database transaction for atomic operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Pre-flight validation
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

    // Step 2: Force sync check for this mentor
    console.log('🔄 Performing pre-booking sync check...');
    const syncResult = await mentorScheduleSyncService.forceSyncMentor(mentorId);
    
    if (!syncResult.success) {
      console.warn('⚠️ Sync failed but continuing with booking attempt');
    }

    // Step 3: Real-time slot availability check
    const isSlotAvailable = await verifySlotAvailability(mentorId, timeSlot);
    if (!isSlotAvailable) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Selected time slot is no longer available. Please select another slot.',
        code: 'SLOT_UNAVAILABLE'
      });
      return;
    }

    // Step 4: Get participant details
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

    // Step 5: Process payment (atomic)
    const paymentResult = await processPaymentSafely({
      amount: timeSlot.price,
      currency: 'USD',
      paymentMethodId,
      description: `Mentoring session: ${subject}`,
      metadata: { mentorId, studentId, sessionType: 'mentoring' }
    });

    if (!paymentResult.success) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Payment failed: ' + paymentResult.error,
      });
      return;
    }

    // Step 6: Create session record in database (within transaction)
    const sessionRecord = new Session({
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

    await sessionRecord.save({ session });

    console.log('✅ Session created in database:', sessionRecord._id);

    // Step 7: Create Cal.com booking (critical step)
    let calcomResult;
    let meetingUrl = '';
    let calcomBookingId = '';

    try {
      calcomResult = await calComService.createBooking({
        mentorId,
        studentId,
        timeSlot,
        subject,
        notes,
        studentEmail: student.email,
        studentName: `${student.firstName || student.name} ${student.lastName || ''}`.trim(),
        mentorEmail: mentor.email,
        mentorName: `${mentor.firstName} ${mentor.lastName}`,
        experienceLevel: req.body.experienceLevel,
        specificGoals: req.body.specificGoals
      });

      if (calcomResult.success && calcomResult.booking) {
        meetingUrl = calcomResult.meetingUrl || '';
        calcomBookingId = calcomResult.booking.id.toString();
        
        // Update session with Cal.com details
        sessionRecord.recordingUrl = meetingUrl;
        (sessionRecord as any).calendarEventId = calcomBookingId;
        (sessionRecord as any).meetingProvider = 'calcom';
        await sessionRecord.save({ session });

        console.log('✅ Cal.com booking created with Google Meet:', {
          calcomBookingId,
          hasGoogleMeetUrl: !!meetingUrl
        });
      } else {
        throw new Error(calcomResult.error || 'Cal.com booking failed');
      }

    } catch (calcomError: any) {
      console.error('❌ Critical: Cal.com booking failed:', calcomError.message);
      
      // For production: fail the booking if Cal.com fails
      await session.abortTransaction();
      
      // Refund payment
      if (paymentResult.paymentId) {
        await refundPayment(paymentResult.paymentId, timeSlot.price, 'Cal.com booking failed');
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create meeting. Your payment has been refunded. Please try again.',
        error: 'Meeting creation failed',
        code: 'CALCOM_BOOKING_FAILED'
      });
      return;
    }

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
        amount: `${timeSlot.price}`,
      });

      console.log('📧 Confirmation emails sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation emails (non-critical):', emailError);
      // Don't fail the booking for email issues
    }

    // Step 10: Update mentor sync status (commented out for development)
    // try {
    //   await mentorScheduleSyncService.forceSyncMentor(mentorId);
    // } catch (syncError) {
    //   console.warn('⚠️ Post-booking sync failed (non-critical):', syncError);
    // }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: sessionRecord._id,
        sessionId: sessionRecord._id,
        meetingLink: meetingUrl,
        calendarEventId: calcomBookingId,
        paymentId: paymentResult.paymentId,
        reminderSet: true,
        calcomCreated: true,
        syncStatus: 'updated'
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
 * Cancel booking with sync updates
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
    if ((sessionRecord as any).calendarEventId && (sessionRecord as any).meetingProvider === 'calcom') {
      try {
        await calComService.cancelBooking((sessionRecord as any).calendarEventId, reason);
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
    if (refundAmount > 0) {
      try {
        await refundPayment(`pay_${sessionRecord._id}`, refundAmount, reason || 'Session cancelled');
        console.log('💰 Refund processed');
      } catch (refundError) {
        console.error('⚠️ Refund processing failed:', refundError);
      }
    }

    await session.commitTransaction();

    // Trigger mentor sync (background)
    mentorScheduleSyncService.forceSyncMentor(sessionRecord.mentorId.toString())
      .catch(error => console.warn('⚠️ Post-cancellation sync failed:', error));

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

/**
 * Sync endpoint for manual mentor sync triggers
 */
export const syncMentorSchedule = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { mentorId } = req.params;
  const { force = false } = req.body;

  try {
    console.log(`🔄 Manual sync trigger for mentor ${mentorId} (force: ${force})`);

    const syncResult = await mentorScheduleSyncService.forceSyncMentor(mentorId);

    res.status(200).json({
      success: true,
      message: syncResult.success ? 'Mentor schedule synced successfully' : 'Sync failed',
      data: syncResult
    });

  } catch (error: any) {
    console.error('❌ Manual sync failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync mentor schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get sync status for a mentor
 */
export const getMentorSyncStatus = catchAsync(async (req: Request, res: Response) => {
  const { mentorId } = req.params;

  try {
    const syncStatus = mentorScheduleSyncService.getSyncStatus(mentorId);
    
    res.status(200).json({
      success: true,
      message: 'Sync status retrieved successfully',
      data: {
        mentorId,
        ...syncStatus,
        needsSync: !syncStatus.lastSyncTime || 
                  (Date.now() - syncStatus.lastSyncTime > 30 * 60 * 1000)
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Helper Functions

/**
 * Generate fallback slots from mentor's local schedule
 */
async function generateFallbackSlots(mentorProfile: any, date: string): Promise<any[]> {
  try {
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    console.log('📅 Generating fallback slots for:', { date, dayName });
    
    const daySchedule = mentorProfile.weeklySchedule?.[dayName];
    
    if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length === 0) {
      console.log('⚠️ No schedule found for', dayName);
      return [];
    }

    const slots: any[] = [];
    const now = new Date();
    const hourlyRate = mentorProfile.pricing?.hourlyRate || 75;
    const sessionLength = parseInt(mentorProfile.preferences?.sessionLength?.replace(' minutes', '') || '60');

    for (const block of daySchedule) {
      if (!block || !block.isAvailable || !block.startTime || !block.endTime) {
        continue;
      }
      
      try {
        const [startHour, startMinute] = block.startTime.split(':').map(Number);
        const [endHour, endMinute] = block.endTime.split(':').map(Number);
        
        const blockStart = new Date(requestedDate);
        blockStart.setHours(startHour, startMinute, 0, 0);
        
        const blockEnd = new Date(requestedDate);
        blockEnd.setHours(endHour, endMinute, 0, 0);
        
        let currentTime = new Date(blockStart);
        
        while (currentTime.getTime() + (sessionLength * 60 * 1000) <= blockEnd.getTime()) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + (sessionLength * 60 * 1000));
          
          // Skip past slots (add 2 hour buffer)
          if (slotStart <= new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
            currentTime = new Date(currentTime.getTime() + (sessionLength * 60 * 1000));
            continue;
          }
          
          const slot = {
            id: `fallback-${mentorProfile._id}-${slotStart.getTime()}`,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            date,
            isAvailable: true,
            price: hourlyRate,
            duration: sessionLength,
            sessionType: 'video' as const,
          };
          
          slots.push(slot);
          currentTime = new Date(currentTime.getTime() + (sessionLength * 60 * 1000));
        }
      } catch (blockError) {
        console.error('❌ Error processing block:', block, blockError);
        continue;
      }
    }
    
    console.log(`✅ Generated ${slots.length} fallback slots for ${dayName}`);
    return slots;
    
  } catch (error) {
    console.error('❌ Error generating fallback slots:', error);
    return [];
  }
}

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
 * Verify slot availability in real-time
 */
async function verifySlotAvailability(mentorId: string, timeSlot: any): Promise<boolean> {
  try {
    console.log('🔍 Verifying slot availability in real-time...');
    
    // Get fresh slots from Cal.com
    const availableSlots = await calComService.getAvailableSlots(mentorId, timeSlot.date);
    
    // Check if the specific slot is still available
    const slotFound = availableSlots.some(slot => 
      slot.startTime === timeSlot.startTime && slot.isAvailable
    );
    
    if (!slotFound) {
      console.log('❌ Slot not found in Cal.com availability');
      return false;
    }
    
    // Double-check database conflicts
    const slotStart = new Date(timeSlot.startTime);
    const slotEnd = new Date(timeSlot.endTime);
    
    const conflictingBooking = await Session.findOne({
      mentorId,
      scheduledTime: {
        $gte: new Date(slotStart.getTime() - 1000),
        $lt: slotEnd,
      },
      status: { $nin: ['cancelled'] },
    });
    
    if (conflictingBooking) {
      console.log('❌ Slot conflicts with existing database booking');
      return false;
    }
    
    console.log('✅ Slot verified as available');
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying slot availability:', error);
    return false;
  }
}

/**
 * Enhanced payment processing with better error handling
 */
async function processPaymentSafely(paymentData: {
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata: any;
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    console.log('💳 Processing payment safely:', {
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
    });

    // TODO: Replace with real payment processor (Stripe, PayPal, etc.)
    // For now, using mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 98% success rate
    const isSuccessful = Math.random() > 0.02;
    
    if (isSuccessful) {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Payment processed successfully:', paymentId);
      return { success: true, paymentId };
    } else {
      return { success: false, error: 'Payment was declined by your bank' };
    }
    
  } catch (error: any) {
    console.error('❌ Payment processing error:', error);
    return { success: false, error: 'Payment processing failed' };
  }
}

/**
 * Process refund
 */
async function refundPayment(
  paymentId: string, 
  amount: number, 
  reason: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    console.log('💰 Processing refund:', { paymentId, amount, reason });
    
    // TODO: Replace with real payment processor refund
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
      meetingLink: session.meetingUrl,
      calendarEventId: (session as any).calendarEventId,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: (session as any).amount || 75,
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
      price: (session as any).amount,
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
 * Reschedule a booking
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
    const isNewSlotAvailable = await verifySlotAvailability(session.mentorId.toString(), newTimeSlot);
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
        const rescheduleResult = await calComService.rescheduleBooking(
          (session as any).calendarEventId,
          newTimeSlot.startTime,
          newTimeSlot.endTime
        );
        
        if (!rescheduleResult.success) {
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

export default {
  getAvailableSlots,
  createBooking,
  getUserBookings,
  getBookingDetails,
  rescheduleBooking,
  cancelBooking,
  syncMentorSchedule,
  getMentorSyncStatus,
};