const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const {
  isValidName,
  isValidEmail,
  isValidPassword,
  parseInterests
} = require("../utils/validators");

const router = express.Router();

// Get profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});

// Update profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, interests, profileImage } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) {
      if (!isValidName(name)) {
        return res.status(400).json({
          message: "Name must be 3 to 50 letters and spaces only."
        });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          message: "Please enter a valid email address."
        });
      }

      const existingUser = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: req.user.id }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use." });
      }

      user.email = email.trim().toLowerCase();
    }

    if (interests !== undefined) {
      user.interests = Array.isArray(interests)
        ? interests.map((item) => String(item).trim()).filter(Boolean)
        : parseInterests(interests);
    }

    if (profileImage !== undefined) {
      user.profileImage = String(profileImage).trim();
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        interests: user.interests,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

// Change password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 6 characters and include 1 letter and 1 number."
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error while changing password" });
  }
});

module.exports = router;