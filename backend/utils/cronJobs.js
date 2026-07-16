const cron = require("node-cron");
const User = require("../models/User.model");
const https = require("https");
const http = require("http");

const initCronJobs = () => {
  // Run every hour to delete unverified users whose OTP has expired
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await User.deleteMany({
        isVerified: false,
        verificationCodeExpires: { $lt: new Date() },
      });
      if (result.deletedCount > 0) {
        console.log(`[Cron] Deleted ${result.deletedCount} expired unverified accounts.`);
      }
    } catch (error) {
      console.error("[Cron] Cleanup job failed:", error);
    }
  });

  // Self-ping every 14 minutes to prevent sleeping on free tiers
  cron.schedule("*/14 * * * *", () => {
    const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const url = `${backendUrl}/api/health`;
    
    console.log(`[Cron] Pinging server at ${url} to keep alive...`);
    
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log("[Cron] Ping successful");
      } else {
        console.log(`[Cron] Ping failed with status: ${res.statusCode}`);
      }
    }).on("error", (err) => {
      console.error("[Cron] Ping error:", err.message);
    });
  });
};

module.exports = { initCronJobs };
