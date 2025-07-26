// backend/src/controllers/booking.controller.ts - Corrected Collection Name
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';

// Create a simple schema for mentorProfiles collection (note the capital P)
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

    // Step 1: Find the user in users collection
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

    // Step 2: Find the mentor profile in mentorProfiles collection (capital P)
    console.log('🔍 Searching in mentorProfiles collection for userId:', mentorId);
    
    const mentorProfile = await MentorProfile.findOne({ userId: new mongoose.Types.ObjectId(mentorId) });
    
    if (!mentorProfile) {
      console.log('⚠️ No mentor profile found for userId:', mentorId);
      
      // Let's also check what documents exist in the collection
      const allProfiles = await MentorProfile.find({}).limit(2);
      console.log('📋 Sample profiles in collection:', allProfiles.map(p => ({
        _id: p._id,
        userId: (p.toObject() as any).userId,
        displayName: (p.toObject() as any).displayName,
        hasSchedule: !!(p.toObject() as any).weeklySchedule
      })));
      
      res.status(200).json({
        success: true,
        message: 'No mentor profile found for this user',
        data: [],
        debug: {
          searchedUserId: mentorId,
          profilesFound: allProfiles.length,
          sampleProfiles: allProfiles.map(p => ({ _id: p._id, userId: (p.toObject() as any).userId }))
        }
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

    // Step 3: Check if mentor profile has weekly schedule
      if (!(mentorProfile as any).weeklySchedule || typeof (mentorProfile as any).weeklySchedule !== 'object') {      console.log('⚠️ Mentor profile has no weekly schedule configured');
      console.log('📋 Profile data keys:', Object.keys(mentorProfile.toObject()));
      
      res.status(200).json({
        success: true,
        message: 'No schedule configured for this mentor',
        data: [],
        debug: {
          profileId: mentorProfile._id,
          hasWeeklySchedule: !!(mentorProfile as any).weeklySchedule,
          weeklyScheduleType: typeof (mentorProfile as any).weeklySchedule,
          profileKeys: Object.keys(mentorProfile.toObject())
        }
      });
      return;
    }

    // Step 4: Generate slots based on mentor's schedule
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
          allScheduleDays: Object.keys((mentorProfile as any).weeklySchedule || {}),
        }
      });
      return;
    }

    // Step 5: Filter out already booked slots from database
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
 * Generate time slots based on mentor's weekly schedule
 */
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
    console.log('📋 Available schedule days:', Object.keys(weeklySchedule));
    
    const daySchedule = (mentorProfile as any).weeklySchedule[dayName];
    console.log('📋 Day schedule for', dayName, ':', JSON.stringify(daySchedule, null, 2));
    
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

/**
 * Create a new booking
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

  console.log('🎯 Creating booking:', { mentorId, studentId, timeSlot: timeSlot.id, sessionType, subject });

  try {
    // Validate the booking request
    const validationResult = await validateBooking({
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

    // Create session record
    const session = await Session.create({
      studentId,
      mentorId,
      subject,
      scheduledTime: new Date(timeSlot.startTime),
      duration: timeSlot.duration,
      sessionType: sessionType === 'video' ? 'video' : sessionType === 'audio' ? 'audio' : 'chat',
      status: 'confirmed',
      sessionNotes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: session._id,
        sessionId: session._id,
        paymentId: `pay_${Date.now()}`,
        meetingLink: 'https://meet.google.com/new',
        calendarEventId: session._id.toString(),
        reminderSet: true,
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
        .populate('studentId', 'firstName lastName email')
        .populate('mentorId', 'firstName lastName email')
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
      },
      student: {
        id: (session.studentId as any)._id,
        name: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
        email: (session.studentId as any).email,
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
      price: 75,
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
 * Cancel a booking
 */
export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
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
        message: 'You are not authorized to cancel this booking',
      });
      return;
    }

    session.status = 'cancelled';
    session.sessionNotes = `${session.sessionNotes ? session.sessionNotes + '\n\n' : ''}Cancelled by ${isStudent ? 'student' : 'mentor'}: ${reason || 'No reason provided'}`;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        sessionId: session._id,
        refundEligible: true,
        refundAmount: 75,
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
 * Rate a completed session
 */
export const rateSession = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params;
  const { rating, review } = req.body;
  const userId = req.userId;

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

    const isStudent = session.studentId.toString() === userId;
    const isMentor = session.mentorId.toString() === userId;

    if (!isStudent && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to rate this session',
      });
    }

    if (isStudent) {
      session.studentRating = rating;
      session.studentReview = review;
    } else {
      session.mentorRating = rating;
      session.mentorReview = review;
    }

    await session.save();

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

// Helper function
async function validateBooking(bookingData: any): Promise<{ isValid: boolean; message: string }> {
  try {
    const { mentorId, studentId, timeSlot, sessionType, subject, paymentMethodId } = bookingData;
    
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
    
    if (!['video', 'audio', 'in-person'].includes(sessionType)) {
      return { isValid: false, message: 'Invalid session type' };
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
  cancelBooking,
  rescheduleBooking,
  rateSession,
};