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
    occupation: {
      type: String,
      trim: true,
      maxlength: [80, "Occupation cannot exceed 80 characters"],
      default: "",
    },
    monthlyIncome: {
      type: Number,
      min: [0, "Monthly income cannot be negative"],
      default: null,
    },
    monthlyBudget: {
      type: Number,
      min: [0, "Monthly budget cannot be negative"],
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
    spendingFocus: {
      type: String,
      trim: true,
      maxlength: [80, "Spending focus cannot exceed 80 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// ─── Hash password before saving ─────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Compare entered password with hashed ─────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
