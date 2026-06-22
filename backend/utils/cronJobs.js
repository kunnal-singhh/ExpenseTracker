const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("../models/User.model");

const initCronJobs = () => {
  // No cron jobs currently active
};

module.exports = { initCronJobs };
