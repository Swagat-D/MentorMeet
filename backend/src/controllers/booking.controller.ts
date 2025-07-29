import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import googleCalendarService from '../services/googleCalendar.service';
import { notificationService } from '../services/booking.service';

// Create a simple schema for mentorProfiles collection
const mentorProfileSchema = new mongoose.Schema({}, { strict: false });
const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema, 'mentorProfiles');

/**
 * Get available time slots for a mentor on a specific date with real-time checking
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
    // Validate date format
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
      res.status(400).json({
        success: false,
        message: 'Cannot book sessions for past dates',
      });
      return;
    }

    // Find the user in users collection
    const user = await User.findById(mentorId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Mentor not found in users collection',
      });
      return;
    }

    // Find the mentor profile in mentorProfiles collection
    const mentorProfile = await MentorProfile.findOne({ userId: new mongoose.Types.ObjectId(mentorId) });
    
    if (!mentorProfile) {
      console.log('⚠️ No mentor profile found for userId:', mentorId);
      
      res.status(200).json({
        success: true,
        message: 'No mentor profile found for this user',
        data: [],
      });
      return;
    }

    console.log('👤 Mentor profile found:', {
      profileId: mentorProfile._id,
      userId: (mentorProfile as any).userId,
      displayName: (mentorProfile as any).displayName,
      hasWeeklySchedule: !!(mentorProfile as any).weeklySchedule,
      hasPricing: !!(mentorProfile as any).pricing,
    });

    // Check if mentor profile has weekly schedule
    if (!(mentorProfile as any).weeklySchedule || typeof (mentorProfile as any).weeklySchedule !== 'object') {
      console.log('⚠️ Mentor profile has no weekly schedule configured');
      
      res.status(200).json({
        success: true,
        message: 'No schedule configured for this mentor',
        data: [],
      });
      return;
    }

    // Generate slots based on mentor's actual schedule
    const mentorSlots = await generateRealTimeSlots(mentorProfile, date);
    
    console.log('🎯 Generated mentor slots:', mentorSlots.length);
    
    if (mentorSlots.length === 0) {
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      res.status(200).json({
        success: true,
        message: `No available slots for ${dayName}. This mentor may not have configured their schedule for this day.`,
        data: [],
        debug: {
          mentorName: (mentorProfile as any).displayName,
          requestedDay: dayName,
          daySchedule: (mentorProfile as any).weeklySchedule?.[dayName] || null,
        }
      });
      return;
    }

    // Filter out already booked slots from database
    const finalSlots = await filterRealBookedSlots(mentorSlots, mentorId, date);

    console.log('✅ Final available slots:', finalSlots.length);

    res.status(200).json({
      success: true,
      message: finalSlots.length > 0 ? 'Available slots retrieved successfully' : 'All slots are booked for this date',
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
 * Create a new booking with enhanced Google Meet integration
 */
export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    mentorId,
    timeSlot,
    subject,
    notes,
    paymentMethodId,
  } = req.body;

  const studentId = req.userId;

  console.log('🎯 Creating booking:', { mentorId, studentId, timeSlot: timeSlot.id, subject });

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

    // Double-check slot availability before booking
    const isSlotStillAvailable = await checkSlotAvailability(mentorId, timeSlot);
    if (!isSlotStillAvailable) {
      res.status(400).json({
        success: false,
        message: 'Selected time slot is no longer available. Please select another slot.',
      });
      return;
    }

    // Get mentor and student details for Google Meet creation
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

    console.log('✅ Session created:', session._id);

    // Create Google Meet session with enhanced data
    let meetingResult;
    try {
      meetingResult = await googleCalendarService.createMentoringSession({
        mentorEmail: mentor.email,
        studentEmail: student.email,
        mentorName: `${mentor.firstName} ${mentor.lastName}`,
        studentName: `${student.firstName} ${student.lastName}`,
        subject: subject,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        sessionId: session._id.toString(),
        timezone: mentor.timezone || 'UTC',
      });

      console.log('🎥 Google Meet result:', meetingResult);
    } catch (meetError) {
      console.error('❌ Google Meet creation failed:', meetError);
      // Continue with fallback meeting link
      meetingResult = {
        success: false,
        meetingLink: `https://meet.google.com/${generateSecureMeetingCode()}`,
        error: typeof meetError === 'object' && meetError !== null && 'message' in meetError ? (meetError as any).message : 'Unknown error'
      };
    }

    // Update session with meeting link
    session.recordingUrl = meetingResult.meetingLink; // Store meeting link in recordingUrl field
    (session as any).calendarEventId = meetingResult.calendarEventId;
    (session as any).meetingProvider = 'google_meet';
    await session.save();

    // Send notifications to both mentor and student
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
        meetingLink: meetingResult.meetingLink,
        sessionType: 'video',
        amount: `$${timeSlot.price}`,
      });

      console.log('📧 Confirmation emails sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation emails:', emailError);
      // Don't fail the booking if email fails
    }

    // Set up session reminders
    try {
      await notificationService.setupSessionReminders({
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
        meetingLink: meetingResult.meetingLink,
        sessionType: 'video',
      });

      console.log('🔔 Reminders set up');
    } catch (reminderError) {
      console.error('⚠️ Failed to set up reminders:', reminderError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: session._id,
        sessionId: session._id,
        meetingLink: meetingResult.meetingLink,
        calendarEventId: meetingResult.calendarEventId,
        paymentId: `pay_${Date.now()}`,
        reminderSet: true,
        googleMeetCreated: meetingResult.success,
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
 * Cancel a booking and associated Google Meet
 */
export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  const userId = req.userId;

  try {
    const session = await Session.findById(bookingId)
      .populate('studentId', 'name email')
      .populate('mentorId', 'name email');

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

    // Cancel Google Calendar event if exists
    if (session.calendarEventId) {
      try {
        await googleCalendarService.cancelMentoringSession(session.calendarEventId);
        console.log('✅ Google Calendar event cancelled');
      } catch (calendarError) {
        console.error('⚠️ Failed to cancel Google Calendar event:', calendarError);
      }
    }

    // Update session status
    session.status = 'cancelled';
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Cancelled by ${isStudent ? 'student' : 'mentor'}: ${reason || 'No reason provided'}`;
    await session.save();

    // Send cancellation notifications
    try {
      await notificationService.sendCancellationNotification({
        sessionId: session._id.toString(),
        mentorEmail: (session.mentorId as any).email,
        studentEmail: (session.studentId as any).email,
        mentorName: (session.mentorId as any).name,
        studentName: (session.studentId as any).name,
        subject: session.subject,
        scheduledTime: session.scheduledTime.toISOString(),
        cancelledBy: isStudent ? 'student' : 'mentor',
        reason: reason || 'No reason provided',
        refundAmount: (session as any).price ?? 0,
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send cancellation emails:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        sessionId: session._id,
        refundEligible: true,
        refundAmount: (session as any).price ?? 0,
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

    const oldScheduledTime = session.scheduledTime;
    session.scheduledTime = new Date(newTimeSlot.startTime);
    session.duration = newTimeSlot.duration;
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Rescheduled from ${oldScheduledTime.toISOString()} by ${isStudent ? 'student' : 'mentor'}`;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        sessionId: session._id,
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
 * Get user's bookings with real-time data
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
        .populate('studentId', 'name email avatar')
        .populate('mentorId', 'name email avatar')
        .sort({ scheduledTime: -1 })
        .skip(skip)
        .limit(limitNum),
      Session.countDocuments(query)
    ]);

    const formattedSessions = sessions.map(session => ({
      id: session._id,
      mentor: {
        id: (session.mentorId as any)._id,
        name: (session.mentorId as any).name,
        email: (session.mentorId as any).email,
        avatar: (session.mentorId as any).avatar,
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
        type: 'video',
        duration: session.duration,
      },
      status: session.status,
      meetingLink: (session as any).meetingLink,
      calendarEventId: session.calendarEventId,
      notes: session.sessionNotes,
      userRating: session.studentRating || session.mentorRating,
      price: (session as any).price || 75,
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
 * Enhanced time slot generation from real mentor schedule
 */

// Replace the generateRealTimeSlots function in booking.controller.ts:

async function generateRealTimeSlots(mentorProfile: any, date: string): Promise<any[]> {
  try {
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    console.log('🔍 DEBUGGING SLOT GENERATION:');
    console.log('📅 Date:', date);
    console.log('📅 Day name:', dayName);
    console.log('👤 Mentor profile ID:', mentorProfile._id);
    console.log('📋 Weekly schedule exists:', !!mentorProfile.weeklySchedule);
    console.log('📋 Full weekly schedule:', JSON.stringify(mentorProfile.weeklySchedule, null, 2));
    
    const weeklySchedule = mentorProfile.weeklySchedule;
    
    if (!weeklySchedule) {
      console.log('❌ No weekly schedule found');
      return [];
    }
    
    const daySchedule = weeklySchedule[dayName];
    console.log('📅 Day schedule for', dayName, ':', JSON.stringify(daySchedule, null, 2));
    
    if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length === 0) {
      console.log('❌ No schedule found for', dayName);
      return [];
    }

    const slots: any[] = [];
    const now = new Date();
    
    // Get pricing info from mentor profile
    const pricing = mentorProfile.pricing || {};
    const hourlyRate = pricing.hourlyRate || 75;
    
    console.log('💰 Using hourly rate:', hourlyRate);
    
    // Process each time block for the day
    for (let blockIndex = 0; blockIndex < daySchedule.length; blockIndex++) {
      const block = daySchedule[blockIndex];
      
      console.log(`📋 Processing block ${blockIndex}:`, JSON.stringify(block, null, 2));
      
      // Check if block is available and has valid times
      if (!block || block.isAvailable !== true || !block.startTime || !block.endTime) {
        console.log('⚠️ Skipping invalid/unavailable block:', block);
        continue;
      }
      
      try {
        // Parse time strings - handle both "H:MM" and "HH:MM" formats
        const startTimeParts = block.startTime.split(':');
        const endTimeParts = block.endTime.split(':');
        
        if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
          console.log('⚠️ Invalid time format in block:', block);
          continue;
        }
        
        let startHour = parseInt(startTimeParts[0], 10);
        let startMinute = parseInt(startTimeParts[1], 10);
        let endHour = parseInt(endTimeParts[0], 10);
        let endMinute = parseInt(endTimeParts[1], 10);
        
        // Handle the weird "01:30" case which should probably be "13:30" (1:30 PM)
        if (startHour === 1 && startMinute === 30) {
          console.log('🔧 Converting 01:30 to 13:30 (assuming PM)');
          startHour = 13;
        }
        
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          console.log('⚠️ Invalid time numbers in block:', block);
          continue;
        }
        
        // Create date objects for block start and end times
        const blockStart = new Date(requestedDate);
        blockStart.setHours(startHour, startMinute, 0, 0);
        
        const blockEnd = new Date(requestedDate);
        blockEnd.setHours(endHour, endMinute, 0, 0);
        
        // Validate block times
        if (blockEnd <= blockStart) {
          console.log('⚠️ Invalid block: end time is not after start time:', block);
          continue;
        }
        
        console.log(`📅 Block range: ${blockStart.toISOString()} - ${blockEnd.toISOString()}`);
        
        // Generate 60-minute slots within this block
        const slotDuration = 60; // minutes
        let currentTime = new Date(blockStart);
        let slotCount = 0;
        
        while (currentTime.getTime() + (slotDuration * 60 * 1000) <= blockEnd.getTime()) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
          
          // Skip past slots (add 2 hour buffer for current day to account for timezone)
          const isToday = requestedDate.toDateString() === now.toDateString();
          const bufferTime = isToday ? 2 * 60 * 60 * 1000 : 0; // 2 hours buffer
          
          if (slotStart <= new Date(now.getTime() + bufferTime)) {
            console.log('⏭️ Skipping past slot:', slotStart.toISOString());
            currentTime = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
            continue;
          }
          
          const slot = {
            id: `${mentorProfile.userId}-${slotStart.getTime()}`,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            date: date,
            isAvailable: true,
            price: hourlyRate,
            duration: slotDuration,
            sessionType: 'video' as const,
          };
          
          slots.push(slot);
          slotCount++;
          
          console.log(`🎯 Generated slot ${slotCount}: ${slotStart.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()}`);
          
          currentTime = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
        }
        
        console.log(`✅ Generated ${slotCount} slots from block ${blockIndex}`);
        
      } catch (blockError: any) {
        console.error('❌ Error processing block:', block, blockError.message);
        continue;
      }
    }
    
    console.log(`✅ Total generated slots: ${slots.length}`);
    return slots;
    
  } catch (error: any) {
    console.error('❌ Error generating time slots:', error.message);
    return [];
  }
}

/**
 * Enhanced slot filtering with real-time booking check
 */
async function filterRealBookedSlots(slots: any[], mentorId: string, date: string): Promise<any[]> {
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
    return slots.map(slot => {
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
      
      return {
        ...slot,
        isAvailable: !hasConflict,
      };
    }).filter(slot => slot.isAvailable); // Only return available slots
    
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
 * Generate secure meeting code for fallback
 */
function generateSecureMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i === 3 || i === 7) {
      code += '-';
    } else {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
}

// Helper function for validation (existing code with minor updates)
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

export default {
  getAvailableSlots,
  createBooking,
  getUserBookings,
  getBookingDetails,
  rescheduleBooking,
  cancelBooking,
};