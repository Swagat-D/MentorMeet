// backend/src/controllers/booking.controller.ts - Updated with Email Integration
import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import MentorProfileService from '../services/mentorProfile.service';
import ScheduleGenerationService from '../services/scheduleGeneration.service';
import { paymentService } from '../services/booking.service';
import emailService from '../services/email.service';
import nodemailer from 'nodemailer';

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
 * Create booking with payment-first flow and email notifications
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
      res.status(400).json({
        success: false,
        message: validationResult.message,
      });
      return;
    }

    // Step 2: Get participant details
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

    // Step 5: Create session record
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
      autoDeclineAt,
      
      // Manual booking specific fields
      slotId: timeSlot.slotId || timeSlot.id,
      bookingSource: 'manual',
      
      // Payment fields
      price: timeSlot.price,
      currency: 'INR',
      paymentId: paymentResult.paymentId!,
      paymentStatus: 'completed'
    });

    await sessionRecord.save();

    console.log('✅ Session created in database:', sessionRecord._id);

    // Step 6: Send email notifications to both mentor and student
    try {
      const sessionDate = scheduledTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = scheduledTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Send email to student
      await sendBookingEmail(student.email, {
        isForMentor: false,
        recipientName: `${student.firstName} ${student.lastName}`,
        otherPartyName: `${mentor.firstName} ${mentor.lastName}`,
        subject,
        sessionDate,
        sessionTime,
        duration: timeSlot.duration,
        amount: `₹${timeSlot.price}`,
        sessionId: sessionRecord._id.toString()
      });

      // Send email to mentor
      await sendBookingEmail(mentor.email, {
        isForMentor: true,
        recipientName: `${mentor.firstName} ${mentor.lastName}`,
        otherPartyName: `${student.firstName} ${student.lastName}`,
        subject,
        sessionDate,
        sessionTime,
        duration: timeSlot.duration,
        amount: `₹${timeSlot.price}`,
        sessionId: sessionRecord._id.toString()
      });

      console.log('✅ Booking confirmation emails sent to both parties');

    } catch (emailError) {
      console.error('⚠️ Failed to send booking confirmation emails:', emailError);
      // Don't fail the booking for email issues
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully! Confirmation emails sent to both mentor and student.',
      data: {
        bookingId: sessionRecord._id,
        sessionId: sessionRecord._id,
        paymentId: paymentResult.paymentId,
        status: sessionRecord.status,
        autoDeclineAt: sessionRecord.autoDeclineAt.toISOString(),
        reminderSet: true,
        paymentProcessed: true,
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

function createEmailTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Helper function to send booking emails
 */
async function sendBookingEmail(email: string, data: any): Promise<void> {
  try {
    const subject = data.isForMentor 
      ? `New Session Booked: ${data.subject}` 
      : `Booking Confirmed: ${data.subject}`;

    const html = getBookingEmailHTML(data);
    const text = getBookingEmailText(data);

    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: `MentorMatch <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      text,
    };

    transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    throw error;
  }
}

/**
 * Get booking email HTML template
 */
function getBookingEmailHTML(data: any): string {
  const isForMentor = data.isForMentor;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isForMentor ? 'New Session Booked' : 'Booking Confirmed'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; }
    .details { background: #F8F3EE; border: 2px solid #8B4513; border-radius: 12px; padding: 25px; margin: 20px 0; }
    .footer { background: #F8F3EE; padding: 20px; text-align: center; border-top: 1px solid #E8DDD1; color: #8B7355; }
    h1 { margin: 0; font-size: 28px; font-weight: bold; }
    h3 { color: #8B4513; margin: 0 0 15px 0; font-size: 18px; }
    .detail-row { margin-bottom: 12px; }
    .detail-label { color: #2A2A2A; font-weight: bold; }
    .detail-value { color: ${isForMentor ? '#8B4513' : '#2A2A2A'}; font-weight: ${isForMentor ? '600' : 'normal'}; }
    .status-badge { background: #FEF3C7; color: #92400E; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isForMentor ? '👨‍🏫 New Session Booked!' : '📺 Booking Confirmed!'}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
        ${isForMentor ? 'A student has scheduled a session with you' : 'Your session has been confirmed'}
      </p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        ${isForMentor 
          ? 'Great news! A new mentoring session has been booked. Here are the details:' 
          : 'Your mentoring session has been confirmed! Here are all the details you need:'
        }
      </p>
      
      <div class="details">
        <h3>📚 Session Details</h3>
        
        <div class="detail-row">
          <span class="detail-label">${isForMentor ? 'Student' : 'Mentor'}:</span> 
          <span class="detail-value">${data.otherPartyName}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Subject:</span> 
          <span class="detail-value">${data.subject}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Date:</span> 
          <span class="detail-value">${data.sessionDate}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Time:</span> 
          <span class="detail-value">${data.sessionTime}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Duration:</span> 
          <span class="detail-value">${data.duration} minutes</span>
        </div>

        ${data.amount ? `
        <div class="detail-row">
          <span class="detail-label">Amount:</span> 
          <span class="detail-value">${data.amount}</span>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #D2691E; padding-top: 15px; margin-top: 15px;">
          <div class="status-badge">
            ⏳ ${isForMentor ? 'Please accept this session and provide meeting link' : 'Waiting for mentor to accept and provide meeting link'}
          </div>
        </div>
      </div>
      
      <p style="font-size: 16px; margin-top: 25px;">
        ${isForMentor 
          ? 'Thank you for sharing your expertise and helping students learn! 🌟' 
          : 'Looking forward to your learning session! 🚀'
        }
      </p>
      
      <p style="font-size: 16px;">
        Best regards,<br>
        <strong style="color: #8B4513;">The MentorMatch Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0; font-size: 12px;">
        Session ID: ${data.sessionId}<br>
        © 2024 MentorMatch. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get booking email text template
 */
function getBookingEmailText(data: any): string {
  const isForMentor = data.isForMentor;
  
  return `
Hi ${data.recipientName},

${isForMentor ? 'Great news! A new session has been booked.' : 'Your session has been confirmed!'}

Session Details:
- ${isForMentor ? 'Student' : 'Mentor'}: ${data.otherPartyName}
- Subject: ${data.subject}
- Date: ${data.sessionDate}
- Time: ${data.sessionTime}
- Duration: ${data.duration} minutes
${data.amount ? `- Amount: ${data.amount}` : ''}

Status: ${isForMentor ? 'Please accept this session and provide meeting link' : 'Waiting for mentor to accept and provide meeting link'}

${isForMentor ? 'Thank you for sharing your expertise!' : 'Looking forward to your learning session!'}

Best regards,
The MentorMatch Team

Session ID: ${data.sessionId}
  `.trim();
}

/**
 * Cancel booking (keeping existing implementation)
 */
export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  const userId = req.userId;

  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

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
        const refundResult = await paymentService.refundPayment(sessionRecord.paymentId, refundAmount);
        refundProcessed = refundResult.success;
        
        if (refundProcessed && refundResult.paymentId) {
          sessionRecord.refundId = refundResult.paymentId;
          sessionRecord.refundStatus = 'processed';
          sessionRecord.paymentStatus = 'refunded';
          await sessionRecord.save({ session });
        }
      } catch (refundError) {
        console.error('⚠️ Refund processing failed:', refundError);
        sessionRecord.refundStatus = 'failed';
        await sessionRecord.save({ session });
      }
    }

    await session.commitTransaction();

    // Send cancellation emails
    try {
      const sessionDate = sessionRecord.scheduledTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = sessionRecord.scheduledTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const cancellationData = {
        subject: sessionRecord.subject,
        sessionDate,
        sessionTime,
        cancelledBy: isStudent ? 'student' : 'mentor',
        reason: reason || 'No reason provided',
        refundAmount
      };

      // Send to both parties
      await Promise.all([
        sendCancellationEmail((sessionRecord.studentId as any).email, cancellationData),
        sendCancellationEmail((sessionRecord.mentorId as any).email, cancellationData)
      ]);

      console.log('✅ Cancellation emails sent to both parties');

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
 * Helper function to send cancellation emails
 */
async function sendCancellationEmail(email: string, data: any): Promise<void> {
  try {
    const subject = `Session Cancelled: ${data.subject}`;
    const html = getCancellationEmailHTML(data);
    const text = getCancellationEmailText(data);

    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"MentorMatch" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to: ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send cancellation email to ${email}:`, error);
    throw error;
  }
}

/**
 * Get cancellation email HTML template
 */
function getCancellationEmailHTML(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Session Cancelled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: #DC2626; padding: 30px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; }
    .details { background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; }
    .refund { background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
    .footer { background: #F8F3EE; padding: 20px; text-align: center; color: #8B7355; }
    h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .detail-row { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Session Cancelled</h1>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>We're writing to inform you that the following session has been cancelled:</p>
      
      <div class="details">
        <div class="detail-row"><strong>Subject:</strong> ${data.subject}</div>
        <div class="detail-row"><strong>Date:</strong> ${data.sessionDate}</div>
        <div class="detail-row"><strong>Time:</strong> ${data.sessionTime}</div>
        <div class="detail-row"><strong>Cancelled by:</strong> ${data.cancelledBy}</div>
        <div class="detail-row"><strong>Reason:</strong> ${data.reason}</div>
      </div>
      
      ${data.refundAmount > 0 ? `
      <div class="refund">
        <strong>💰 Refund Information</strong><br>
        A refund of ₹${data.refundAmount} will be processed within 3-5 business days.
      </div>
      ` : ''}
      
      <p>We apologize for any inconvenience this may cause. You can book a new session anytime through our platform.</p>
      
      <p>Best regards,<br><strong style="color: #8B4513;">The MentorMatch Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="margin: 0; font-size: 12px;">© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get cancellation email text template
 */
function getCancellationEmailText(data: any): string {
  return `
Hi there,

We're writing to inform you that the following session has been cancelled:

Subject: ${data.subject}
Date: ${data.sessionDate}
Time: ${data.sessionTime}
Cancelled by: ${data.cancelledBy}
Reason: ${data.reason}

${data.refundAmount > 0 ? `Refund: A refund of ₹${data.refundAmount} will be processed within 3-5 business days.` : ''}

We apologize for any inconvenience this may cause. You can book a new session anytime through our platform.

Best regards,
The MentorMatch Team
  `.trim();
}

/**
 * Get user's bookings (keeping existing implementation)
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
 * Get booking details (keeping existing implementation)
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

// Helper function for validation (keeping existing implementation)
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