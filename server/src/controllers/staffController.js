const Order = require("../models/Order");
const Product = require("../models/Product");
const audit = require("../utils/audit");

// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      fulfillmentType,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }

    if (fulfillmentType) {
      filter.fulfillmentType =
        fulfillmentType.toUpperCase();
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate(
          "customer",
          "name email phone"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .select("-__v"),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNumber,
      pages: Math.ceil(
        total / limitNumber
      ),
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getStaffOrderById = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    )
      .populate(
        "customer",
        "name email phone"
      )
      .select("-__v");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get staff order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order",
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const newStatus = status.toUpperCase();

    const validStatuses = [
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "PICKED_UP",
      "CANCELLED",
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ---------------------------------------------
    // VALID STATUS TRANSITIONS
    // ---------------------------------------------

    const allowedTransitions = {
      PLACED: ["CONFIRMED", "CANCELLED"],

      CONFIRMED: [
        "PREPARING",
        "CANCELLED",
      ],

      PREPARING: [
        "READY",
        "CANCELLED",
      ],

      READY:
        order.fulfillmentType === "PICKUP"
          ? ["PICKED_UP"]
          : ["OUT_FOR_DELIVERY"],

      OUT_FOR_DELIVERY: [
        "DELIVERED",
      ],

      DELIVERED: [],

      PICKED_UP: [],

      CANCELLED: [],
    };

    const previousStatus = order.status;
    const allowed =
      allowedTransitions[order.status] || [];

    if (!allowed.includes(newStatus)) {
      return res.status(409).json({
        success: false,
        message:
          `Cannot change order status from ` +
          `${order.status} to ${newStatus}`,
        allowedNextStatuses: allowed,
      });
    }

    // ---------------------------------------------
    // UPDATE
    // ---------------------------------------------

    if (newStatus === "CANCELLED") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
      order.cancelledAt = new Date();
      order.cancellationReason = "Cancelled by operations";
    }

    order.status = newStatus;

    // Payment update for COD orders
    if (
      newStatus === "DELIVERED" ||
      newStatus === "PICKED_UP"
    ) {
      if (order.paymentMethod === "COD") {
        order.paymentStatus = "PAID";
      }
    }

    await order.save();

    await audit({ req, action: "UPDATE_ORDER_STATUS", entityType: "ORDER", entityId: order._id, metadata: { orderNumber: order.orderNumber, from: previousStatus, to: newStatus } });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update order status",
    });
  }
};

module.exports = {
  getAllOrders,
  getStaffOrderById,
  updateOrderStatus,
};