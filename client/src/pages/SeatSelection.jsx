
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EventSeatRoundedIcon from "@mui/icons-material/EventSeatRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import socket from "../socket";

const API = "http://localhost:5000";
const TICKET_PRICE = 200;
const ROWS = ["A", "B", "C", "D", "E"];
const SEATS = ROWS.flatMap((row) =>
  Array.from({ length: 8 }, (_, index) => `${row}${index + 1}`)
);

export default function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const movieId = String(
    location.state?.movieId ?? location.state?.movie ?? ""
  );
  const movieTitle =
    location.state?.movieTitle ||
    location.state?.title ||
    "Selected Movie";
  const showTime = location.state?.time || "7:00 PM";
  const ticketCount = Math.max(
    1,
    Math.min(10, Number(location.state?.ticketCount) || 1)
  );

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [heldSeats, setHeldSeats] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [date, setDate] = useState(
    location.state?.date || new Date().toLocaleDateString("en-CA")
  );
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const total = selectedSeats.length * TICKET_PRICE;

  const unavailableSeats = useMemo(
    () => new Set([...bookedSeats, ...heldSeats]),
    [bookedSeats, heldSeats]
  );

  const loadAvailability = useCallback(async () => {
    if (!movieId || !date || !showTime) return;

    setLoadingSeats(true);

    try {
      const params = new URLSearchParams({
        movieId,
        showDate: date,
        showTime,
      });

      const response = await fetch(
        `${API}/api/seat-locks?${params}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load seat availability."
        );
      }

      setBookedSeats(data.bookedSeats || []);
      setHeldSeats(data.heldSeats || []);

      setSelectedSeats((current) =>
        current.filter(
          (seat) =>
            !(data.bookedSeats || []).includes(seat) &&
            !(data.heldSeats || []).includes(seat)
        )
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load seat availability. Check the backend."
      );
    } finally {
      setLoadingSeats(false);
    }
  }, [movieId, date, showTime]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (!movieId || !date || !showTime) return;

    const joinShow = () => {
      socket.emit("join-show", {
        movieId,
        showDate: date,
        showTime,
      });
    };

    const isCurrentShow = (update) =>
      String(update.movieId) === movieId &&
      update.showDate === date &&
      update.showTime === showTime;

    const handleBookingUpdate = (update) => {
      if (!isCurrentShow(update)) return;

      if (Array.isArray(update.seats)) {
        setBookedSeats((current) => [
          ...new Set([...current, ...update.seats]),
        ]);
        setSelectedSeats((current) =>
          current.filter((seat) => !update.seats.includes(seat))
        );
        setMessage(
          "Seat availability changed. Your seat map was updated."
        );
      }

      loadAvailability();
    };

    const handleLockUpdate = (update) => {
      if (isCurrentShow(update)) loadAvailability();
    };

    socket.connect();
    socket.on("connect", joinShow);
    socket.on("booking-updated", handleBookingUpdate);
    socket.on("seat-lock-updated", handleLockUpdate);

    if (socket.connected) joinShow();

    return () => {
      socket.off("connect", joinShow);
      socket.off("booking-updated", handleBookingUpdate);
      socket.off("seat-lock-updated", handleLockUpdate);
      socket.disconnect();
    };
  }, [movieId, date, showTime, loadAvailability]);

  const toggleSeat = (seat) => {
    setError("");
    setMessage("");

    if (unavailableSeats.has(seat)) return;

    setSelectedSeats((current) => {
      if (current.includes(seat)) {
        return current.filter((item) => item !== seat);
      }

      if (current.length >= ticketCount) {
        setError(`You can select up to ${ticketCount} seat(s).`);
        return current;
      }

      return [...current, seat];
    });
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!movieId.trim()) {
      setError(
        "Movie ID is missing. Return to the movie page and select a show again."
      );
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !date) {
      setError("Please enter your name, email address, and show date.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (selectedSeats.length !== ticketCount) {
      setError(`Please select exactly ${ticketCount} seat(s).`);
      return;
    }

    if (selectedSeats.some((seat) => unavailableSeats.has(seat))) {
      setError("A selected seat is no longer available. Choose again.");
      await loadAvailability();
      return;
    }

    setLoadingBooking(true);

    try {
      // Temporarily reserve the selected seats.
      const lockResponse = await fetch(`${API}/api/seat-locks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          showDate: date,
          showTime,
          seats: selectedSeats,
        }),
      });

      const lockData = await lockResponse.json();

      if (!lockResponse.ok) {
        throw new Error(
          lockData.message || "Could not hold your selected seats."
        );
      }

      const lockToken = lockData.lockToken || lockData.token;

      if (!lockToken) {
        throw new Error(
          "The server did not return a seat lock token."
        );
      }

      // Continue to checkout. Do NOT create the booking here.
      navigate("/payment", {
        state: {
          movieId,
          movieTitle,
          lockToken,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          date,
          time: showTime,
          seats: [...selectedSeats],
          total,
          ticketCount,
        },
      });
    } catch (err) {
      setError(err.message || "Could not secure your selected seats.");
      await loadAvailability();
    } finally {
      setLoadingBooking(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        color: "#f5f5f7",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.07), transparent 40%), #09090c",
      }}
    >
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
            color: "#b9b9c4",
            textTransform: "none",
            "&:hover": { color: "#f5c518" },
          }}
        >
          Back to show details
        </Button>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              color: "#f5c518",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              mb: 1,
            }}
          >
            YOUR CINEMA EXPERIENCE
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: "-1.2px",
              fontSize: { xs: 29, sm: 38 },
            }}
          >
            Choose your{" "}
            <Box component="span" sx={{ color: "#f5c518" }}>
              seats
            </Box>
          </Typography>

          <Typography sx={{ mt: 1, color: "#9999a5", lineHeight: 1.8 }}>
            Pick your favourite spot, enter your details, and reserve
            your movie night.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2, sm: 2.5 },
            color: "#f5f5f7",
            backgroundColor: "#141419",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                color: "#f5c518",
                backgroundColor: "rgba(245,197,24,0.09)",
              }}
            >
              <MovieRoundedIcon fontSize="large" />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800} fontSize={17}>
                {movieTitle}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 0.7 }}
              >
                <AccessTimeRoundedIcon
                  sx={{ color: "#f5c518", fontSize: 16 }}
                />
                <Typography sx={{ color: "#aaaab5", fontSize: 13 }}>
                  {showTime}
                </Typography>
                <Typography sx={{ color: "#666", fontSize: 13 }}>
                  ·
                </Typography>
                <Typography sx={{ color: "#aaaab5", fontSize: 13 }}>
                  {ticketCount} ticket(s)
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography
                sx={{ color: "#888894", fontSize: 11, letterSpacing: 1 }}
              >
                PRICE PER SEAT
              </Typography>
              <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: 20 }}>
                ₹{TICKET_PRICE}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {message && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            {message}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 3 },
            color: "#f5f5f7",
            backgroundColor: "#111115",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
          }}
        >
          <Box sx={{ maxWidth: 500, mx: "auto", mb: 4, pt: 1 }}>
            <Box
              sx={{
                height: 5,
                borderRadius: "50%",
                background:
                  "linear-gradient(90deg, transparent, #f5c518, transparent)",
                boxShadow: "0 7px 24px rgba(245,197,24,0.15)",
              }}
            />
            <Typography
              sx={{
                mt: 1.5,
                color: "#888894",
                textAlign: "center",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 4,
              }}
            >
              SCREEN THIS WAY
            </Typography>
          </Box>

          <Stack
            direction="row"
            justifyContent="center"
            flexWrap="wrap"
            gap={2}
            sx={{ mb: 3 }}
          >
            {[
              { color: "#292930", label: "Available" },
              { color: "#f5c518", label: "Selected" },
              { color: "#55555e", label: "Unavailable" },
            ].map((item) => (
              <Stack
                key={item.label}
                direction="row"
                spacing={0.8}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "3px",
                    backgroundColor: item.color,
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                />
                <Typography sx={{ color: "#aaaab5", fontSize: 11 }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {loadingSeats && (
            <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
              <CircularProgress size={25} sx={{ color: "#f5c518" }} />
              <Typography sx={{ color: "#9999a5", fontSize: 12 }}>
                Checking seat availability...
              </Typography>
            </Stack>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
              mb: 4,
            }}
          >
            {ROWS.map((row) => (
              <Stack
                key={row}
                direction="row"
                spacing={{ xs: 0.5, sm: 1 }}
                justifyContent="center"
                alignItems="center"
              >
                <Typography
                  sx={{
                    width: { xs: 15, sm: 22 },
                    color: "#777783",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {row}
                </Typography>

                {SEATS.filter((seat) => seat.startsWith(row)).map((seat) => {
                  const booked = unavailableSeats.has(seat);
                  const selected = selectedSeats.includes(seat);

                  return (
                    <Button
                      key={seat}
                      aria-label={`${seat}: ${
                        booked
                          ? "unavailable"
                          : selected
                            ? "selected"
                            : "available"
                      }`}
                      disabled={booked || loadingSeats || loadingBooking}
                      onClick={() => toggleSeat(seat)}
                      sx={{
                        minWidth: { xs: 27, sm: 40 },
                        width: { xs: 27, sm: 40 },
                        height: { xs: 32, sm: 39 },
                        p: 0,
                        borderRadius: "7px 7px 4px 4px",
                        border: "1px solid",
                        borderColor: selected
                          ? "#f5c518"
                          : booked
                            ? "#55555e"
                            : "#3d3d46",
                        color: selected ? "#141109" : "#d4d4dc",
                        backgroundColor: selected
                          ? "#f5c518"
                          : booked
                            ? "#55555e"
                            : "#24242c",
                        fontSize: { xs: 10, sm: 11 },
                        fontWeight: 800,
                        "&:hover": {
                          backgroundColor: selected ? "#ffda43" : "#35353f",
                          borderColor: "#f5c518",
                        },
                        "&.Mui-disabled": {
                          color: booked ? "#9999a5" : "#d4d4dc",
                          backgroundColor: booked ? "#34343b" : "#24242c",
                          borderColor: "#45454d",
                          opacity: booked ? 0.75 : 1,
                        },
                      }}
                    >
                      {seat.slice(1)}
                    </Button>
                  );
                })}

                <Typography
                  sx={{
                    width: { xs: 15, sm: 22 },
                    color: "#777783",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {row}
                </Typography>
              </Stack>
            ))}
          </Box>

          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(245,197,24,0.17)",
              backgroundColor: "rgba(245,197,24,0.045)",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography sx={{ color: "#aaaab5", fontSize: 12 }}>
                  Selected seats
                </Typography>
                <Typography sx={{ mt: 0.6, fontWeight: 800 }}>
                  {selectedSeats.length
                    ? selectedSeats.join(", ")
                    : "None selected"}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ color: "#aaaab5", fontSize: 12 }}>
                  Total amount
                </Typography>
                <Typography
                  sx={{
                    mt: 0.3,
                    color: "#f5c518",
                    fontSize: 25,
                    fontWeight: 900,
                  }}
                >
                  ₹{total}
                </Typography>
              </Box>
            </Stack>

            <Typography sx={{ mt: 1.2, color: "#777783", fontSize: 11 }}>
              Select exactly {ticketCount} seat(s). Seat holds are temporary.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleBooking}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 17 }}>
              Booking details
            </Typography>

            <TextField
              label="Full name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              autoComplete="name"
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
              sx={fieldStyle}
            />

            <TextField
              label="Email address"
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              autoComplete="email"
              required
              fullWidth
              inputProps={{ maxLength: 254 }}
              sx={fieldStyle}
            />

            <TextField
              label="Show date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedSeats([]);
                setMessage("");
                setError("");
              }}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              sx={fieldStyle}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={
                loadingBooking ||
                loadingSeats ||
                selectedSeats.length !== ticketCount ||
                !movieId
              }
              startIcon={
                loadingBooking ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <EventSeatRoundedIcon />
                )
              }
              sx={{
                mt: 1,
                py: 1.7,
                borderRadius: 2,
                color: "#15120a",
                backgroundColor: "#f5c518",
                fontWeight: 900,
                textTransform: "none",
                fontSize: 14,
                "&:hover": { backgroundColor: "#ffda43" },
                "&.Mui-disabled": {
                  color: "#77736a",
                  backgroundColor: "#39352a",
                },
              }}
            >
              {loadingBooking
                ? "Securing your seats..."
                : `Continue to payment · ₹${total}`}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

const fieldStyle = {
  "& .MuiInputLabel-root": { color: "#9999a5" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#f5c518" },
  "& .MuiOutlinedInput-root": {
    color: "#f5f5f7",
    backgroundColor: "#17171d",
    borderRadius: 2,
    "& fieldset": { borderColor: "#35353e" },
    "&:hover fieldset": { borderColor: "#666672" },
    "&.Mui-focused fieldset": { borderColor: "#f5c518" },
  },
  "& input": { colorScheme: "dark" },
};
