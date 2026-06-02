const User = require("../models/User.model");
const SupportRequest = require("../models/SupportRequest.model");
const Transaction = require("../models/Transaction.model");

const SUPPORT_STATUSES = ["open", "in_progress", "resolved"];

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSupportRequests = async (req, res) => {
  try {
    const requests = await SupportRequest.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalTransactions,
      supportByStatus,
      transactionTotals,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isAdmin: true }),
      Transaction.countDocuments(),
      SupportRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalIncome: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
            totalExpense: { $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] } },
          },
        },
      ]),
    ]);

    const support = SUPPORT_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    supportByStatus.forEach((item) => {
      support[item._id] = item.count;
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalTransactions,
        totalIncome: transactionTotals[0]?.totalIncome || 0,
        totalExpense: transactionTotals[0]?.totalExpense || 0,
        support,
        totalSupportRequests: Object.values(support).reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSupportStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!SUPPORT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid support status" });
    }

    const request = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!request) {
      return res.status(404).json({ success: false, message: "Support request not found" });
    }

    res.json({ success: true, message: "Support status updated", request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateUserAdmin = async (req, res) => {
  try {
    const isAdmin = !!req.body.isAdmin;
    if (String(req.user._id) === String(req.params.id) && !isAdmin) {
      return res.status(400).json({ success: false, message: "You cannot remove admin access from your own account" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User admin access updated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await Promise.all([
      Transaction.deleteMany({ user: user._id }),
      SupportRequest.deleteMany({ user: user._id }),
    ]);

    res.json({ success: true, message: "User and related records deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUsers,
  getSupportRequests,
  getStats,
  updateSupportStatus,
  updateUserAdmin,
  deleteUser,
};
