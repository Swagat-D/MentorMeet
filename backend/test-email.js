// test-email.js
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load env vars
dotenv.config({ path: '.env.development' });

async function testEmail() {
  console.log('🧪 Testing email configuration...');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('📧 Email config:', {
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS?.length,
      passPreview: process.env.EMAIL_PASS?.substring(0, 4) + '...',
    });

    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: '🧪 MentorMatch Email Test',
      text: 'This is a test email.',
    });

    console.log('✅ Test email sent:', result.messageId);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();
