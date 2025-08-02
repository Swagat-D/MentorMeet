// src/services/email.service.ts - Email Service for OTP and Notifications (Fixed)
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/environment';
import { OTPType } from '../models/OTP.model';

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email service class
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create nodemailer transporter based on configuration
   */
  private createTransporter(): nodemailer.Transporter {
    if (emailConfig.service === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass, // App password for Gmail
        },
      });
    }

    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  /**
   * Verify email service connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Send OTP email
   */
  async sendOTP(
    email: string,
    code: string,
    type: OTPType,
    userName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.getOTPTemplate(code, type, userName);
      
      const mailOptions = {
        from: {
          name: 'MentorMatch',
          address: emailConfig.from,
        },
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`OTP email sent to ${email} (Type: ${type})`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(
    email: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.getWelcomeTemplate(userName);
      
      const mailOptions = {
        from: {
          name: 'MentorMatch',
          address: emailConfig.from,
        },
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Welcome email sent to ${email}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send password reset success notification
   */
  async sendPasswordResetSuccessEmail(
    email: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.getPasswordResetSuccessTemplate(userName);
      
      const mailOptions = {
        from: {
          name: 'MentorMatch',
          address: emailConfig.from,
        },
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Password reset success email sent to ${email}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Failed to send password reset success email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Add these methods to your EmailService class:

/**
 * Get booking confirmation template
 */
private getBookingConfirmationTemplate(data: any): EmailTemplate {
  const isForMentor = data.isForMentor;
  const recipientName = isForMentor ? data.mentorName : data.studentName;
  const otherPartyName = isForMentor ? data.studentName : data.mentorName;
  
  const subject = `${isForMentor ? 'New Session Booked' : 'Booking Confirmed'}: ${data.subject}`;
  
  const text = `
Hi ${recipientName},

${isForMentor ? 'Great news! A new session has been booked.' : 'Your session has been confirmed!'}

Session Details:
- ${isForMentor ? 'Student' : 'Mentor'}: ${otherPartyName}
- Subject: ${data.subject}
- Date: ${data.sessionDate}
- Time: ${data.sessionTime}
- Duration: ${data.duration} minutes
${data.meetingLink ? `- Meeting Link: ${data.meetingLink}` : ''}

${isForMentor ? 'Please prepare for the session and join on time.' : 'Looking forward to your learning session!'}

Best regards,
MentorMatch Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #8b4513; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .details { background: #f8f3ee; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .meeting-link { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MentorMatch</h1>
      <h2>${isForMentor ? '📚 New Session Booked!' : '🎉 Booking Confirmed!'}</h2>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>${isForMentor ? 'Great news! A new mentoring session has been booked.' : 'Your mentoring session has been confirmed!'}</p>
      
      <div class="details">
        <h3>📋 Session Details</h3>
        <p><strong>${isForMentor ? 'Student' : 'Mentor'}:</strong> ${otherPartyName}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Date:</strong> ${data.sessionDate}</p>
        <p><strong>Time:</strong> ${data.sessionTime}</p>
        <p><strong>Duration:</strong> ${data.duration} minutes</p>
      </div>
      
      ${data.meetingLink ? `
      <div class="meeting-link">
        <h3>🎥 Meeting Link</h3>
        <a href="${data.meetingLink}" style="color: white; text-decoration: none;">
          <strong>Join Google Meet</strong>
        </a>
      </div>
      ` : ''}
      
      <p>${isForMentor ? 'Please prepare for the session and join on time.' : 'Looking forward to your learning session!'}</p>
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

/**
 * Get cancellation template
 */
private getCancellationTemplate(data: any): EmailTemplate {
  const subject = `Session Cancelled: ${data.subject}`;
  
  const text = `
Hi there,

The following session has been cancelled:

Subject: ${data.subject}
Date: ${data.sessionDate}
Time: ${data.sessionTime}
Cancelled by: ${data.cancelledBy}
Reason: ${data.reason}

${data.refundAmount ? `A refund of $${data.refundAmount} will be processed.` : ''}

Best regards,
MentorMatch Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .details { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MentorMatch</h1>
      <h2>❌ Session Cancelled</h2>
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
      
      ${data.refundAmount ? `<p>💰 A refund of $${data.refundAmount} will be processed within 3-5 business days.</p>` : ''}
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

/**
 * Get reschedule template
 */
private getRescheduleTemplate(data: any): EmailTemplate {
  const subject = `Session Rescheduled: ${data.subject}`;
  
  const text = `
Hi there,

Your session has been rescheduled:

Subject: ${data.subject}
Old Time: ${data.oldDate} at ${data.oldTime}
New Time: ${data.newDate} at ${data.newTime}

${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}

Best regards,
MentorMatch Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .old-time { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .new-time { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MentorMatch</h1>
      <h2>🔄 Session Rescheduled</h2>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>Your session <strong>"${data.subject}"</strong> has been rescheduled:</p>
      
      <div class="old-time">
        <h4>Previous Time:</h4>
        <p>${data.oldDate} at ${data.oldTime}</p>
      </div>
      
      <div class="new-time">
        <h4>New Time:</h4>
        <p>${data.newDate} at ${data.newTime}</p>
      </div>
      
      ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">Join Meeting</a></p>` : ''}
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

/**
 * Get reminder template
 */
private getReminderTemplate(data: any): EmailTemplate {
  const isForMentor = data.isForMentor;
  const recipientName = isForMentor ? data.mentorName : data.studentName;
  
  const subject = `Reminder: Session starts ${data.timeUntilSession}`;
  
  const text = `
Hi ${recipientName},

This is a reminder that your session starts ${data.timeUntilSession}:

Subject: ${data.subject}
Date: ${data.sessionDate}
Time: ${data.sessionTime}
Duration: ${data.duration} minutes

${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}

${isForMentor ? 'Please prepare your materials and join on time.' : 'Get ready for your learning session!'}

Best regards,
MentorMatch Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #8b4513; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .reminder { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .meeting-link { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MentorMatch</h1>
      <h2>⏰ Session Reminder</h2>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      
      <div class="reminder">
        <h3>🔔 Your session starts ${data.timeUntilSession}!</h3>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Date:</strong> ${data.sessionDate}</p>
        <p><strong>Time:</strong> ${data.sessionTime}</p>
        <p><strong>Duration:</strong> ${data.duration} minutes</p>
      </div>
      
      ${data.meetingLink ? `
      <div class="meeting-link">
        <a href="${data.meetingLink}" style="color: white; text-decoration: none;">
          <strong>🎥 Join Meeting Now</strong>
        </a>
      </div>
      ` : ''}
      
      <p>${isForMentor ? 'Please prepare your materials and join on time.' : 'Get ready for your learning session!'}</p>
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

  /**
   * Get OTP email template
   */
  private getOTPTemplate(code: string, type: OTPType, userName?: string): EmailTemplate {
  const formattedCode = code.replace(/(\d{3})(\d{3})/, '$1 $2');
  const expiresInMinutes = Math.floor((parseInt(process.env.OTP_EXPIRES_IN || '10')));
  
  let subject: string;
  let heading: string;
  let description: string;
  let instructions: string;

  switch (type) {
    case OTPType.EMAIL_VERIFICATION:
      subject = 'Verify Your Email - MentorMatch';
      heading = 'Welcome to MentorMatch!';
      description = 'Thank you for joining MentorMatch. To complete your registration and start your learning journey, please verify your email address.';
      instructions = 'Enter this verification code in the app to verify your email address:';
      break;
    
    case OTPType.PASSWORD_RESET:
      subject = 'Reset Your Password - MentorMatch';
      heading = 'Password Reset Request';
      description = 'You requested to reset your password. Use the code below to create a new password.';
      instructions = 'Enter this code in the app to reset your password:';
      break;
    
    default:
      subject = 'Verification Code - MentorMatch';
      heading = 'Verification Required';
      description = 'Please use the verification code below to proceed.';
      instructions = 'Your verification code is:';
  }

  const text = `
Hi ${userName || 'there'},

${description}

${instructions}

${formattedCode}

This code expires in ${expiresInMinutes} minutes.

If you didn't request this code, please ignore this email and ensure your account is secure.

Best regards,
The MentorMatch Team

---
MentorMatch - Connecting minds, shaping futures
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #fefbf3; 
    }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { 
      text-align: center; 
      padding: 30px 0; 
      border-bottom: 3px solid #8b5a3c;
      margin-bottom: 30px;
    }
    .logo { 
      font-size: 32px; 
      font-weight: bold; 
      color: #4a3728;
      margin-bottom: 8px;
    }
    .tagline {
      font-size: 14px;
      color: #8b7355;
      font-style: italic;
    }
    .content { 
      background: #ffffff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(139, 115, 85, 0.1);
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #4a3728;
      margin-bottom: 20px;
    }
    .description {
      color: #6B7280;
      margin-bottom: 25px;
      line-height: 1.6;
    }
    .instructions {
      font-weight: 600;
      color: #4a3728;
      margin-bottom: 20px;
    }
    .otp-container {
      text-align: center;
      margin: 30px 0;
    }
    .otp-code { 
      background: linear-gradient(135deg, #8b5a3c, #d97706); 
      color: white; 
      font-size: 36px; 
      font-weight: bold; 
      letter-spacing: 12px; 
      padding: 25px 20px; 
      border-radius: 12px; 
      display: inline-block;
      box-shadow: 0 4px 12px rgba(139, 90, 60, 0.3);
    }
    .expiry {
      background-color: #FEF3C7;
      border: 1px solid #F59E0B;
      padding: 15px;
      border-radius: 8px;
      margin: 25px 0;
      color: #92400E;
      font-weight: 500;
    }
    .security-note { 
      background-color: #F3F4F6; 
      border-left: 4px solid #8b5a3c;
      padding: 15px 20px; 
      border-radius: 0 8px 8px 0; 
      margin: 25px 0; 
      color: #4B5563;
    }
    .footer { 
      text-align: center; 
      padding: 20px 0; 
      border-top: 1px solid #E5E7EB; 
      color: #8b7355; 
      font-size: 14px; 
    }
    .button {
      background: linear-gradient(135deg, #8b5a3c, #d97706);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      display: inline-block;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MentorMatch</div>
      <div class="tagline">Connecting minds, shaping futures</div>
    </div>
    
    <div class="content">
      <h1 style="color: #4a3728; margin-top: 0;">${heading}</h1>
      
      <div class="greeting">Hi ${userName || 'there'},</div>
      
      <div class="description">${description}</div>
      
      <div class="instructions">${instructions}</div>
      
      <div class="otp-container">
        <div class="otp-code">${formattedCode}</div>
      </div>
      
      <div class="expiry">
        <strong>⏰ Important:</strong> This code expires in ${expiresInMinutes} minutes for your security.
      </div>
      
      <div class="security-note">
        <strong>🔒 Security Note:</strong> If you didn't request this code, please ignore this email and consider changing your password if you have an account with us. Never share your verification codes with anyone.
      </div>

      ${type === OTPType.EMAIL_VERIFICATION ? `
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #8b7355; margin-bottom: 15px;">Having trouble? Need help?</p>
        <a href="mailto:support@mentormatch.com" class="button">Contact Support</a>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>This email was sent by MentorMatch</p>
      <p>© 2024 MentorMatch. All rights reserved.</p>
      <p style="font-size: 12px; color: #9CA3AF; margin-top: 15px;">
        If you're having trouble with the verification code, please check your spam folder or contact our support team.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

  /**
   * Get welcome email template
   */
  private getWelcomeTemplate(userName: string): EmailTemplate {
    const subject = 'Welcome to MentorMatch! 🎉';
    
    const text = `
Hi ${userName},

Welcome to MentorMatch! 🎉

Your email has been verified and your account is now active. You're all set to start your learning journey with expert mentors.

What's next?
1. Complete your profile setup
2. Browse our amazing mentors
3. Book your first learning session

We're excited to help you achieve your learning goals!

Best regards,
MentorMatch Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fefbf3; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-size: 28px; font-weight: bold; color: #4a3728; }
    .content { padding: 20px 0; }
    .steps { background: #fff; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MentorMatch</div>
      <h1 style="color: #4a3728;">Welcome Aboard! 🎉</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Your email has been verified and your account is now active! We're excited to help you achieve your learning goals.</p>
      
      <div class="steps">
        <h3 style="color: #8b5a3c;">What's next?</h3>
        <ol>
          <li>Complete your profile setup</li>
          <li>Browse our amazing mentors</li>
          <li>Book your first learning session</li>
        </ol>
      </div>
      
      <p>Ready to start learning? Let's go! 🚀</p>
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  /**
   * Get password reset success template
   */
  private getPasswordResetSuccessTemplate(userName: string): EmailTemplate {
    const subject = 'Password Reset Successful - MentorMatch';
    
    const text = `
Hi ${userName},

Your password has been successfully reset.

If you didn't make this change, please contact our support team immediately.

Best regards,
MentorMatch Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fefbf3; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-size: 28px; font-weight: bold; color: #4a3728; }
    .content { padding: 20px 0; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MentorMatch</div>
    </div>
    
    <div class="content">
      <h2 style="color: #059669;">✅ Password Reset Successful</h2>
      <p>Hi ${userName},</p>
      <p>Your password has been successfully reset. You can now use your new password to sign in.</p>
      <p><strong>If you didn't make this change, please contact our support team immediately.</strong></p>
    </div>
    
    <div class="footer">
      <p>© 2024 MentorMatch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;