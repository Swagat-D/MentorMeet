// backend/src/services/booking.service.ts - Core Booking Logic
import User, { IUser } from '../models/User.model';
import { Session } from '../models/Session.model';

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

// backend/src/services/payment.service.ts - Payment Processing
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
  /**
   * Process payment for booking
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('💳 Processing payment:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
      });

      // Simulate payment processing
      // In production, integrate with Stripe, PayPal, Razorpay, etc.
      
      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success (90% success rate)
      const isSuccessful = Math.random() > 0.1;
      
      if (isSuccessful) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('✅ Payment processed successfully:', paymentId);
        
        return {
          success: true,
          paymentId,
        };
      } else {
        console.log('❌ Payment processing failed');
        
        return {
          success: false,
          error: 'Payment was declined by your bank. Please try a different payment method.',
        };
      }
      
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed due to a technical error. Please try again.',
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      console.log('💰 Processing refund:', { paymentId, amount });

      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ Refund processed:', refundId);
      
      return {
        success: true,
        paymentId: refundId,
      };
      
    } catch (error: any) {
      console.error('❌ Refund processing error:', error);
      return {
        success: false,
        error: 'Refund processing failed',
      };
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      // Mock validation
      return paymentMethodId.startsWith('pm_') && paymentMethodId.length > 10;
    } catch {
      return false;
    }
  }
}

// backend/src/services/notification.service.ts - Notification & Email Service
interface NotificationData {
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
  meetingLink?: string;
  sessionType: string;
}

class NotificationService {
  /**
   * Setup session reminders
   */
  async setupSessionReminders(data: NotificationData): Promise<void> {
    try {
      console.log('🔔 Setting up session reminders for:', data.sessionId);

      const scheduledTime = new Date(data.scheduledTime);
      
      // Calculate reminder times
      const reminders = [
        { time: new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000), type: 'email', label: '24 hours' },
        { time: new Date(scheduledTime.getTime() - 60 * 60 * 1000), type: 'email', label: '1 hour' },
        { time: new Date(scheduledTime.getTime() - 15 * 60 * 1000), type: 'push', label: '15 minutes' },
        { time: new Date(scheduledTime.getTime() - 5 * 60 * 1000), type: 'push', label: '5 minutes' },
      ];

      // Filter out past reminders
      const now = new Date();
      const futureReminders = reminders.filter(reminder => reminder.time > now);

      // Schedule reminders (in production, use a job queue like Bull or Agenda)
      for (const reminder of futureReminders) {
        setTimeout(() => {
          this.sendReminder(data, reminder.type, reminder.label);
        }, reminder.time.getTime() - now.getTime());
      }

      console.log(`✅ ${futureReminders.length} reminders scheduled for session ${data.sessionId}`);

    } catch (error) {
      console.error('❌ Error setting up reminders:', error);
    }
  }

  /**
   * Send booking confirmation emails
   */
  async sendBookingConfirmation(data: any): Promise<void> {
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
      const studentEmail = {
        to: data.studentEmail,
        subject: `Booking Confirmed: ${data.subject} with ${data.mentorName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B4513;">Session Booking Confirmed! 🎉</h2>
            
            <p>Hi ${data.studentName},</p>
            
            <p>Your mentoring session has been successfully booked. Here are the details:</p>
            
            <div style="background: #F8F3EE; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #8B4513;">Session Details</h3>
              <p><strong>Mentor:</strong> ${data.mentorName}</p>
              <p><strong>Subject:</strong> ${data.subject}</p>
              <p><strong>Date:</strong> ${sessionDate}</p>
              <p><strong>Time:</strong> ${sessionTime}</p>
              <p><strong>Duration:</strong> ${data.duration} minutes</p>
              <p><strong>Type:</strong> ${data.sessionType.toUpperCase()} Session</p>
              ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
            </div>
            
            <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #166534;">What's Next?</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>You'll receive reminder emails 24 hours and 1 hour before your session</li>
                <li>The meeting link is ready to use at the scheduled time</li>
                <li>Check your calendar - we've added this event automatically</li>
                <li>Prepare any questions or materials you'd like to discuss</li>
              </ul>
            </div>
            
            <p>If you need to reschedule or cancel, please do so at least 24 hours in advance for a full refund.</p>
            
            <p>Looking forward to your learning session!</p>
            
            <p>Best regards,<br>The Mentoring Team</p>
          </div>
        `,
      };

      // Email to mentor
      const mentorEmail = {
        to: data.mentorEmail,
        subject: `New Session Booked: ${data.subject} with ${data.studentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B4513;">New Session Booked! 📚</h2>
            
            <p>Hi ${data.mentorName},</p>
            
            <p>You have a new mentoring session booked. Here are the details:</p>
            
            <div style="background: #F8F3EE; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #8B4513;">Session Details</h3>
              <p><strong>Student:</strong> ${data.studentName}</p>
              <p><strong>Subject:</strong> ${data.subject}</p>
              <p><strong>Date:</strong> ${sessionDate}</p>
              <p><strong>Time:</strong> ${sessionTime}</p>
              <p><strong>Duration:</strong> ${data.duration} minutes</p>
              <p><strong>Type:</strong> ${data.sessionType.toUpperCase()} Session</p>
              <p><strong>Amount:</strong> ${data.amount}</p>
              ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
            </div>
            
            <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #166534;">Preparation Reminders</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Review the subject material beforehand</li>
                <li>Prepare teaching materials or resources</li>
                <li>Test your audio/video setup before the session</li>
                <li>Join the meeting a few minutes early</li>
              </ul>
            </div>
            
            <p>This event has been added to your calendar with reminders set.</p>
            
            <p>Thank you for sharing your expertise!</p>
            
            <p>Best regards,<br>The Mentoring Team</p>
          </div>
        `,
      };

      // Send emails (implement actual email sending)
      await this.sendEmail(studentEmail);
      await this.sendEmail(mentorEmail);

      console.log('✅ Booking confirmation emails sent');

    } catch (error) {
      console.error('❌ Error sending booking confirmation:', error);
    }
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(data: any): Promise<void> {
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

      // Email to both parties
      const emails = [
        {
          to: data.studentEmail,
          recipient: data.studentName,
          other: data.mentorName,
        },
        {
          to: data.mentorEmail,
          recipient: data.mentorName,
          other: data.studentName,
        },
      ];

      for (const email of emails) {
        const emailData = {
          to: email.to,
          subject: `Session Cancelled: ${data.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #DC2626;">Session Cancelled</h2>
              
              <p>Hi ${email.recipient},</p>
              
              <p>The following mentoring session has been cancelled:</p>
              
              <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
                <h3 style="margin-top: 0; color: #DC2626;">Cancelled Session</h3>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Date:</strong> ${sessionDate}</p>
                <p><strong>Time:</strong> ${sessionTime}</p>
                <p><strong>Cancelled by:</strong> ${data.cancelledBy === 'student' ? data.studentName : data.mentorName}</p>
                <p><strong>Reason:</strong> ${data.reason}</p>
              </div>
              
              ${data.refundAmount > 0 ? `
                <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin-top: 0; color: #166534;">Refund Information</h4>
                  <p>A refund of ${data.refundAmount} will be processed within 3-5 business days.</p>
                </div>
              ` : ''}
              
              <p>We apologize for any inconvenience. You can book a new session anytime.</p>
              
              <p>Best regards,<br>The Mentoring Team</p>
            </div>
          `,
        };

        await this.sendEmail(emailData);
      }

      console.log('✅ Cancellation notifications sent');

    } catch (error) {
      console.error('❌ Error sending cancellation notifications:', error);
    }
  }

  /**
   * Send reschedule notification
   */
  async sendRescheduleNotification(data: any): Promise<void> {
    try {
      console.log('📧 Sending reschedule notifications...');

      const oldDate = new Date(data.oldTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const oldTime = new Date(data.oldTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const newDate = new Date(data.newTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const newTime = new Date(data.newTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const emails = [
        {
          to: data.studentEmail,
          recipient: data.studentName,
        },
        {
          to: data.mentorEmail,
          recipient: data.mentorName,
        },
      ];

      for (const email of emails) {
        const emailData = {
          to: email.to,
          subject: `Session Rescheduled: ${data.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #F59E0B;">Session Rescheduled</h2>
              
              <p>Hi ${email.recipient},</p>
              
              <p>Your mentoring session has been rescheduled:</p>
              
              <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400E;">Previous Time</h3>
                <p><strong>Date:</strong> ${oldDate}</p>
                <p><strong>Time:</strong> ${oldTime}</p>
              </div>
              
              <div style="background: #E8F5E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #166534;">New Time</h3>
                <p><strong>Date:</strong> ${newDate}</p>
                <p><strong>Time:</strong> ${newTime}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
              </div>
              
              <p>Your calendar has been updated with the new time. You'll receive reminder notifications as usual.</p>
              
              <p>Best regards,<br>The Mentoring Team</p>
            </div>
          `,
        };

        await this.sendEmail(emailData);
      }

      console.log('✅ Reschedule notifications sent');

    } catch (error) {
      console.error('❌ Error sending reschedule notifications:', error);
    }
  }

  /**
   * Send reminder notification
   */
  private async sendReminder(data: NotificationData, type: string, timeLabel: string): Promise<void> {
    try {
      console.log(`🔔 Sending ${type} reminder (${timeLabel}) for session:`, data.sessionId);

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

      if (type === 'email') {
        // Send email reminders
        const emails = [
          {
            to: data.studentEmail,
            recipient: data.studentName,
            role: 'student',
          },
          {
            to: data.mentorEmail,
            recipient: data.mentorName,
            role: 'mentor',
          },
        ];

        for (const email of emails) {
          const emailData = {
            to: email.to,
            subject: `Reminder: Your session starts in ${timeLabel}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #8B4513;">Session Reminder ⏰</h2>
                
                <p>Hi ${email.recipient},</p>
                
                <p>This is a friendly reminder that your mentoring session starts in ${timeLabel}.</p>
                
                <div style="background: #F8F3EE; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #8B4513;">Session Details</h3>
                  <p><strong>Subject:</strong> ${data.subject}</p>
                  <p><strong>Date:</strong> ${sessionDate}</p>
                  <p><strong>Time:</strong> ${sessionTime}</p>
                  <p><strong>Duration:</strong> ${data.duration} minutes</p>
                  ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="background: #8B4513; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Join Meeting</a></p>` : ''}
                </div>
                
                ${email.role === 'mentor' ? `
                  <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #166534;">Quick Checklist</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Review session materials</li>
                      <li>Test audio/video setup</li>
                      <li>Join 2-3 minutes early</li>
                    </ul>
                  </div>
                ` : `
                  <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #166534;">Get Ready</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Prepare your questions</li>
                      <li>Test your internet connection</li>
                      <li>Find a quiet space</li>
                    </ul>
                  </div>
                `}
                
                <p>See you soon!</p>
                
                <p>Best regards,<br>The Mentoring Team</p>
              </div>
            `,
          };

          await this.sendEmail(emailData);
        }
      } else if (type === 'push') {
        // Send push notifications (implement with FCM, OneSignal, etc.)
        await this.sendPushNotification({
          title: `Session starting in ${timeLabel}`,
          body: `${data.subject} with ${data.mentorName}`,
          userId: data.studentId,
          data: {
            sessionId: data.sessionId,
            meetingLink: data.meetingLink,
          },
        });

        await this.sendPushNotification({
          title: `Session starting in ${timeLabel}`,
          body: `${data.subject} with ${data.studentName}`,
          userId: data.mentorId,
          data: {
            sessionId: data.sessionId,
            meetingLink: data.meetingLink,
          },
        });
      }

      console.log(`✅ ${type} reminder sent (${timeLabel})`);

    } catch (error) {
      console.error(`❌ Error sending ${type} reminder:`, error);
    }
  }

  /**
   * Send email (implement with SendGrid, Mailgun, etc.)
   */
  private async sendEmail(emailData: any): Promise<void> {
    try {
      // Mock email sending
      console.log('📧 Email sent to:', emailData.to);
      console.log('📧 Subject:', emailData.subject);
      
      // In production, integrate with email service:
      // await sendgrid.send(emailData);
      // await mailgun.messages().send(emailData);
      
    } catch (error) {
      console.error('❌ Email sending failed:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notificationData: any): Promise<void> {
    try {
      // Mock push notification
      console.log('📱 Push notification sent to:', notificationData.userId);
      console.log('📱 Title:', notificationData.title);
      
      // In production, integrate with push service:
      // await fcm.send(notificationData);
      // await oneSignal.createNotification(notificationData);
      
    } catch (error) {
      console.error('❌ Push notification failed:', error);
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