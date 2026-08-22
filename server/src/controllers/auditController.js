const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch audit logs" });
  }
};

module.exports = { getAuditLogs };
