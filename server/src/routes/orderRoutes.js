const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Customer orders
router.get("/", getMyOrders);

router.get("/:id", getOrderById);

router.post("/", createOrder);

router.patch("/:id/cancel", cancelOrder);

module.exports = router;