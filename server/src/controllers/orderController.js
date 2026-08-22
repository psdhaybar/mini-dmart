const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const audit = require("../utils/audit");

const DELIVERY_FEE = 40;

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const {
        fulfillmentType,
        scheduledPickupAt,
        deliveryAddress,
        paymentMethod = "COD",
      } = req.body;

      // -----------------------------
      // BASIC VALIDATION
      // -----------------------------

      if (!["PICKUP", "DELIVERY"].includes(fulfillmentType)) {
        throw new Error("Invalid fulfillment type");
      }

      if (!["COD", "ONLINE"].includes(paymentMethod)) {
        throw new Error("Invalid payment method");
      }

      // Delivery validation
      if (fulfillmentType === "DELIVERY") {
        if (
          !deliveryAddress ||
          deliveryAddress.trim().length < 10
        ) {
          throw new Error(
            "A valid delivery address is required"
          );
        }
      }

      // Pickup validation
      if (fulfillmentType === "PICKUP") {
        if (!scheduledPickupAt) {
          throw new Error(
            "Scheduled pickup time is required"
          );
        }

        const pickupDate = new Date(scheduledPickupAt);

        if (Number.isNaN(pickupDate.getTime())) {
          throw new Error(
            "Invalid pickup date and time"
          );
        }

        if (pickupDate <= new Date()) {
          throw new Error(
            "Pickup time must be in the future"
          );
        }

        const maxPickupDays = 7;
        const maxPickupDate = new Date();
        maxPickupDate.setDate(maxPickupDate.getDate() + maxPickupDays);
        if (pickupDate > maxPickupDate) {
          throw new Error(`Pickup can be scheduled only within ${maxPickupDays} days`);
        }

        const slotStart = new Date(pickupDate);
        slotStart.setMinutes(0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotEnd.getHours() + 1);

        const pickupCount = await Order.countDocuments({
          fulfillmentType: "PICKUP",
          scheduledPickupAt: { $gte: slotStart, $lt: slotEnd },
          status: { $nin: ["CANCELLED"] },
        }).session(session);

        if (pickupCount >= 10) {
          throw new Error("That pickup hour is full. Please choose another time");
        }
      }

      // -----------------------------
      // GET CUSTOMER CART
      // -----------------------------

      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty");
      }

      // -----------------------------
      // VERIFY PRODUCTS + STOCK
      // -----------------------------

      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const product = await Product.findOne({
          _id: cartItem.product,
          isActive: true,
        }).session(session);

        if (!product) {
          throw new Error(
            `Product "${cartItem.name}" is no longer available`
          );
        }

        if (product.stock < cartItem.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock}`
          );
        }

        // -----------------------------
        // ATOMIC STOCK DECREMENT
        // -----------------------------

        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: product._id,
              isActive: true,
              stock: {
                $gte: cartItem.quantity,
              },
            },
            {
              $inc: {
                stock: -cartItem.quantity,
              },
            },
            {
              returnDocument: "after",
              session,
            }
          );

        if (!updatedProduct) {
          throw new Error(
            `Stock changed while checking "${product.name}". Please try again.`
          );
        }

        const itemTotal =
          product.price * cartItem.quantity;

        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          image: product.image,
        });
      }

      // -----------------------------
      // SERVER-SIDE TOTAL
      // -----------------------------

      const deliveryFee =
        fulfillmentType === "DELIVERY"
          ? DELIVERY_FEE
          : 0;

      const total = subtotal + deliveryFee;

      // -----------------------------
      // CREATE ORDER
      // -----------------------------

      const orders = await Order.create(
        [
          {
            customer: req.user._id,
            items: orderItems,
            subtotal,
            deliveryFee,
            total,
            fulfillmentType,

            scheduledPickupAt:
              fulfillmentType === "PICKUP"
                ? new Date(scheduledPickupAt)
                : null,

            deliveryAddress:
              fulfillmentType === "DELIVERY"
                ? deliveryAddress.trim()
                : "",

            paymentMethod,

            paymentStatus: "PENDING",

            status: "PLACED",
          },
        ],
        {
          session,
        }
      );

      createdOrder = orders[0];

      // -----------------------------
      // CLEAR CART
      // -----------------------------

      cart.items = [];
      cart.subtotal = 0;

      await cart.save({
        session,
      });
    });

    await audit({ req, action: "CREATE_ORDER", entityType: "ORDER", entityId: createdOrder._id, metadata: { orderNumber: createdOrder.orderNumber, total: createdOrder.total, fulfillmentType: createdOrder.fulfillmentType } });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to place order",
    });
  } finally {
    await session.endSession();
  }
};

// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    })
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

// =====================================================
// GET ORDER DETAILS
// =====================================================

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    }).select("-__v");

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
      "Get order details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order details",
    });
  }
};

// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id,
      }).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      const cancellableStatuses = [
        "PLACED",
        "CONFIRMED",
        "PREPARING",
      ];

      if (!cancellableStatuses.includes(order.status)) {
        throw new Error(
          `Order cannot be cancelled after it reaches ${order.status}`
        );
      }

      // Restore inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity,
            },
          },
          {
            session,
          }
        );
      }

      order.status = "CANCELLED";
      order.cancelledAt = new Date();

      order.cancellationReason =
        req.body.reason ||
        "Cancelled by customer";

      await order.save({
        session,
      });

      cancelledOrder = order;
    });

    await audit({ req, action: "CANCEL_ORDER", entityType: "ORDER", entityId: cancelledOrder._id, metadata: { orderNumber: cancelledOrder.orderNumber, reason: cancelledOrder.cancellationReason } });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    const statusCode =
      error.message === "Order not found"
        ? 404
        : 409;

    return res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        "Unable to cancel order",
    });
  } finally {
    await session.endSession();
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};