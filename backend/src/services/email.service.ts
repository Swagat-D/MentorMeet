// src/services/email.service.ts - Email Service for OTP and Notifications
import nodemailer from 'nodemailer';
import { emailConfig } from '@/config/environment';
import { OTPType } from '@/models/OTP.model';

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

  /**
   * Get OTP email template
   */
  private getOTPTemplate(code: string, type: OTPType, userName?: string): EmailTemplate {
    const formattedCode = code.replace(/(\d{3})(\d{3})/, '$1 $2');
    const expiresInMinutes = Math.floor((parseInt(process.env.OTP_EXPIRES_IN || '10')));
    
    let subject: string;
    let heading: string;
    let description: string;

    switch (type) {
      case OTPType.EMAIL_VERIFICATION:
        subject = 'Verify Your Email - MentorMatch';
        heading = 'Verify Your Email Address';
        description = 'Welcome to MentorMatch! Please verify your email address to complete your registration.';
        break;
      
      case OTPType.PASSWORD_RESET:
        subject = 'Reset Your Password - MentorMatch';
        heading = 'Reset Your Password';
        description = 'You requested to reset your password. Use the code below to create a new password.';
        break;
      
      default:
        subject = 'Verification Code - MentorMatch';
        heading = 'Verification Required';
        description = 'Please use the verification code below to proceed.';
    }

    const text = `
Hi ${userName || 'there'},

${description}

Your verification code is: ${formattedCode}

This code expires in ${expiresInMinutes} minutes.

If you didn't request this code, please ignore this email.

Best regards,
MentorMatch Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fefbf3; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8b5a3c; }
    .logo { font-size: 28px; font-weight: bold; color: #4a3728; }
    .content { padding: 30px 0; }
    .otp-code { background: linear-gradient(135deg, #8b5a3c, #d97706); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MentorMatch</div>
    </div>
    
    <div class="content">
      <h2 style="color: #4a3728;">${heading}</h2>
      <p>Hi ${userName || 'there'},</p>
      <p>${description}</p>
      
      <div class="otp-code">${formattedCode}</div>
      
      <p><strong>This code expires in ${expiresInMinutes} minutes.</strong></p>
      
      <div class="warning">
        <p><strong>Security Note:</strong> If you didn't request this code, please ignore this email. Never share your verification codes with anyone.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>This email was sent by MentorMatch</p>
      <p>© 2024 MentorMatch. All rights reserved.</p>
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