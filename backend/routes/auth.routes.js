
const express = require("express");
const router = express.Router();
const { register, login, getMe, verifyOTP } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");


// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/verify
router.post("/verify", verifyOTP);

// GET  /api/auth/me  — needs valid token
router.get("/me", protect, getMe);

module.exports = router;
