const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("../models/User.model");

const initCronJobs = () => {
  // Run on the 1st of every month at midnight (0 0 1 * *)
  cron.schedule("0 0 1 * *", async () => {
    console.log("Running monthly cron job: resetting budgetAlertSentForPeriod for all users...");
    try {
      const result = await User.updateMany(
        {},
        { $set: { budgetAlertSentForPeriod: false } }
      );
      console.log(`Successfully reset budget alerts for ${result.modifiedCount} users.`);
    } catch (error) {
      console.error("Error in monthly budget reset cron job:", error);
    }
  });
};

module.exports = { initCronJobs };
