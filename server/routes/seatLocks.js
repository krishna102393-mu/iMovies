
const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const SeatLock = require("../models/SeatLock");
const Booking = require("../models/Booking");

const router = express.Router();

const HOLD_MINUTES = 5;
const VALID_SEAT = /^[A-E][1-8]$/;

router.post("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database is not connected.",
      });
    }

    const { movieId, showDate, showTime, seats } = req.body;

    if (
      !movieId ||
      typeof movieId !== "string" ||
      !showDate ||
      typeof showDate !== "string" ||
      !showTime ||
      typeof showTime !== "string" ||
      !Array.isArray(seats) ||
      seats.length === 0 ||
      seats.length > 10 ||
      !seats.every(
        (seat) => typeof seat === "string" && VALID_SEAT.test(seat)
      ) ||
      new Set(seats).size !== seats.length
    ) {
      return res.status(400).json({
        message: "Provide a valid show and between 1 and 10 unique seats.",
      });
    }

    const now = new Date();

    // Remove expired locks for the requested seats. TTL cleanup is asynchronous.
    await SeatLock.deleteMany({
      movieId,
      showDate,
      showTime,
      seatNumber: { $in: seats },
      expiresAt: { $lte: now },
    });

    // Do not lock seats already present in a saved booking.
    const existingBookings = await Booking.find({
      movieTitle: movieId,
      showDate,
      showTime,
      seats: { $in: seats },
    }).select("seats");

    const alreadyBooked = new Set(
      existingBookings.flatMap((booking) => booking.seats)
    );

    if (seats.some((seat) => alreadyBooked.has(seat))) {
      return res.status(409).json({
        message: "One or more seats have already been booked.",
      });
    }

    const lockToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
    const createdLocks = [];

    try {
      for (const seatNumber of seats) {
        const lock = await SeatLock.create({
          movieId,
          showDate,
          showTime,
          seatNumber,
          lockToken,
          expiresAt,
        });

        createdLocks.push(lock._id);
      }
    } catch (error) {
      // If any seat cannot be locked, undo this request's partial locks.
      if (createdLocks.length) {
        await SeatLock.deleteMany({
          _id: { $in: createdLocks },
          lockToken,
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          message: "One or more seats are being held by another customer.",
        });
      }

      throw error;
    }

    const io = req.app.get("io");
    io?.to(`show:${movieId}:${showDate}:${showTime}`).emit(
      "seat-lock-updated",
      { movieId, showDate, showTime, seats, expiresAt }
    );

    return res.status(201).json({
      message: `Seats held for ${HOLD_MINUTES} minutes.`,
      lockToken,
      seats,
      expiresAt,
    });
  } catch (error) {
    console.error("Seat lock error:", error.message);
    return res.status(500).json({
      message: "Could not reserve the selected seats.",
    });
  }
});

// Get currently booked or actively held seats for a show.
router.get("/", async (req, res) => {
  try {
    const { movieId, showDate, showTime } = req.query;

    if (
      typeof movieId !== "string" ||
      typeof showDate !== "string" ||
      typeof showTime !== "string" ||
      !movieId ||
      !showDate ||
      !showTime
    ) {
      return res.status(400).json({
        message: "movieId, showDate, and showTime are required.",
      });
    }

    const now = new Date();

    await SeatLock.deleteMany({
      movieId,
      showDate,
      showTime,
      expiresAt: { $lte: now },
    });

    const [locks, bookings] = await Promise.all([
      SeatLock.find({
        movieId,
        showDate,
        showTime,
        expiresAt: { $gt: now },
      }).select("seatNumber"),
      Booking.find({
        movieTitle: movieId,
        showDate,
        showTime,
      }).select("seats"),
    ]);

    const bookedSeats = [...new Set(bookings.flatMap((booking) => booking.seats))];
    const heldSeats = [...new Set(locks.map((lock) => lock.seatNumber))]
      .filter((seat) => !bookedSeats.includes(seat));

    return res.json({ bookedSeats, heldSeats });
  } catch (error) {
    console.error("Seat availability error:", error.message);
    return res.status(500).json({
      message: "Could not fetch seat availability.",
    });
  }
});

module.exports = router;
