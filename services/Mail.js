import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const validateEmailConfig = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY environment variable');
  }
};

let resend;
try {
  validateEmailConfig();
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✓ Resend API is ready to send emails');
} catch (error) {
  console.error('✗ Failed to initialize Resend:', error.message);
}

export const sendMail = async (options) => {
  try {
    if (!resend) throw new Error('Resend API not initialized');
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Missing required email fields: to, subject, or html');
    }

    // Using the default onboarding domain provided by Resend.
    // For a real app, you must verify your own domain in Resend and update this "from" address!
    const fromAddress = 'Askio Support <onboarding@resend.dev>';

    const data = await resend.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
    });

    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log(`✓ Email sent successfully to ${options.to}`);
    return { success: true, messageId: data.data?.id };
  } catch (error) {
    console.error(`✗ Error sending email to ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendVerificationEmail = async (email, username, verificationToken) => {
  try {
    const verificationLink = `${process.env.APP_URL || 'http://localhost:3030'}/api/auth/verify/${verificationToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .button:hover { background: #764ba2; }
            .warning { color: #d9534f; font-size: 12px; margin-top: 15px; }
            .link-text { word-break: break-all; color: #667eea; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification Required ✉️</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${username}</strong>,</p>
              <p>Thank you for registering! To complete your account setup, please verify your email address by clicking the button below.</p>
              <p>This link will expire in <strong>24 hours</strong>.</p>
              <center>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </center>
              <p class="warning">If the button above doesn't work, copy and paste this link in your browser:</p>
              <p class="link-text">${verificationLink}</p>
              <p class="warning">⚠️ If you did not create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Our Platform. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendMail({
      to: email,
      subject: `Email Verification - Welcome ${username}!`,
      html: htmlContent,
    });
  } catch (error) {
    console.error(`✗ Error sending verification email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, username) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Platform! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi <strong>\${username}</strong>,</p>
              <p>Thank you for registering! We're excited to have you on board.</p>
              <p>Your account has been successfully created and verified.</p>
              <p>You can now log in to your account and start exploring all the features we have to offer.</p>
              <p><strong>Account Details:</strong></p>
              <ul>
                <li>Email: ${email}</li>
                <li>Username: ${username}</li>
              </ul>
              <p>If you have any questions or need assistance, feel free to contact our support team.</p>
              <p>Happy exploring! 🚀</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Our Platform. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendMail({
      to: email,
      subject: `Welcome to Our Platform, ${username}!`,
      html: htmlContent,
    });
  } catch (error) {
    console.error(`✗ Error sending welcome email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendBulkMails = async (emails) => {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('Invalid emails array');
    }

    const results = [];
    for (const email of emails) {
      const result = await sendMail(email);
      results.push({ to: email.to, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✓ Bulk email completed: ${successCount}/${results.length} sent successfully`);
    
    return {
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      details: results,
    };
  } catch (error) {
    console.error('✗ Error sending bulk emails:', error.message);
    return { success: false, error: error.message };
  }
};

export default resend;