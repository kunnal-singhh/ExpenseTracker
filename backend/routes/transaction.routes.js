const express = require("express");
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getSummary,
} = require("../controllers/transaction.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes below require authentication
router.use(protect);

// GET  /api/transactions          → list (with optional ?type=income|expense&page=1&limit=50)
// POST /api/transactions          → create
router.route("/").get(getTransactions).post(createTransaction);

// GET  /api/transactions/summary  → balance, income, expense totals
router.get("/summary", getSummary);

// DELETE /api/transactions/:id
router.delete("/:id", deleteTransaction);

module.exports = router;
