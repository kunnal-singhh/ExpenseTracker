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
    // Positive = income, Negative = expense  (matches your frontend logic)
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      validate: {
        validator: (v) => v !== 0,
        message: "Amount cannot be zero",
      },
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    date: {
      type: String, // kept as string to match your existing frontend format
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-set type based on amount before saving
transactionSchema.pre("save", function (next) {
  this.type = this.amount > 0 ? "income" : "expense";
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
