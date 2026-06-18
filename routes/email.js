import express from "express";
import emailAgent from "../aiServices/emailAgent.js";

const router = express.Router();

/**
 * POST /api/email/send
 * Send email using AI agent
 * Body: { message: "Send a verification email to user@example.com with a link..." }
 */
router.post("/send", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    // Use the email agent to process the request
    const result = await emailAgent(message);

    res.json({
      success: true,
      message: "Email processed successfully",
      result: result,
    });
  } catch (error) {
    console.error("Email Route Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process email request",
      details: error.message,
    });
  }
});

/**
 * POST /api/email/send-direct
 * Send email with direct parameters (without AI interpretation)
 * Body: { to: "user@example.com", subject: "...", html: "...", text: "..." }
 */
router.post("/send-direct", async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    // Create a structured message for the agent
    const structuredMessage = `
Send an email with the following details:
- To: ${to}
- Subject: ${subject}
- HTML Content: ${html}
${text ? `- Text Content: ${text}` : ""}
    `.trim();

    const result = await emailAgent(structuredMessage);

    res.json({
      success: true,
      message: "Email sent successfully",
      result: result,
    });
  } catch (error) {
    console.error("Direct Email Route Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send email",
      details: error.message,
    });
  }
});

export default router;
