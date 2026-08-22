const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAuditLogs } = require("../controllers/auditController");

const router = express.Router();
router.get("/", protect, authorize("ADMIN"), getAuditLogs);
module.exports = router;
