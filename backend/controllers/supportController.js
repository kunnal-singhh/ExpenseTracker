const SupportRequest = require("../models/SupportRequest.model");

const createSupportRequest = async (req, res) => {
  try {
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    const supportRequest = await SupportRequest.create({
      user: req.user._id,
      name: req.user.name || "",
      email: req.user.email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Support request submitted",
      supportRequest,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((error) => error.message).join(". ");
      return res.status(400).json({ success: false, message });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createSupportRequest };
