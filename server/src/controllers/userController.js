const User = require("../models/User");
const audit = require("../utils/audit");

const getUsers = async (req, res) => {
  try {
    const { search = "", role, status } = req.query;
    const filter = {};

    if (role) filter.role = role.toUpperCase();
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch users" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (String(user._id) === String(req.user._id) && isActive === false) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
    }

    if (role !== undefined) {
      const roles = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN"];
      if (!roles.includes(String(role).toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }
      user.role = String(role).toUpperCase();
    }
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ success: false, message: "isActive must be boolean" });
      }
      user.isActive = isActive;
    }

    await user.save();
    await audit({ req, action: "ADMIN_UPDATE_USER", entityType: "USER", entityId: user._id, metadata: { role: user.role, isActive: user.isActive } });
    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ success: true, message: "User updated successfully", user: safeUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(400).json({ success: false, message: "Unable to update user" });
  }
};

const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      isActive: req.user.isActive,
    },
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    }
    req.user.name = name.trim();
    req.user.phone = String(phone || "").trim().slice(0, 30);
    await req.user.save();

    res.json({
      success: true,
      message: "Profile updated",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        isActive: req.user.isActive,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({ success: false, message: "Unable to update profile" });
  }
};

module.exports = { getUsers, updateUser, getProfile, updateProfile };
