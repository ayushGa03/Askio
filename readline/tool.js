import sendEmail from "./sendMail.js";
import { tool } from "@langchain/core/tools";
import * as z from "zod";


const emailTool = tool(
  async ({ to, subject, html }) => {
    return await sendEmail({
      to,
      subject,
      html,
    });
  },
  {
    name: "sendEmail",
    description:
      "Use this tool to send an email. Provide recipient email, subject and html content.",
    schema: z.object({
      to: z.string().email(),
      subject: z.string(),
      html: z.string(),
    }),
  }
);
export default emailTool;