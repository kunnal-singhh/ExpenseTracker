const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("../models/User.model");

const initCronJobs = () => {
  // Run every hour to delete unverified users whose OTP has expired
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Cron] Running cleanup for expired unverified accounts...");
      const result = await User.deleteMany({
        isVerified: false,
        verificationCodeExpires: { $lt: new Date() },
      });
      if (result.deletedCount > 0) {
        console.log(`[Cron] Deleted ${result.deletedCount} unverified accounts.`);
      }
    } catch (error) {
      console.error("[Cron] Failed to run cleanup job:", error);
    }
  });
};

module.exports = { initCronJobs };
