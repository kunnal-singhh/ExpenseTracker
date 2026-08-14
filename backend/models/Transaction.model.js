const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: String,
      required: [true, "Transaction label is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      validate: {
        validator: function(v) { return v !== 0; },
        message: "Amount cannot be zero",
      },
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      default: "expense",
    },
    category: {
      type: String,
      trim: true,
      default: "Other",
      index: true,
    },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, amount: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
