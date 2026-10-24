
import nodemailer from "nodemailer";
import {
  APP_EMAIL,
  APP_PASSWORD,
  APPLICATION_NAME,
} from "../../../config.js";
import { BadRequestException } from "../../exeptions/error.exeptions.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments = [],
}) => {
  if (
    !to?.length &&
    !cc?.length &&
    !bcc?.length
  ) {
    throw BadRequestException(
      "At least one recipient (to, cc, or bcc) must be provided."
    );
  }

  try {
    const info = await transporter.sendMail({
      from: `${APPLICATION_NAME} <${APP_EMAIL}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Message sent:", info.messageId);
    console.log(
      "Preview URL:",
      nodemailer.getTestMessageUrl(info)
    );

    return info;
  } catch (err) {
    console.error("Error while sending mail:", err);
    throw err;
  }
};
