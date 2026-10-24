
import { EventEmitter } from "node:events";
import { sendEmail } from "./send.email.js";
import { verifyEmailTemplate } from "./email.templates.js";

export const emailEvent = new EventEmitter();

emailEvent.on(
  "sendEmail",
  async ({ recipient, subject, data }) => {
    console.log("1. Email event triggered");
    console.log("2. Recipient:", recipient);

    try {

      const html = verifyEmailTemplate({
        ...data,
        subject: data.template,
      });

      console.log("3. HTML template generated");

      const result = await sendEmail({
        ...recipient,
        subject,
        html,
      });

      if (!result) {
        throw new Error("sendEmail returned undefined");
      }

      console.log("4. Email sent:", result.messageId);
    } catch (error) {
      console.error("Email sending failed:", error);
    }
  }
);
