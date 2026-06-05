const nodemailer = require("nodemailer");

// Create a transporter using environment variables.
// Use EMAIL_HOST if provided, otherwise default to Gmail service
const transporter = nodemailer.createTransport({
  ...(process.env.EMAIL_HOST ? { host: process.env.EMAIL_HOST } : { service: "gmail" }),
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendBudgetAlertEmail = async (toEmail, userName, budgetAmount, totalExpenses, budgetPeriod = "monthly") => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping budget alert email.");
    return false;
  }

  const periodLabel = budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1);
  const timeRemaining = budgetPeriod === "daily" ? "day" : budgetPeriod === "weekly" ? "week" : budgetPeriod === "yearly" ? "year" : "month";

  const mailOptions = {
    from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "⚠️ Budget Exceeded Alert",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Budget Alert!</h2>
        <p>Hi ${userName},</p>
        <p>This is an automated alert to let you know that you have exceeded your ${budgetPeriod} budget.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Your ${periodLabel} Budget:</strong> ${budgetAmount}</p>
          <p style="margin: 5px 0; color: #ef4444;"><strong>Current Total Expenses:</strong> ${totalExpenses}</p>
        </div>
        <p>Consider reviewing your recent transactions to see where you can cut back for the rest of the ${timeRemaining}.</p>
        <p>Best,<br>Your Expense Tracker Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Budget alert email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send budget alert email:", error);
    return false;
  }
};

const sendVerificationEmail = async (toEmail, userName, code) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping verification email.");
    return false;
  }

  const mailOptions = {
    from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify Your Email - Expense Tracker",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Expense Tracker!</h2>
        <p>Hi ${userName},</p>
        <p>Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="margin: 0; letter-spacing: 5px; color: #1e293b;">${code}</h1>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best,<br>Your Expense Tracker Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
};

module.exports = { sendBudgetAlertEmail, sendVerificationEmail };
