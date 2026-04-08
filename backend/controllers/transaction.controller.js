const Transaction = require("../models/Transaction.model");

// ─── @GET /api/transactions ────────────────────────────
// Query params: type=income|expense, limit, page
const getTransactions = async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;

    const filter = { user: req.user._id };
    if (type === "income") filter.amount = { $gt: 0 };
    if (type === "expense") filter.amount = { $lt: 0 };

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @POST /api/transactions ───────────────────────────
const createTransaction = async (req, res) => {
  try {
    const { to, amount } = req.body;

    if (!to || amount === undefined || amount === 0) {
      return res.status(400).json({ success: false, message: "to and a non-zero amount are required" });
    }

    // If it's an expense, validate sufficient balance
    if (Number(amount) < 0) {
      const result = await Transaction.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: null, balance: { $sum: "$amount" } } },
      ]);
      const balance = result[0]?.balance || 0;

      if (balance <= 0) {
        return res.status(400).json({ success: false, message: "Balance is zero. Cannot add expense." });
      }
      if (Math.abs(Number(amount)) > balance) {
        return res.status(400).json({ success: false, message: "Expense exceeds available balance." });
      }
    }

    const now = new Date();
    const transaction = await Transaction.create({
      user: req.user._id,
      to,
      amount: Number(amount),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    });

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @DELETE /api/transactions/:id ────────────────────
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id, // ensure ownership
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @GET /api/transactions/summary ───────────────────
// Returns: totalIncome, totalExpense, balance
const getSummary = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] },
          },
          balance: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 };
    delete summary._id;

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTransactions, createTransaction, deleteTransaction, getSummary };
