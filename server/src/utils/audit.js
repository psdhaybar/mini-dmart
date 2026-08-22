const AuditLog = require("../models/AuditLog");

const audit = async ({ req, action, entityType, entityId = "", metadata = {} }) => {
  try {
    await AuditLog.create({
      actor: req?.user?._id || null,
      action,
      entityType,
      entityId: String(entityId || ""),
      metadata,
      ip: req?.ip || req?.socket?.remoteAddress || "",
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};

module.exports = audit;
