const express = require("express");

const {
  getAllOrders,
  getStaffOrderById,
  updateOrderStatus,
} = require("../controllers/staffController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Only STAFF / MANAGER / ADMIN
router.use(
  authorize(
    "STAFF",
    "MANAGER",
    "ADMIN"
  )
);

router.get("/orders", getAllOrders);

router.get(
  "/orders/:id",
  getStaffOrderById
);

router.patch(
  "/orders/:id/status",
  updateOrderStatus
);

module.exports = router;