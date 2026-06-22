const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

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
      return res.status(409).json({ success: false, message: "This email address is already registered" });
    }

    const user = await User.create({ name, email, password });
    
    // Automatically log the user in after registration
    const token = signToken(user._id, !!user.isAdmin);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: userPayload(user),
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

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
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

module.exports = { register, login, getMe };
