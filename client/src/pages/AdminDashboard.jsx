
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MovieIcon from "@mui/icons-material/Movie";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";

const API = "http://localhost:5000";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("imoviesUser") || "null"
      );
      const token = localStorage.getItem("imoviesToken");

      if (!token || !savedUser || savedUser.role !== "admin") {
        navigate("/login", { replace: true });
        return;
      }

      setUser(savedUser);
      loadDashboard();
    } catch {
      localStorage.removeItem("imoviesUser");
      localStorage.removeItem("imoviesToken");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [bookingResponse, movieResponse] = await Promise.all([
        fetch(`${API}/api/bookings`),
        fetch(`${API}/api/movies`),
      ]);

      if (!bookingResponse.ok || !movieResponse.ok) {
        throw new Error("Could not load dashboard data. Check the backend.");
      }

      const bookingData = await bookingResponse.json();
      const movieData = await movieResponse.json();

      setBookings(
        Array.isArray(bookingData)
          ? bookingData
          : bookingData.bookings || []
      );

      setMovies(
        Array.isArray(movieData)
          ? movieData
          : movieData.movies || []
      );
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("imoviesToken");
    localStorage.removeItem("imoviesUser");
    navigate("/login", { replace: true });
  }

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + (Number(booking.totalAmount) || 0),
    0
  );

  const stats = [
    {
      title: "Movies Available",
      value: movies.length,
      icon: <MovieIcon />,
    },
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: <ConfirmationNumberIcon />,
    },
    {
      title: "Booking Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: <DashboardIcon />,
    },
    {
      title: "Admin Account",
      value: user?.name || "Administrator",
      icon: <PeopleIcon />,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0b0b0f", color: "white", py: 4 }}>
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4" fontWeight="900">
              Admin <Box component="span" sx={{ color: "#f5c518" }}>Dashboard</Box>
            </Typography>
            <Typography sx={{ color: "#aaa", mt: 1 }}>
              Manage your iMovies platform.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadDashboard}
              sx={{ color: "#f5c518" }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "#555",
                "&:hover": { borderColor: "#f5c518" },
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>

        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "#17171e",
            color: "white",
            border: "1px solid #30303a",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <DashboardIcon sx={{ color: "#f5c518" }} />
            <Typography>
              Welcome, {user?.name || "Administrator"}
            </Typography>
            <Chip label="ADMIN" size="small" sx={{ bgcolor: "#f5c518", fontWeight: "bold" }} />
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#f5c518" }} />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {stats.map((stat) => (
                <Grid key={stat.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Paper
                    sx={{
                      p: 3,
                      bgcolor: "#17171e",
                      color: "white",
                      border: "1px solid #30303a",
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography sx={{ color: "#aaa", mb: 1 }}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box sx={{ color: "#f5c518" }}>{stat.icon}</Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                bgcolor: "#17171e",
                color: "white",
                border: "1px solid #30303a",
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Movie Catalogue
              </Typography>
              <Typography sx={{ color: "#aaa", mb: 2 }}>
                Movies currently loaded from TMDB. Add/edit/delete controls
                will be connected to the database in the next step.
              </Typography>

              {movies.length === 0 ? (
                <Typography sx={{ color: "#aaa" }}>No movies found.</Typography>
              ) : (
                <Stack spacing={1}>
                  {movies.slice(0, 10).map((movie) => (
                    <Paper
                      key={movie.id}
                      sx={{
                        p: 2,
                        bgcolor: "#202027",
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Typography>{movie.title}</Typography>
                      <Chip
                        label={`₹${movie.price ?? 200}`}
                        size="small"
                        sx={{ color: "#f5c518", borderColor: "#f5c518" }}
                        variant="outlined"
                      />
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: "#17171e",
                color: "white",
                border: "1px solid #30303a",
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Recent Bookings
              </Typography>

              {bookings.length === 0 ? (
                <Typography sx={{ color: "#aaa" }}>No bookings yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {bookings.slice(0, 10).map((booking) => (
                    <Paper
                      key={booking._id}
                      sx={{ p: 2, bgcolor: "#202027", color: "white" }}
                    >
                      <Typography fontWeight="bold">
                        {booking.movieTitle}
                      </Typography>
                      <Typography sx={{ color: "#bbb", mt: 0.5 }}>
                        {booking.customerName} · {booking.showDate} ·{" "}
                        {booking.showTime}
                      </Typography>
                      <Typography sx={{ color: "#f5c518", mt: 0.5 }}>
                        Seats: {(booking.seats || []).join(", ")} · ₹
                        {booking.totalAmount}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </>
        )}

        <Button
          onClick={() => navigate("/")}
          sx={{ mt: 3, color: "#f5c518" }}
        >
          Back to Movies
        </Button>
      </Container>
    </Box>
  );
}
