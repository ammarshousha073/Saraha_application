import { EmailSubjectEnum } from "../../enum/email.enum.js";

export const templates = {
  [EmailSubjectEnum.CONFIRM_EMAIL]: (data) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Email</title>
      </head>
      <body style="font-family: Arial; background: #f4f5fb; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
          <h1 style="color: #6558e8;">Saraha.</h1>
          <h2>Confirm Your Email</h2>
          <p>Hello ${data.username || "there"},</p>
          <p>Use the following code to verify your email address:</p>
          <h1 style="text-align: center; color: #6558e8; letter-spacing: 8px;">
            ${data.code}
          </h1>
          <p>This code expires in ${data.expiresInMinutes || 10} minutes.</p>
          <p>If you didn't create an account, ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  },

  [EmailSubjectEnum.FORGOT_PASSWORD]: (data) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forgot Password</title>
      </head>
      <body style="font-family: Arial; background: #f4f5fb; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
          <h1 style="color: #6558e8;">Saraha.</h1>
          <h2>Reset Your Password</h2>
          <p>Hello ${data.username || "there"},</p>
          <p>We received a request to reset your password.</p>
          <p>Your reset code is:</p>
          <h1 style="text-align: center; color: #6558e8; letter-spacing: 8px;">
            ${data.code}
          </h1>
          <p>This code expires in ${data.expiresInMinutes || 10} minutes.</p>
          <p>If you didn't request a password reset, ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  },

  [EmailSubjectEnum.RESEND_OTP]: (data) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Verification Code</title>
      </head>
      <body style="font-family: Arial; background: #f4f5fb; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
          <h1 style="color: #6558e8;">Saraha.</h1>
          <h2>Your New Verification Code</h2>
          <p>Hello ${data.username || "there"},</p>
          <p>You requested a new verification code:</p>
          <h1 style="text-align: center; color: #6558e8; letter-spacing: 8px;">
            ${data.code}
          </h1>
          <p>This code expires in ${data.expiresInMinutes || 10} minutes.</p>
          <p>If you didn't request a new code, ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  },

  [EmailSubjectEnum.WELCOME_EMAIL]: (data) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Saraha</title>
      </head>
      <body style="font-family: Arial; background: #f4f5fb; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
          <h1 style="color: #6558e8;">Saraha.</h1>
          <h2>Welcome to Saraha, ${data.username || "there"}!</h2>
          <p>Your email has been verified successfully.</p>
          <p>Your account is ready. We're happy to have you with us!</p>
          <p>Made for honest conversations.</p>
        </div>
      </body>
      </html>
    `;
  },

  [EmailSubjectEnum.PASSWORD_CHANGED]: (data) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
      </head>
      <body style="font-family: Arial; background: #f4f5fb; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
          <h1 style="color: #6558e8;">Saraha.</h1>
          <h2>Password Changed Successfully</h2>
          <p>Hello ${data.username || "there"},</p>
          <p>Your account password has been changed successfully.</p>
          <p>If you didn't make this change, secure your account immediately.</p>
        </div>
      </body>
      </html>
    `;
  },
};

export const verifyEmailTemplate = (data) => {
  const template = templates[data.subject];

  if (typeof template !== "function") {
    throw new Error(`Email template "${data.subject}" not found`);
  }

  return template(data);
};
