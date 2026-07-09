const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const { sendVerificationEmail } = require("../utils/emailService");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
});

const clearRefreshCookieOptions = () => {
  const { maxAge, ...options } = refreshCookieOptions();
  return options;
};

// ─── Helper: Tokens ──────────────────────────────────
const signAccessToken = (id, isAdmin = false) =>
  jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

const handleTokens = async (user, req, res) => {
  const refreshToken = signRefreshToken(user._id);
  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  await Session.create({
    user: user._id,
    refreshTokenHash,
    ip: req.ip || "unknown",
    useAgent: req.headers["user-agent"] || "unknown",
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
  });

  const accessToken = signAccessToken(user._id, !!user.isAdmin);

  res.cookie("refreshToken", refreshToken, refreshCookieOptions());

  return accessToken;
};

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

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isGoogleEmail(email)) {
      return res.status(400).json({ success: false, message: "Use a valid Google email address" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "This email address is already registered" });
    }

    const user = await User.create({ name, email, password });

    const otp = generateOTP();
    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailResult = await sendVerificationEmail(email, name, otp);

    if (!emailResult.success) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success: false, message: emailResult.error });
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
        return res.status(500).json({ success: false, message: emailResult.error });
      }

      return res.status(403).json({
        success: false,
        message: "Email not verified. A new verification code has been sent.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = await handleTokens(user, req, res);

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
      return res.status(404).json({ success: false, message: "No account found with this email address" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "This email is already verified. Please log in." });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: "The verification code you entered is incorrect" });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Your verification code has expired. Please log in again to get a new one." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = await handleTokens(user, req, res);

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

// ─── Refresh Token ──────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "Refresh token not found" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    const session = await Session.findOne({
      refreshTokenHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session) return res.status(401).json({ success: false, message: "Invalid refresh token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const newRefreshToken = signRefreshToken(user._id);
    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    
    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
    await session.save();

    const accessToken = signAccessToken(user._id, !!user.isAdmin);

    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions());

    res.json({ success: true, message: "Token refreshed", token: accessToken });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// ─── Logout ───────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const session = await Session.findOne({ refreshTokenHash, revoked: false });
      if (session) {
        session.revoked = true;
        await session.save();
      }
    }
    res.clearCookie("refreshToken", clearRefreshCookieOptions());
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const logoutAllSessions = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await Session.updateMany({ user: decoded.id }, { revoked: true });
    }
    res.clearCookie("refreshToken", clearRefreshCookieOptions());
    res.json({ success: true, message: "Logged out from all sessions" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, verifyOTP, refreshToken, logout, logoutAllSessions };
