// ─── Brevo (Sendinblue) Email Service via HTTPS API ─────
// No SMTP needed — sends emails over standard HTTPS (Port 443)
// Works perfectly on Render's free tier where SMTP ports are blocked

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Send an email using Brevo's HTTP API
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "noreply@expense-tracker.app";

  if (!apiKey) {
    console.warn("BREVO_API_KEY not set. Skipping email.");
    return { success: false, error: "The server is not configured to send emails. Please contact support." };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Expense Tracker", email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Brevo API error:", response.status, errorData);

      if (response.status === 401) {
        return { success: false, error: "The server's email system has an authentication issue." };
      }
      if (response.status === 429) {
        return { success: false, error: "Too many emails sent. Please try again later." };
      }
      return { success: false, error: "We couldn't send the email right now. Please try again later." };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "We couldn't send the email right now. Please try again later." };
  }
};

// ─── Budget Alert Email ─────────────────────────────────
const sendBudgetAlertEmail = async (toEmail, userName, budgetAmount, totalExpenses, budgetPeriod = "monthly") => {
  const periodLabel = budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1);
  const timeRemaining = budgetPeriod === "daily" ? "day" : budgetPeriod === "weekly" ? "week" : budgetPeriod === "yearly" ? "year" : "month";

  const result = await sendEmail({
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
  });

  if (result.success) {
    console.log(`Budget alert email sent successfully to ${toEmail}`);
  }
  return result.success;
};

// ─── Verification OTP Email ─────────────────────────────
const sendVerificationEmail = async (toEmail, userName, code) => {
  const result = await sendEmail({
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
  });

  if (result.success) {
    console.log(`Verification email sent successfully to ${toEmail}`);
  }
  return result;
};

module.exports = { sendBudgetAlertEmail, sendVerificationEmail };
