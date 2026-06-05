const express = require("express");
const router = express.Router();
const { createSupportRequest, getUserSupportRequests } = require("../controllers/supportController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createSupportRequest);
router.get("/", getUserSupportRequests);

module.exports = router;
