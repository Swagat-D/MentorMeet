// backend/src/controllers/booking.controller.ts - Enhanced with Google Meet Integration
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

    console.log('👤 User found:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

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

    // Generate slots based on mentor's schedule
    const mentorSlots = await generateTimeSlots(mentorProfile, date);
    
    console.log('🎯 Generated mentor slots:', mentorSlots.length);
    
    if (mentorSlots.length === 0) {
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      res.status(200).json({
        success: true,
        message: 'No available slots for this date',
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
    const finalSlots = await filterBookedSlots(mentorSlots, mentorId, date);

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
 * Create a new booking with Google Meet integration
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
      sessionType: 'video', // All sessions are video calls via Google Meet
      status: 'confirmed',
      sessionNotes: notes || '',
      price: timeSlot.price,
    });

    console.log('✅ Session created:', session._id);

    // Create Google Meet session
    let meetingResult;
    try {
      meetingResult = await googleCalendarService.createMentoringSession({
        mentorEmail: mentor.email,
        studentEmail: student.email,
        mentorName: mentor.name,
        studentName: student.name,
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
        meetingLink: `https://meet.google.com/fallback-${Date.now()}`,
        error: typeof meetError === 'object' && meetError !== null && 'message' in meetError ? (meetError as any).message : 'Unknown error'
      };
    }

    // Update session with meeting link
    (session as any).meetingLink = meetingResult.meetingLink;
    (session as any).calendarEventId = meetingResult.calendarEventId;
    await session.save();

    // Send notifications to both mentor and student
    try {
      await notificationService.sendBookingConfirmation({
        sessionId: session._id.toString(),
        mentorId: mentor._id.toString(),
        studentId: student._id.toString(),
        mentorEmail: mentor.email,
        studentEmail: student.email,
        mentorName: mentor.name,
        studentName: student.name,
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
        mentorName: mentor.name,
        studentName: student.name,
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

// Helper functions (keeping existing generateTimeSlots and filterBookedSlots)
async function generateTimeSlots(mentorProfile: any, date: string): Promise<any[]> {
  try {
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    console.log('📅 Generating slots for:', { 
      date, 
      dayName, 
      mentorUserId: mentorProfile.userId,
      profileId: mentorProfile._id,
    });
    
    const weeklySchedule = (mentorProfile as any).weeklySchedule;
    const daySchedule = (mentorProfile as any).weeklySchedule[dayName];
    
    if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length === 0) {
      console.log('⚠️ No schedule found for', dayName);
      return [];
    }

    const slots: any[] = [];
    const now = new Date();
    
    // Get pricing info from mentor profile
    const pricing = (mentorProfile as any).pricing || {};
    const hourlyRate = pricing.hourlyRate || 50;
    
    console.log('💰 Using hourly rate:', hourlyRate);
    
    // Generate slots for each time block in the day
    for (let blockIndex = 0; blockIndex < daySchedule.length; blockIndex++) {
      const block = daySchedule[blockIndex];
      
      console.log(`📋 Processing block ${blockIndex}:`, JSON.stringify(block, null, 2));
      
      if (!block || block.isAvailable !== true || !block.startTime || !block.endTime) {
        console.log('⚠️ Skipping invalid/unavailable block:', block);
        continue;
      }
      
      try {
        // Parse time strings (format: "HH:MM")
        const startTimeParts = block.startTime.split(':');
        const endTimeParts = block.endTime.split(':');
        
        if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
          console.log('⚠️ Invalid time format in block:', block);
          continue;
        }
        
        const startHour = parseInt(startTimeParts[0], 10);
        const startMinute = parseInt(startTimeParts[1], 10);
        const endHour = parseInt(endTimeParts[0], 10);
        const endMinute = parseInt(endTimeParts[1], 10);
        
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          console.log('⚠️ Invalid time numbers in block:', block);
          continue;
        }
        
        console.log(`⏰ Block times: ${startHour}:${startMinute.toString().padStart(2, '0')} - ${endHour}:${endMinute.toString().padStart(2, '0')}`);
        
        // Create date objects for block start and end times
        const blockStart = new Date(requestedDate);
        blockStart.setHours(startHour, startMinute, 0, 0);
        
        const blockEnd = new Date(requestedDate);
        blockEnd.setHours(endHour, endMinute, 0, 0);
        
        // Handle case where end time is next day
        if (blockEnd <= blockStart) {
          blockEnd.setDate(blockEnd.getDate() + 1);
        }
        
        console.log(`📅 Block range: ${blockStart.toISOString()} - ${blockEnd.toISOString()}`);
        
        // Generate 60-minute slots within this block
        const slotDuration = 60; // minutes
        let currentTime = new Date(blockStart);
        let slotCount = 0;
        
        while (currentTime.getTime() + (slotDuration * 60 * 1000) <= blockEnd.getTime()) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
          
          // Skip past slots (add 30 minute buffer for current day)
          const isToday = requestedDate.toDateString() === now.toDateString();
          const bufferTime = isToday ? 30 * 60 * 1000 : 0;
          
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
 * Filter out already booked slots
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
        
        return overlap;
      });
      
      return {
        ...slot,
        isAvailable: !hasConflict,
      };
    });
    
  } catch (error: any) {
    console.error('❌ Error filtering booked slots:', error);
    return slots;
  }
}

// Helper function for validation
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
    
    if (!paymentMethodId) {
      return { isValid: false, message: 'Payment method is required' };
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