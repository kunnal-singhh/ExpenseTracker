const express = require("express");
const router = express.Router();
const {
  getUsers,
  getSupportRequests,
  getStats,
  updateSupportStatus,
  updateUserAdmin,
  deleteUser,
} = require("../controllers/adminController");

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/support", getSupportRequests);
router.patch("/support/:id/status", updateSupportStatus);
router.patch("/users/:id/admin", updateUserAdmin);
router.delete("/users/:id", deleteUser);

module.exports = router;
