
const mongoose = require("mongoose");

const seatLockSchema = new mongoose.Schema(
  {
    movieId: {
      type: String,
      required: true,
      trim: true,
    },
    showDate: {
      type: String,
      required: true,
    },
    showTime: {
      type: String,
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
      match: /^[A-E][1-8]$/,
    },
    lockToken: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired seat locks.
seatLockSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Prevent two customers from holding the same seat
// for the same movie, date, and showtime.
seatLockSchema.index(
  {
    movieId: 1,
    showDate: 1,
    showTime: 1,
    seatNumber: 1,
  },
  { unique: true }
);

module.exports =
  mongoose.models.SeatLock ||
  mongoose.model("SeatLock", seatLockSchema);
