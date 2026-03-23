const express = require("express");
const Trip = require("../models/Trip");
const authMiddleware = require("../middleware/authMiddleware");
const {
  isValidDestination,
  isValidDateRange
} = require("../utils/validators");

const router = express.Router();

// Create trip
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { destination, startDate, endDate } = req.body;

    if (!isValidDestination(destination)) {
      return res.status(400).json({
        message: "Destination must be at least 2 letters and contain only letters and spaces."
      });
    }

    if (!isValidDateRange(startDate, endDate)) {
      return res.status(400).json({
        message: "Please provide a valid date range."
      });
    }

    const trip = await Trip.create({
      user: req.user.id,
      destination: destination.trim(),
      startDate,
      endDate
    });

    res.status(201).json({
      message: "Trip created successfully",
      trip
    });
  } catch (error) {
    console.error("Create trip error:", error);
    res.status(500).json({ message: "Server error while creating trip" });
  }
});

// Get my trips
router.get("/my-trips", authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ startDate: 1 });
    res.json(trips);
  } catch (error) {
    console.error("Fetch my trips error:", error);
    res.status(500).json({ message: "Server error while fetching trips" });
  }
});

// Search trips
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { destination, startDate, endDate } = req.query;

    const query = {};

    if (destination) {
      query.destination = { $regex: new RegExp(destination.trim(), "i") };
    }

    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate) };
      query.endDate = { $gte: new Date(startDate) };
    }

    const trips = await Trip.find(query)
      .populate("user", "name email interests isOnline lastSeen")
      .sort({ startDate: 1 });

    res.json(trips);
  } catch (error) {
    console.error("Search trips error:", error);
    res.status(500).json({ message: "Server error while searching trips" });
  }
});

// Update trip
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { destination, startDate, endDate } = req.body;

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (destination !== undefined) {
      if (!isValidDestination(destination)) {
        return res.status(400).json({
          message: "Destination must be at least 2 letters and contain only letters and spaces."
        });
      }
      trip.destination = destination.trim();
    }

    if (startDate !== undefined) {
      trip.startDate = startDate;
    }

    if (endDate !== undefined) {
      trip.endDate = endDate;
    }

    if (!isValidDateRange(trip.startDate, trip.endDate)) {
      return res.status(400).json({
        message: "Please provide a valid date range."
      });
    }

    await trip.save();

    res.json({
      message: "Trip updated successfully",
      trip
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({ message: "Server error while updating trip" });
  }
});

// Delete trip
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedTrip = await Trip.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deletedTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({ message: "Server error while deleting trip" });
  }
});

// Find matches
router.get("/matches", authMiddleware, async (req, res) => {
  try {
    const myTrips = await Trip.find({ user: req.user.id });

    const matches = [];
    const seen = new Set();

    for (const myTrip of myTrips) {
      const overlappingTrips = await Trip.find({
        user: { $ne: req.user.id },
        destination: { $regex: new RegExp(`^${myTrip.destination.trim()}$`, "i") },
        startDate: { $lte: myTrip.endDate },
        endDate: { $gte: myTrip.startDate }
      }).populate("user", "name email interests isOnline lastSeen profileImage");

      for (const trip of overlappingTrips) {
        const key = `${trip._id}-${trip.user._id}`;

        if (!seen.has(key)) {
          seen.add(key);

          matches.push({
            tripId: trip._id,
            matchUserId: trip.user?._id,
            matchName: trip.user?.name || "Unknown User",
            matchEmail: trip.user?.email || "No email",
            matchInterests: trip.user?.interests || [],
            matchIsOnline: trip.user?.isOnline || false,
            matchLastSeen: trip.user?.lastSeen || null,
            matchProfileImage: trip.user?.profileImage || "",
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate
          });
        }
      }
    }

    res.json(matches);
  } catch (error) {
    console.error("Find matches error:", error);
    res.status(500).json({ message: "Server error while finding matches" });
  }
});

module.exports = router;