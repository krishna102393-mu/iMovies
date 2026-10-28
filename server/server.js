
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const Booking = require("./models/Booking");
const SeatLock = require("./models/SeatLock");
const authRoutes = require("./routes/auth");
const seatLockRoutes = require("./routes/seatLocks");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/seat-locks", seatLockRoutes);

app.set("io", io);

// Health checks
app.get("/", (req, res) => {
  res.send("iMovies backend is running!");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Frontend and backend connected successfully!",
  });
});

// TMDB popular movies
async function fetchPopularMovies() {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is missing from server/.env");
  }

  const response = await fetch(
    "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return response.json();
}

app.get("/api/tmdb", async (req, res) => {
  try {
    const data = await fetchPopularMovies();
    res.json(data);
  } catch (error) {
    console.error("TMDB error:", error.message);
    res.status(502).json({ message: "Unable to fetch movies from TMDB." });
  }
});

app.get("/api/movies", async (req, res) => {
  try {
    const data = await fetchPopularMovies();

    const movies = (data.results || []).map((movie) => ({
      id: String(movie.id),
      title: movie.title,
      genre: (movie.genre_ids || []).join(", "),
      rating: movie.vote_average,
      overview: movie.overview,
      releaseDate: movie.release_date,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      price: 200,
    }));

    res.json({ count: movies.length, movies });
  } catch (error) {
    console.error("Movies error:", error.message);
    res.status(502).json({ message: "Unable to fetch movies." });
  }
});

// Create booking only when all selected seats have a valid lock.
app.post("/api/bookings", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database is not connected.",
      });
    }

    const {
      movieId,
      movieTitle,
      lockToken,
      customerName,
      customerEmail,
      showDate,
      showTime,
      seats,
      totalAmount,
    } = req.body;

    const validSeats =
      Array.isArray(seats) &&
      seats.length >= 1 &&
      seats.length <= 10 &&
      seats.every(
        (seat) =>
          typeof seat === "string" &&
          /^[A-E][1-8]$/.test(seat)
      ) &&
      new Set(seats).size === seats.length;

    if (
      typeof movieId !== "string" ||
      !movieId.trim() ||
      typeof movieTitle !== "string" ||
      !movieTitle.trim() ||
      typeof lockToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(lockToken) ||
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
      typeof showDate !== "string" ||
      !showDate.trim() ||
      typeof showTime !== "string" ||
      !showTime.trim() ||
      !validSeats ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      return res.status(400).json({
        message: "Please provide valid booking details and a seat lock token.",
      });
    }

    const now = new Date();

    // Confirm that every requested seat is held by this exact token.
    const locks = await SeatLock.find({
      movieId,
      showDate,
      showTime,
      seatNumber: { $in: seats },
      lockToken,
      expiresAt: { $gt: now },
    }).select("+lockToken");

    if (locks.length !== seats.length) {
      return res.status(409).json({
        message:
          "Your seat hold is missing or has expired. Please select your seats again.",
      });
    }

    // Recheck existing bookings before saving.
    const existingBookings = await Booking.find({
      movieId,
      showDate,
      showTime,
      seats: { $in: seats },
    }).select("seats");

    const bookedSeats = new Set(
      existingBookings.flatMap((booking) => booking.seats)
    );

    if (seats.some((seat) => bookedSeats.has(seat))) {
      return res.status(409).json({
        message: "One or more selected seats are already booked.",
      });
    }

    const booking = await Booking.create({
      movieId,
      movieTitle: movieTitle.trim(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      showDate,
      showTime: showTime.trim(),
      seats,
      totalAmount,
    });

    // Release this customer's holds after the booking is saved.
    await SeatLock.deleteMany({
      movieId,
      showDate,
      showTime,
      lockToken,
      seatNumber: { $in: seats },
    });

    // Notify clients watching this movie and show.
    io.to(`show:${movieId}:${showDate}:${showTime}`).emit(
      "booking-updated",
      {
        movieId,
        movieTitle: movieTitle.trim(),
        showDate,
        showTime: showTime.trim(),
        seats,
      }
    );

    return res.status(201).json({
      message: "Booking saved successfully.",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error.message);
    return res.status(500).json({
      message: "Could not save booking.",
    });
  }
});

// List recent bookings
app.get("/api/bookings", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database is not connected.",
      });
    }

    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ count: bookings.length, bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error.message);
    res.status(500).json({
      message: "Could not fetch bookings.",
    });
  }
});

// Socket.IO rooms use movieId, date, and time consistently.
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-show", (data = {}) => {
    const { movieId, showDate, showTime } = data;

    if (
      typeof movieId !== "string" ||
      !movieId.trim() ||
      typeof showDate !== "string" ||
      !showDate.trim() ||
      typeof showTime !== "string" ||
      !showTime.trim()
    ) {
      return;
    }

    socket.join(`show:${movieId}:${showDate}:${showTime}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    server.listen(PORT, () => {
      console.log(`iMovies backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

