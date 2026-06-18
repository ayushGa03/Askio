import nodeMailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

// Validate required environment variables
const validateEmailConfig = () => {
  const required = ['GOOGLE_USER', 'GOOGLE_APP_PASSWORD'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Create transporter with Gmail App Password
let transporter;

try {
  validateEmailConfig();
  
  // Suppress console output from nodemailer temporarily
  const originalLog = console.log;
  console.log = () => {};
  
  try {
    transporter = nodeMailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    // Verify transporter configuration
    transporter.verify()
      .then(() => {
        console.log('✓ Email transporter is ready to send emails');
      })
      .catch((err) => {
        console.error('✗ Email transporter verification failed:', err.message);
      });
  } finally {
    console.log = originalLog;
  }
} catch (error) {
  console.error('✗ Failed to initialize email transporter:', error.message)
}

/**
 * Send email with enhanced error handling
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.text] - Email text content (optional)
 * @returns {Promise<Object>} - Mail response or error
 */
export const sendMail = async (options) => {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    if (!options.to || !options.subject || !options.html) {
      throw new Error('Missing required email fields: to, subject, or html');
    }

    const mailOptions = {
  from: process.env.GOOGLE_USER,
  to: options.to,
  subject: options.subject,
  html: options.html,
};

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${options.to}:`, info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`✗ Error sending email to ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
};
export default sendMail;