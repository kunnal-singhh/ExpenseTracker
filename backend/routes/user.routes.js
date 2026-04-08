const express = require("express");
const router = express.Router();
const { updateProfile, changePassword } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

// PUT /api/user/profile
router.put("/profile", updateProfile);

// PUT /api/user/password
router.put("/password", changePassword);

module.exports = router;
