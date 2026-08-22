const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { requestReturn, getMyReturns, getAllReturns, processReturn } = require("../controllers/returnController");

const router = express.Router();
router.use(protect);

router.post("/", authorize("CUSTOMER"), requestReturn);
router.get("/mine", authorize("CUSTOMER"), getMyReturns);
router.get("/", authorize("STAFF", "MANAGER", "ADMIN"), getAllReturns);
router.patch("/:id", authorize("STAFF", "MANAGER", "ADMIN"), processReturn);

module.exports = router;
