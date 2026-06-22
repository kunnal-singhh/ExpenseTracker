const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { sendVerificationEmail } = require("../utils/emailService");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Helper: sign JWT ──────────────────────────────────
const signToken = (id, isAdmin = false) =>
  jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isGoogleEmail = (email = "") => /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email);
const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  monthlyIncome: user.monthlyIncome,
  budgetAmount: user.budgetAmount,
  budgetPeriod: user.budgetPeriod,
  savingsGoal: user.savingsGoal,
  isAdmin: !!user.isAdmin,
});

// ─── @POST /api/auth/register ──────────────────────────
const register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isGoogleEmail(email)) {
      return res.status(400).json({ success: false, message: "Use a valid Google email address" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    
    const otp = generateOTP();
    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const emailResult = await sendVerificationEmail(email, name, otp);

    if (!emailResult.success) {
      // Clean up the user if email failed to send
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success: false, message: "Email failed: " + emailResult.error });
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please check your email for the verification code.",
      requiresVerification: true,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @POST /api/auth/login ─────────────────────────────
const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (!isGoogleEmail(email)) {
      return res.status(400).json({ success: false, message: "Use a valid Google email address" });
    }

    // Explicitly select password and verification fields
    const user = await User.findOne({ email }).select("+password +verificationCode +verificationCodeExpires");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Bypass verification for admins
    const needsVerification = !user.isVerified && !user.isAdmin;

    if (needsVerification) {
      const otp = generateOTP();
      user.verificationCode = otp;
      user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailResult = await sendVerificationEmail(email, user.name, otp);

      if (!emailResult.success) {
        return res.status(500).json({ success: false, message: "Email failed: " + emailResult.error });
      }

      return res.status(403).json({
        success: false,
        message: "Email not verified. A new verification code has been sent.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id, !!user.isAdmin);

    res.json({
      success: true,
      message: "Logged in successfully",
      token,
      user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @GET /api/auth/me  (protected) ───────────────────
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: userPayload(req.user),
  });
};

// ─── @POST /api/auth/verify ────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and verification code are required" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select("+verificationCode +verificationCodeExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please log in again to request a new code." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = signToken(user._id, !!user.isAdmin);

    res.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, verifyOTP };
