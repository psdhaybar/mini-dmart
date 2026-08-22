const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const ReturnRequest = require("../models/ReturnRequest");
const audit = require("../utils/audit");

const RETURN_WINDOW_DAYS = 7;

const requestReturn = async (req, res) => {
  try {
    const { orderId, productId, quantity = 1, type, reason, exchangeProductId } = req.body;
    if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid order or product" });
    }
    if (!["RETURN", "EXCHANGE"].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be RETURN or EXCHANGE" });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Please provide a return reason" });
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (!["DELIVERED", "PICKED_UP"].includes(order.status)) {
      return res.status(409).json({ success: false, message: "Returns are available only after delivery or pickup" });
    }

    const ageDays = (Date.now() - order.updatedAt.getTime()) / 86400000;
    if (ageDays > RETURN_WINDOW_DAYS) {
      return res.status(409).json({ success: false, message: `Return window is ${RETURN_WINDOW_DAYS} days` });
    }

    const orderItem = order.items.find((item) => String(item.product) === String(productId));
    if (!orderItem) return res.status(404).json({ success: false, message: "Product was not part of this order" });

    const previous = await ReturnRequest.find({
      order: order._id,
      customer: req.user._id,
      "item.product": productId,
      status: { $in: ["PENDING", "APPROVED", "COMPLETED"] },
    });
    const usedQty = previous.reduce((sum, r) => sum + r.item.quantity, 0);
    if (usedQty + qty > orderItem.quantity) {
      return res.status(409).json({ success: false, message: "Requested quantity exceeds eligible quantity" });
    }

    let exchangeProduct = null;
    if (type === "EXCHANGE") {
      if (!exchangeProductId || !mongoose.isValidObjectId(exchangeProductId)) {
        return res.status(400).json({ success: false, message: "Select an exchange product" });
      }
      exchangeProduct = await Product.findOne({ _id: exchangeProductId, isActive: true });
      if (!exchangeProduct || exchangeProduct.stock < qty) {
        return res.status(409).json({ success: false, message: "Exchange product is unavailable in the requested quantity" });
      }
      if (String(exchangeProduct._id) === String(productId)) {
        return res.status(400).json({ success: false, message: "Choose a different product for exchange" });
      }
    }

    const request = await ReturnRequest.create({
      order: order._id,
      customer: req.user._id,
      item: { product: orderItem.product, name: orderItem.name, quantity: qty },
      type,
      reason: reason.trim(),
      exchangeProduct: exchangeProduct ? exchangeProduct._id : null,
    });

    await audit({ req, action: "REQUEST_RETURN_EXCHANGE", entityType: "RETURN_REQUEST", entityId: request._id, metadata: { type, orderId, productId, quantity: qty } });
    res.status(201).json({ success: true, message: `${type === "RETURN" ? "Return" : "Exchange"} request submitted`, request });
  } catch (error) {
    console.error("Return request error:", error);
    res.status(400).json({ success: false, message: error.message || "Unable to create request" });
  }
};

const getMyReturns = async (req, res) => {
  try {
    const requests = await ReturnRequest.find({ customer: req.user._id })
      .populate("order", "orderNumber status total")
      .populate("exchangeProduct", "name price stock")
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error("Get returns error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch return requests" });
  }
};

const getAllReturns = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status.toUpperCase() } : {};
    const requests = await ReturnRequest.find(filter)
      .populate("customer", "name email phone")
      .populate("order", "orderNumber status total")
      .populate("exchangeProduct", "name price stock")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, requests });
  } catch (error) {
    console.error("Get all returns error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch return requests" });
  }
};

const processReturn = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { status, staffNote = "" } = req.body;
    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid return status" });
    }

    let updated;
    await session.withTransaction(async () => {
      const request = await ReturnRequest.findById(req.params.id).session(session);
      if (!request) throw new Error("Return request not found");

      if (status === "APPROVED" && request.status !== "PENDING") {
        throw new Error("Only pending requests can be approved");
      }
      if (status === "REJECTED" && request.status !== "PENDING") {
        throw new Error("Only pending requests can be rejected");
      }
      if (status === "COMPLETED" && request.status !== "APPROVED") {
        throw new Error("Only approved requests can be completed");
      }

      if (status === "COMPLETED") {
        await Product.findByIdAndUpdate(
          request.item.product,
          { $inc: { stock: request.item.quantity } },
          { session }
        );
        if (request.type === "EXCHANGE" && request.exchangeProduct) {
          const exchange = await Product.findOneAndUpdate(
            { _id: request.exchangeProduct, isActive: true, stock: { $gte: request.item.quantity } },
            { $inc: { stock: -request.item.quantity } },
            { new: true, session }
          );
          if (!exchange) throw new Error("Exchange stock is no longer available");
        }
      }

      request.status = status;
      request.staffNote = String(staffNote).trim().slice(0, 500);
      request.processedAt = new Date();
      await request.save({ session });
      updated = request;
    });

    await audit({ req, action: `PROCESS_RETURN_${status}`, entityType: "RETURN_REQUEST", entityId: updated._id, metadata: { type: updated.type, orderId: updated.order, quantity: updated.item.quantity } });
    res.json({ success: true, message: "Return request updated", request: updated });
  } catch (error) {
    console.error("Process return error:", error);
    res.status(409).json({ success: false, message: error.message || "Unable to process request" });
  } finally {
    await session.endSession();
  }
};

module.exports = { requestReturn, getMyReturns, getAllReturns, processReturn };
