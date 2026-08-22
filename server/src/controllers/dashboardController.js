const Order = require("../models/Order");
const Product = require("../models/Product");

// =====================================================
// ADMIN / MANAGER DASHBOARD
// =====================================================

const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      Product.countDocuments(),

      Product.countDocuments({
        isActive: true,
      }),

      Product.countDocuments({
        isActive: true,
        $expr: {
          $lte: ["$stock", "$lowStockThreshold"],
        },
      }),

      Order.countDocuments(),

      Order.countDocuments({
        status: {
          $in: [
            "PLACED",
            "CONFIRMED",
            "PREPARING",
            "READY",
            "OUT_FOR_DELIVERY",
          ],
        },
      }),

      Order.countDocuments({
        status: {
          $in: ["DELIVERED", "PICKED_UP"],
        },
      }),

      Order.countDocuments({
        status: "CANCELLED",
      }),

      Order.aggregate([
        {
          $match: {
            status: {
              $in: ["DELIVERED", "PICKED_UP"],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$total",
            },
          },
        },
      ]),
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    return res.status(200).json({
      success: true,

      dashboard: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard",
    });
  }
};

// =====================================================
// STAFF DASHBOARD
// =====================================================

const getStaffDashboard = async (req, res) => {
  try {
    const statuses = [
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "PICKED_UP",
      "CANCELLED",
    ];

    const counts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const dashboard = {};

    statuses.forEach((status) => {
      dashboard[status] = 0;
    });

    counts.forEach((item) => {
      dashboard[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error(
      "Staff dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch staff dashboard",
    });
  }
};

module.exports = {
  getAdminDashboard,
  getStaffDashboard,
};