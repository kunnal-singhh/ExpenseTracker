const User = require("../models/User.model");
const bcrypt = require("bcryptjs");

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isGoogleEmail = (email = "") => /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email);
const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  occupation: user.occupation,
  monthlyIncome: user.monthlyIncome,
  monthlyBudget: user.monthlyBudget,
  savingsGoal: user.savingsGoal,
  preferredCurrency: user.preferredCurrency,
  spendingFocus: user.spendingFocus,
});

const optionalAmount = (value, label) => {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return number;
};

// ─── @PUT /api/user/profile ────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      avatar,
      occupation,
      monthlyIncome,
      monthlyBudget,
      savingsGoal,
      preferredCurrency,
      spendingFocus,
    } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      updates.name = name.trim();
    }
    if (avatar !== undefined) {
      const isValidAvatar =
        avatar === "" || /^data:image\/[a-z0-9.+-]+;base64,/i.test(avatar);
      if (!isValidAvatar) {
        return res.status(400).json({ success: false, message: "Upload a valid image file" });
      }
      updates.avatar = avatar;
    }
    if (occupation !== undefined) updates.occupation = occupation.trim();
    if (spendingFocus !== undefined) updates.spendingFocus = spendingFocus.trim();
    if (preferredCurrency !== undefined) updates.preferredCurrency = preferredCurrency;

    const parsedMonthlyIncome = optionalAmount(monthlyIncome, "Monthly income");
    const parsedMonthlyBudget = optionalAmount(monthlyBudget, "Monthly budget");
    const parsedSavingsGoal = optionalAmount(savingsGoal, "Savings goal");
    if (parsedMonthlyIncome !== undefined) updates.monthlyIncome = parsedMonthlyIncome;
    if (parsedMonthlyBudget !== undefined) updates.monthlyBudget = parsedMonthlyBudget;
    if (parsedSavingsGoal !== undefined) updates.savingsGoal = parsedSavingsGoal;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Profile updated",
      user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @PUT /api/user/password ───────────────────────────
const changeEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!isGoogleEmail(email)) {
      return res.status(400).json({ success: false, message: "Use a valid Google email address" });
    }

    const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: "Email updated", user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { updateProfile, changeEmail, changePassword };
