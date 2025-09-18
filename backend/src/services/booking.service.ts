// backend/src/services/booking.service.ts - Updated with Real Email Service
import User, { IUser } from '../models/User.model';
import { Session } from '../models/Session.model';
import emailService from './email.service';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  sessionType: 'video' | 'audio' | 'in-person';
}

interface BookingValidation {
  isValid: boolean;
  message: string;
  mentorEmail?: string;
  studentEmail?: string;
  mentorName?: string;
  studentName?: string;
  mentorTimezone?: string;
}

// Payment Service (Mock - as requested)
interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata?: any;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
}

class PaymentService {
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('💳 Processing payment:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description
      });

      // Validate payment method ID format
      if (!paymentData.paymentMethodId || paymentData.paymentMethodId.length < 10) {
        return {
          success: false,
          error: 'Invalid payment method. Please check your payment details.'
        };
      }

      // Validate amount
      if (paymentData.amount <= 0) {
        return {
          success: false,
          error: 'Invalid payment amount.'
        };
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate 95% success rate
      const isSuccessful = Math.random() > 0.05;
      
      if (isSuccessful) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('✅ Payment processed successfully:', paymentId);
        return { success: true, paymentId };
      } else {
        const errors = [
          'Payment was declined by your bank.',
          'Insufficient funds in your account.',
          'Your card has expired.',
          'Payment processing failed.'
        ];
        
        const error = errors[Math.floor(Math.random() * errors.length)];
        console.log('❌ Payment failed:', error);
        return { success: false, error };
      }
      
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed due to a technical error.'
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      console.log('💰 Processing refund:', { paymentId, amount });

      if (!paymentId || !paymentId.startsWith('pay_')) {
        return { success: false, error: 'Invalid payment ID for refund.' };
      }

      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Refund processed:', refundId);
      
      return { success: true, paymentId: refundId };
      
    } catch (error: any) {
      console.error('❌ Refund processing error:', error);
      return { success: false, error: 'Refund processing failed.' };
    }
  }

  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      return paymentMethodId.startsWith('pm_') && paymentMethodId.length > 10;
    } catch {
      return false;
    }
  }
}

// Real Notification Service using Email Service
class NotificationService {
  /**
   * Send booking confirmation emails to both mentor and student
   */
  async sendBookingConfirmation(data: {
    sessionId: string;
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    scheduledTime: string;
    duration: number;
    sessionType: string;
    amount: string;
  }): Promise<void> {
    try {
      console.log('📧 Sending booking confirmation emails...');

      const sessionDate = new Date(data.scheduledTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = new Date(data.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Email to student
      const studentEmailData = {
        isForMentor: false,
        mentorName: data.mentorName,
        studentName: data.studentName,
        subject: data.subject,
        sessionDate,
        sessionTime,
        duration: data.duration,
        amount: data.amount,
      };

      // Email to mentor
      const mentorEmailData = {
        isForMentor: true,
        mentorName: data.mentorName,
        studentName: data.studentName,
        subject: data.subject,
        sessionDate,
        sessionTime,
        duration: data.duration,
        amount: data.amount,
      };

      // Send emails using the real email service
      const [studentResult, mentorResult] = await Promise.all([
        this.sendBookingEmail(data.studentEmail, studentEmailData),
        this.sendBookingEmail(data.mentorEmail, mentorEmailData)
      ]);

      if (studentResult.success) {
        console.log('✅ Booking confirmation email sent to student:', data.studentEmail);
      } else {
        console.error('❌ Failed to send booking email to student:', studentResult.error);
      }

      if (mentorResult.success) {
        console.log('✅ Booking confirmation email sent to mentor:', data.mentorEmail);
      } else {
        console.error('❌ Failed to send booking email to mentor:', mentorResult.error);
      }

    } catch (error) {
      console.error('❌ Error sending booking confirmation emails:', error);
    }
  }

  /**
   * Send session acceptance notification (when mentor accepts)
   */
  async sendSessionAcceptanceNotification(data: {
    sessionId: string;
    mentorId: string;
    studentId: string;
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    scheduledTime: string;
    duration: number;
    meetingLink: string;
  }): Promise<void> {
    try {
      console.log('📧 Sending session acceptance notifications...');

      const sessionDate = new Date(data.scheduledTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = new Date(data.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Email to student (session confirmed with meeting link)
      const studentEmailData = {
        isForMentor: false,
        mentorName: data.mentorName,
        studentName: data.studentName,
        subject: data.subject,
        sessionDate,
        sessionTime,
        duration: data.duration,
        meetingLink: data.meetingLink,
      };

      // Email to mentor (confirmation that they accepted)
      const mentorEmailData = {
        isForMentor: true,
        mentorName: data.mentorName,
        studentName: data.studentName,
        subject: data.subject,
        sessionDate,
        sessionTime,
        duration: data.duration,
        meetingLink: data.meetingLink,
      };

      // Send emails
      const [studentResult, mentorResult] = await Promise.all([
        this.sendBookingEmail(data.studentEmail, studentEmailData),
        this.sendBookingEmail(data.mentorEmail, mentorEmailData)
      ]);

      if (studentResult.success) {
        console.log('✅ Session acceptance email sent to student:', data.studentEmail);
      } else {
        console.error('❌ Failed to send acceptance email to student:', studentResult.error);
      }

      if (mentorResult.success) {
        console.log('✅ Session acceptance email sent to mentor:', data.mentorEmail);
      } else {
        console.error('❌ Failed to send acceptance email to mentor:', mentorResult.error);
      }

    } catch (error) {
      console.error('❌ Error sending session acceptance notifications:', error);
    }
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(data: {
    sessionId: string;
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    scheduledTime: string;
    cancelledBy: string;
    reason: string;
    refundAmount: number;
  }): Promise<void> {
    try {
      console.log('📧 Sending cancellation notifications...');

      const sessionDate = new Date(data.scheduledTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = new Date(data.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const cancellationData = {
        subject: data.subject,
        sessionDate,
        sessionTime,
        cancelledBy: data.cancelledBy,
        reason: data.reason,
        refundAmount: data.refundAmount,
      };

      // Send emails to both parties
      const [studentResult, mentorResult] = await Promise.all([
        this.sendCancellationEmail(data.studentEmail, cancellationData),
        this.sendCancellationEmail(data.mentorEmail, cancellationData)
      ]);

      if (studentResult.success) {
        console.log('✅ Cancellation email sent to student:', data.studentEmail);
      } else {
        console.error('❌ Failed to send cancellation email to student:', studentResult.error);
      }

      if (mentorResult.success) {
        console.log('✅ Cancellation email sent to mentor:', data.mentorEmail);
      } else {
        console.error('❌ Failed to send cancellation email to mentor:', mentorResult.error);
      }

    } catch (error) {
      console.error('❌ Error sending cancellation notifications:', error);
    }
  }

  /**
   * Send auto-cancellation notification (when mentor doesn't respond)
   */
  async sendAutoCancellationNotification(data: {
    sessionId: string;
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    scheduledTime: string;
    refundAmount: number;
  }): Promise<void> {
    try {
      console.log('📧 Sending auto-cancellation notifications...');

      const sessionDate = new Date(data.scheduledTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = new Date(data.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const cancellationData = {
        subject: data.subject,
        sessionDate,
        sessionTime,
        cancelledBy: 'system',
        reason: 'Mentor did not accept within the required timeframe',
        refundAmount: data.refundAmount,
      };

      // Send emails to both parties
      const [studentResult, mentorResult] = await Promise.all([
        this.sendCancellationEmail(data.studentEmail, cancellationData),
        this.sendCancellationEmail(data.mentorEmail, cancellationData)
      ]);

      if (studentResult.success) {
        console.log('✅ Auto-cancellation email sent to student:', data.studentEmail);
      } else {
        console.error('❌ Failed to send auto-cancellation email to student:', studentResult.error);
      }

      if (mentorResult.success) {
        console.log('✅ Auto-cancellation email sent to mentor:', data.mentorEmail);
      } else {
        console.error('❌ Failed to send auto-cancellation email to mentor:', mentorResult.error);
      }

    } catch (error) {
      console.error('❌ Error sending auto-cancellation notifications:', error);
    }
  }

  /**
   * Helper method to send booking email using email service
   */
  private async sendBookingEmail(email: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Use the private method from email service (we'll call it directly)
      const mailOptions = {
        from: {
          name: 'MentorMatch',
          address: process.env.EMAIL_FROM || 'noreply@mentormatch.com',
        },
        to: email,
        subject: data.isForMentor ? `New Session Booked: ${data.subject}` : `Booking Confirmed: ${data.subject}`,
        html: this.getBookingConfirmationHTML(data),
        text: this.getBookingConfirmationText(data),
      };

      // Direct transporter usage - you might need to access emailService.transporter
      // For now, let's use a simple approach
      return await this.sendEmailDirect(mailOptions);

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper method to send cancellation email
   */
  private async sendCancellationEmail(email: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const mailOptions = {
        from: {
          name: 'MentorMatch',
          address: process.env.EMAIL_FROM || 'noreply@mentormatch.com',
        },
        to: email,
        subject: `Session Cancelled: ${data.subject}`,
        html: this.getCancellationHTML(data),
        text: this.getCancellationText(data),
      };

      return await this.sendEmailDirect(mailOptions);

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Direct email sending method
   */
  private async sendEmailDirect(mailOptions: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Import nodemailer dynamically to avoid circular dependencies
      const nodemailer = require('nodemailer');
      
      // Create transporter (use the same config as email service)
      const transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const result = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get booking confirmation HTML template
   */
private getBookingConfirmationHTML(data: any): string {
    const isForMentor = data.isForMentor;
    const recipientName = isForMentor ? data.mentorName : data.studentName;
    const otherPartyName = isForMentor ? data.studentName : data.mentorName;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isForMentor ? 'New Session Booked' : 'Booking Confirmed'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { padding: 30px 20px; }
    .details { background: #F8F3EE; border: 2px solid #8B4513; border-radius: 12px; padding: 25px; margin: 20px 0; }
    .meeting-url-form { background: #E3F2FD; border: 2px solid #2196F3; border-radius: 12px; padding: 25px; margin: 20px 0; }
    .form-input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; margin: 10px 0; box-sizing: border-box; }
    .form-button { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 10px; }
    .meeting-link { background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { background: #F8F3EE; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #E8DDD1; }
    .warning-box { background: #FFF3CD; border: 2px solid #F59E0B; border-radius: 8px; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
        ${isForMentor ? '👨‍🏫 New Session Booked!' : '📺 Booking Confirmed!'}
      </h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
        ${isForMentor ? 'A student has scheduled a session with you' : 'Your session has been confirmed'}
      </p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; color: #2A2A2A; margin-bottom: 20px;">Hi ${recipientName},</p>
      
      <p style="font-size: 16px; color: #2A2A2A; line-height: 1.6; margin-bottom: 25px;">
        ${isForMentor 
          ? 'Great news! A new mentoring session has been booked. Here are the details:' 
          : 'Your mentoring session has been confirmed! Here are all the details you need:'
        }
      </p>
      
      <div class="details">
        <h3 style="color: #8B4513; margin: 0 0 15px 0; font-size: 18px;">📚 Session Details</h3>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #2A2A2A;">${isForMentor ? 'Student' : 'Mentor'}:</strong> 
          <span style="color: #8B4513; font-weight: 600;">${otherPartyName}</span>
        </div>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #2A2A2A;">Subject:</strong> 
          <span style="color: #2A2A2A;">${data.subject}</span>
        </div>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #2A2A2A;">Date:</strong> 
          <span style="color: #2A2A2A;">${data.sessionDate}</span>
        </div>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #2A2A2A;">Time:</strong> 
          <span style="color: #2A2A2A;">${data.sessionTime}</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #2A2A2A;">Duration:</strong> 
          <span style="color: #2A2A2A;">${data.duration} minutes</span>
        </div>
      </div>

      ${isForMentor && !data.meetingLink ? `
      <!-- Meeting URL Form for Mentor -->
      <div class="meeting-url-form">
        <h3 style="color: #1976D2; margin: 0 0 15px 0; font-size: 18px;">🎥 Provide Meeting Link</h3>
        
        <p style="color: #2A2A2A; margin-bottom: 15px; font-size: 14px;">
          Please provide a Google Meet link for this session. The student will receive the link once you submit it.
        </p>
        
        <div class="warning-box">
          <p style="color: #D97706; margin: 0; font-size: 13px; font-weight: 600;">
            ⚠️ <strong>Important:</strong> Please use only Google Meet links.<br>
            Example: https://meet.google.com/abc-def-ghi
          </p>
        </div>
        
        <form action="${process.env.FRONTEND_URL}/api/sessions/${data.sessionId}/meeting-url" method="POST" style="margin-top: 15px;">
          <input 
            type="url" 
            name="meetingUrl" 
            class="form-input" 
            placeholder="https://meet.google.com/your-meeting-code" 
            required 
            pattern="https://meet\.google\.com/.*"
            title="Please enter a valid Google Meet URL"
            style="margin-bottom: 10px;"
          />
          <button type="submit" class="form-button">
            ✅ Set Meeting Link
          </button>
        </form>
        
        <p style="color: #666; font-size: 12px; margin-top: 10px; text-align: center;">
          Once you provide the meeting link, the session will be confirmed and both you and the student will be notified.
        </p>
      </div>
      ` : ''}

      ${data.meetingLink ? `
      <!-- Existing Meeting Link Display -->
      <div style="border-top: 1px solid #D2691E; padding-top: 15px; margin-top: 15px;">
        <strong style="color: #2A2A2A; display: block; margin-bottom: 10px;">🎥 Meeting Link:</strong>
        <a href="${data.meetingLink}" 
           style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                  color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; 
                  font-weight: bold; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          🚀 Join Meeting Now
        </a>
      </div>
      ` : (!isForMentor ? `
      <div style="border-top: 1px solid #D2691E; padding-top: 15px; margin-top: 15px;">
        <p style="color: #F59E0B; font-weight: 600; margin: 0;">
          ⏳ Waiting for mentor to provide meeting link
        </p>
        <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
          You will receive another email with the meeting link once the mentor provides it.
        </p>
      </div>
      ` : '')}
      
      <p style="font-size: 16px; color: #2A2A2A; margin-top: 25px;">
        ${isForMentor 
          ? 'Thank you for sharing your expertise and helping students learn! 🌟' 
          : 'Looking forward to your learning session! 🚀'
        }
      </p>
      
      <p style="font-size: 16px; color: #2A2A2A;">
        Best regards,<br>
        <strong style="color: #8B4513;">The MentorMatch Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p style="color: #8B7355; font-size: 12px; margin: 0;">
        © 2024 MentorMatch. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get booking confirmation text template
   */
  private getBookingConfirmationText(data: any): string {
    const isForMentor = data.isForMentor;
    const recipientName = isForMentor ? data.mentorName : data.studentName;
    const otherPartyName = isForMentor ? data.studentName : data.mentorName;
    
    return `
Hi ${recipientName},

${isForMentor ? 'Great news! A new session has been booked.' : 'Your session has been confirmed!'}

Session Details:
- ${isForMentor ? 'Student' : 'Mentor'}: ${otherPartyName}
- Subject: ${data.subject}
- Date: ${data.sessionDate}
- Time: ${data.sessionTime}
- Duration: ${data.duration} minutes
${data.meetingLink ? `- Meeting Link: ${data.meetingLink}` : ''}

${isForMentor ? 'Thank you for sharing your expertise!' : 'Looking forward to your learning session!'}

Best regards,
The MentorMatch Team
    `.trim();
  }

  /**
   * Get cancellation HTML template
   */
  private getCancellationHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Session Cancelled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #DC2626; color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { padding: 30px 20px; }
    .details { background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; }
    .footer { background: #F8F3EE; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">❌ Session Cancelled</h1>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>The following session has been cancelled:</p>
      
      <div class="details">
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Date:</strong> ${data.sessionDate}</p>
        <p><strong>Time:</strong> ${data.sessionTime}</p>
        <p><strong>Cancelled by:</strong> ${data.cancelledBy}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
      </div>
      
      ${data.refundAmount > 0 ? `<p>💰 A refund of ₹${data.refundAmount} will be processed within 3-5 business days.</p>` : ''}
      
      <p>We apologize for any inconvenience.</p>
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get cancellation text template
   */
  private getCancellationText(data: any): string {
    return `
Hi there,

The following session has been cancelled:

Subject: ${data.subject}
Date: ${data.sessionDate}
Time: ${data.sessionTime}
Cancelled by: ${data.cancelledBy}
Reason: ${data.reason}

${data.refundAmount > 0 ? `A refund of ₹${data.refundAmount} will be processed within 3-5 business days.` : ''}

We apologize for any inconvenience.

Best regards,
MentorMatch Team
    `.trim();
  }
}

class BookingService {
  /**
   * Generate time slots based on mentor's weekly schedule
   */
  async generateTimeSlots(mentor: IUser, date: string): Promise<TimeSlot[]> {
    try {
      const requestedDate = new Date(date);
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      console.log('📅 Generating slots for:', { date, dayName, mentorId: mentor._id });
      console.log('📋 Mentor weekly schedule:', mentor.weeklySchedule);
      
      // Get mentor's schedule for the requested day
      const daySchedule = mentor.weeklySchedule?.[dayName];
      
      console.log('📋 Day schedule for', dayName, ':', daySchedule);
      
      if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length === 0) {
        console.log('⚠️ No schedule found for', dayName);
        return [];
      }

      const slots: TimeSlot[] = [];
      const now = new Date();
      
      // Generate slots for each time block in the day
      for (let blockIndex = 0; blockIndex < daySchedule.length; blockIndex++) {
        const block = daySchedule[blockIndex];
        
        console.log(`📋 Processing block ${blockIndex}:`, block);
        
        if (!block || !block.isAvailable || !block.startTime || !block.endTime) {
          console.log('⚠️ Skipping invalid block:', block);
          continue;
        }
        
        try {
          // Parse time strings (format: "HH:MM")
          const [startHour, startMinute] = block.startTime.split(':').map(Number);
          const [endHour, endMinute] = block.endTime.split(':').map(Number);
          
          if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            console.log('⚠️ Invalid time format in block:', block);
            continue;
          }
          
          console.log(`⏰ Block times: ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
          
          const blockStart = new Date(requestedDate);
          blockStart.setHours(startHour, startMinute, 0, 0);
          
          const blockEnd = new Date(requestedDate);
          blockEnd.setHours(endHour, endMinute, 0, 0);
          
          // Validate block times
          if (blockStart >= blockEnd) {
            console.log('⚠️ Invalid block: start time is after end time:', block);
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
            
            // Skip past slots (add 30 minute buffer)
            if (slotStart <= new Date(now.getTime() + 30 * 60 * 1000)) {
              console.log('⏭️ Skipping past slot:', slotStart.toISOString());
              currentTime = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
              continue;
            }
            
            const pricing = (mentor as any).pricing;
            
            const slot: TimeSlot = {
              id: `${mentor._id}-${slotStart.getTime()}`,
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              date: date,
              isAvailable: true,
              price: pricing?.hourlyRate || 50,
              duration: slotDuration,
              sessionType: 'video',
            };
            
            slots.push(slot);
            slotCount++;
            
            console.log(`🎯 Generated slot ${slotCount}: ${slotStart.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()}`);
            
            currentTime = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
          }
          
          console.log(`✅ Generated ${slotCount} slots from block ${blockIndex}`);
          
        } catch (blockError: unknown) {
          const errorMessage = blockError instanceof Error ? blockError.message : String(blockError);
          console.error('❌ Error processing block:', block, errorMessage);
          continue;
        }
      }
      
      console.log(`✅ Total generated slots: ${slots.length}`);
      return slots;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error generating time slots:', errorMessage);
      return [];
    }
  }

  /**
   * Filter out already booked slots
   */
  async filterBookedSlots(slots: TimeSlot[], mentorId: string, date: string): Promise<TimeSlot[]> {
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
      
      // Filter out conflicting slots
      return slots.map(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        
        const hasConflict = existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledTime);
          const bookingEnd = new Date(booking.scheduledTime.getTime() + (booking.duration * 60 * 1000));
          
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });
        
        return {
          ...slot,
          isAvailable: !hasConflict,
        };
      });
      
    } catch (error) {
      console.error('❌ Error filtering booked slots:', error);
      return slots;
    }
  }

  /**
   * Validate booking request
   */
  async validateBooking(bookingData: any): Promise<BookingValidation> {
    try {
      const { mentorId, studentId, timeSlot, sessionType, subject, paymentMethodId } = bookingData;
      
      // Check if mentor exists
      const mentor = await User.findById(mentorId);
      if (!mentor) {
        return { isValid: false, message: 'Mentor not found' };
      }
      
      // Check if student exists
      const student = await User.findById(studentId);
      if (!student) {
        return { isValid: false, message: 'Student not found' };
      }
      
      // Check if time slot is still available
      const availableSlots = await this.generateTimeSlots(mentor, timeSlot.date);
      const filteredSlots = await this.filterBookedSlots(availableSlots, mentorId, timeSlot.date);
      
      const isSlotAvailable = filteredSlots.some(slot => 
        slot.id === timeSlot.id && slot.isAvailable
      );
      
      if (!isSlotAvailable) {
        return { isValid: false, message: 'Selected time slot is no longer available' };
      }
      
      // Check if it's not too late to book (at least 2 hours in advance)
      const slotTime = new Date(timeSlot.startTime);
      const now = new Date();
      const timeDiff = slotTime.getTime() - now.getTime();
      const hoursInAdvance = timeDiff / (1000 * 60 * 60);
      
      if (hoursInAdvance < 2) {
        return { isValid: false, message: 'Bookings must be made at least 2 hours in advance' };
      }
      
      // Validate required fields
      if (!subject?.trim()) {
        return { isValid: false, message: 'Subject is required' };
      }
      
      if (!['video', 'audio', 'in-person'].includes(sessionType)) {
        return { isValid: false, message: 'Invalid session type' };
      }
      
      if (!paymentMethodId) {
        return { isValid: false, message: 'Payment method is required' };
      }
      
      return {
        isValid: true,
        message: 'Validation successful',
        mentorEmail: mentor.email,
        studentEmail: student.email,
        mentorName: mentor.name,
        studentName: student.name,
        mentorTimezone: mentor.timezone,
      };
      
    } catch (error: any) {
      console.error('❌ Error validating booking:', error);
      return { isValid: false, message: 'Validation failed due to server error' };
    }
  }

  /**
   * Validate a specific time slot
   */
  async validateTimeSlot(mentorId: string, timeSlot: TimeSlot): Promise<BookingValidation> {
    try {
      const mentor = await User.findById(mentorId);
      if (!mentor) {
        return { isValid: false, message: 'Mentor not found' };
      }
      
      const availableSlots = await this.generateTimeSlots(mentor, timeSlot.date);
      const filteredSlots = await this.filterBookedSlots(availableSlots, mentorId, timeSlot.date);
      
      const isSlotAvailable = filteredSlots.some(slot => 
        slot.id === timeSlot.id && slot.isAvailable
      );
      
      if (!isSlotAvailable) {
        return { isValid: false, message: 'Time slot is not available' };
      }
      
      return { isValid: true, message: 'Time slot is available' };
      
    } catch (error: any) {
      console.error('❌ Error validating time slot:', error);
      return { isValid: false, message: 'Time slot validation failed' };
    }
  }
}

export const bookingService = new BookingService();
export const paymentService = new PaymentService();
export const notificationService = new NotificationService();

export default {
  bookingService,
  paymentService,
  notificationService,
};