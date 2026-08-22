const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    item: {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
    type: {
      type: String,
      enum: ["RETURN", "EXCHANGE"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    exchangeProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    staffNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

returnRequestSchema.index({ order: 1, customer: 1, "item.product": 1 });

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
