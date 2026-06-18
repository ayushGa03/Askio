import { sendMail, sendVerificationEmail } from "../services/Mail.js";

/**
 * Email Agent - Processes email requests using AI-powered parsing
 * @param {string} message - The email request message
 * @returns {Promise<Object>} - Result of email processing
 */
async function emailAgent(message) {
  try {
    // Parse the message to extract email details
    // This is a simple implementation - can be enhanced with actual AI parsing
    
    // For now, return a simple response
    console.log("Email Agent received message:", message);
    
    // Parse common email patterns from the message
    const emailRegex = /to[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const subjectRegex = /subject[:\s]+([^\n]+)/i;
    const htmlRegex = /html[:\s]*content[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n|$)/i;
    
    const toMatch = message.match(emailRegex);
    const subjectMatch = message.match(subjectRegex);
    const htmlMatch = message.match(htmlRegex);
    
    if (toMatch && subjectMatch && htmlMatch) {
      const mailOptions = {
        to: toMatch[1],
        subject: subjectMatch[1].trim(),
        html: htmlMatch[1].trim(),
      };
      
      const result = await sendMail(mailOptions);
      return {
        success: result.success,
        message: result.success ? "Email sent successfully" : "Failed to send email",
        messageId: result.messageId,
        error: result.error,
      };
    }
    
    return {
      success: false,
      message: "Could not parse email details from message",
      parsedMessage: message,
    };
  } catch (error) {
    console.error("Email Agent Error:", error);
    return {
      success: false,
      message: "Error processing email request",
      error: error.message,
    };
  }
}

export default emailAgent;
