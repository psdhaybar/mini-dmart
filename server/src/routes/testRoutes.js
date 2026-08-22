const express = require("express");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Any logged-in user
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    message: "You are authenticated",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Admin only
router.get(
  "/admin",
  protect,
  authorize("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

// Staff + Manager + Admin
router.get(
  "/operations",
  protect,
  authorize("STAFF", "MANAGER", "ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Operations access granted",
      role: req.user.role,
    });
  }
);

module.exports = router;