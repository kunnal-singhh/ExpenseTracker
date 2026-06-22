const cron = require("node-cron");
const User = require("../models/User.model");

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
};

module.exports = { initCronJobs };
