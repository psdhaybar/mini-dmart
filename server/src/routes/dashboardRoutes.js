const express = require("express");

const {
  getAdminDashboard,
  getStaffDashboard,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All dashboard routes require login
router.use(protect);

// Admin / Manager dashboard
router.get(
  "/admin",
  authorize("ADMIN", "MANAGER"),
  getAdminDashboard
);

// Staff / Manager / Admin dashboard
router.get(
  "/staff",
  authorize("STAFF", "MANAGER", "ADMIN"),
  getStaffDashboard
);

module.exports = router;