const express = require("express");
const router = express.Router();
const { createSupportRequest } = require("../controllers/supportController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createSupportRequest);

module.exports = router;
