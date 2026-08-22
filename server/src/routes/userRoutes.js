const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getUsers, updateUser, getProfile, updateProfile } = require("../controllers/userController");

const router = express.Router();
router.use(protect);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.get("/", authorize("ADMIN"), getUsers);
router.patch("/:id", authorize("ADMIN"), updateUser);

module.exports = router;
