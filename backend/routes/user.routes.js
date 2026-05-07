const express = require("express");
const router = express.Router();
const { updateProfile, changeEmail, changePassword } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// PUT /api/user/profile
router.put("/profile", updateProfile);

// PUT /api/user/email
router.put("/email", changeEmail);

// PUT /api/user/password
router.put("/password", changePassword);

module.exports = router;
