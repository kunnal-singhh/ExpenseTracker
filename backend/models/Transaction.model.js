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
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);