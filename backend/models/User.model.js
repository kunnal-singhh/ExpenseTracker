const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@(gmail\.com|googlemail\.com)$/i, "Please enter a valid Google email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password in queries by default
    },
    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false, // hidden by default
    },
    verificationCodeExpires: {
      type: Date,
      select: false,
      index: { expires: 0 } // TTL index: automatically delete document when this date is reached
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },

    monthlyIncome: {
      type: Number,
      min: [0, "Monthly income cannot be negative"],
      default: null,
    },
    budgetAmount: {
      type: Number,
      min: [0, "Budget amount cannot be negative"],
      default: null,
    },
    budgetPeriod: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
    },
    lastBudgetAlertDate: {
      type: Date,
      default: null,
    },
    savingsGoal: {
      type: Number,
      min: [0, "Savings goal cannot be negative"],
      default: null,
    },
    preferredCurrency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },

  },
  { timestamps: true }
);

// ─── Hash password before saving ─────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Compare entered password with hashed ─────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
