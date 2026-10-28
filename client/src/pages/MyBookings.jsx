
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import MovieIcon from "@mui/icons-material/Movie";

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/bookings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load bookings.");
        }

        setBookings(Array.isArray(data) ? data : data.bookings || []);
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <Container maxWidth="md" sx={{ color: "white", py: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <ConfirmationNumberIcon sx={{ color: "#f5c518", fontSize: 38 }} />
        <Typography variant="h4" fontWeight="bold">
          My Bookings
        </Typography>
      </Box>

      <Typography sx={{ color: "#a6a6b2", mb: 4 }}>
        View your saved movie ticket bookings.
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#f5c518" }} />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">{error}</Alert>
      )}

      {!loading && !error && bookings.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 7,
            px: 3,
            backgroundColor: "#17171c",
            border: "1px solid #30303a",
            borderRadius: 3,
          }}
        >
          <MovieIcon sx={{ fontSize: 65, color: "#777" }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            No bookings yet
          </Typography>
          <Typography sx={{ color: "#a6a6b2", mt: 1 }}>
            Your saved bookings will appear here.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            sx={{
              mt: 3,
              backgroundColor: "#f5c518",
              color: "#111",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#dfb20c" },
            }}
          >
            Explore Movies
          </Button>
        </Box>
      )}

      {!loading &&
        !error &&
        bookings.map((booking) => (
          <Card
            key={booking._id}
            sx={{
              mb: 3,
              backgroundColor: "#17171c",
              color: "white",
              border: "1px solid #30303a",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ textTransform: "capitalize" }}
              >
                {booking.movieTitle}
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "#a6a6b2", mt: 1, overflowWrap: "anywhere" }}
              >
                Booking ID: {booking._id}
              </Typography>

              <Divider sx={{ borderColor: "#30303a", my: 2 }} />

              <Typography sx={{ mb: 1 }}>
                Customer: {booking.customerName}
              </Typography>

              <Typography sx={{ mb: 1, overflowWrap: "anywhere" }}>
                Email: {booking.customerEmail}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                Show date: {booking.showDate}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                Showtime: {booking.showTime}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                Seats: {booking.seats?.join(", ") || "Not specified"}
              </Typography>

              <Typography
                variant="h6"
                sx={{ mt: 2, color: "#f5c518", fontWeight: "bold" }}
              >
                Total: ₹{booking.totalAmount}
              </Typography>

              {booking.createdAt && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "#888", mt: 2 }}
                >
                  Booking created:{" "}
                  {new Date(booking.createdAt).toLocaleString("en-IN")}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}

      <Button
        variant="outlined"
        onClick={() => navigate("/")}
        sx={{
          mt: 2,
          color: "#f5c518",
          borderColor: "#f5c518",
          "&:hover": { borderColor: "#dfb20c" },
        }}
      >
        Back to Home
      </Button>
    </Container>
  );
}
