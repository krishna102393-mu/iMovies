
import { Container, Typography, Button, Box, Divider } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function Confirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <Container sx={{ color: "white", py: 8, textAlign: "center" }}>
        <Typography variant="h5">No booking details found.</Typography>
        <Button
          onClick={() => navigate("/")}
          sx={{ mt: 3, color: "#f5c518" }}
        >
          Return Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ color: "white", py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 75, color: "#4caf50" }} />

        <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
          Booking Confirmed!
        </Typography>

        <Typography sx={{ color: "#a6a6b2", mt: 1 }}>
          Your booking details are below.
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: "#17171c",
          border: "1px solid #30303a",
          borderRadius: 3,
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
          Movie: {String(state.movie || "Unknown Movie").replaceAll("-", " ")}
        </Typography>

        <Typography sx={{ mt: 2, color: "#aaa", overflowWrap: "anywhere" }}>
          Booking ID: {state.bookingId || "Not available"}
        </Typography>

        {state.customerName && (
          <Typography sx={{ mt: 2 }}>
            Customer: {state.customerName}
          </Typography>
        )}

        {state.customerEmail && (
          <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>
            Email: {state.customerEmail}
          </Typography>
        )}

        {state.date && (
          <Typography sx={{ mt: 1 }}>
            Show Date: {state.date}
          </Typography>
        )}

        <Typography sx={{ mt: 1 }}>
          Showtime: {state.time}
        </Typography>

        <Typography sx={{ mt: 1 }}>
          Tickets: {state.ticketCount}
        </Typography>

        {state.seats?.length > 0 && (
          <Typography sx={{ mt: 1 }}>
            Seats: {state.seats.join(", ")}
          </Typography>
        )}

        <Divider sx={{ borderColor: "#30303a", my: 3 }} />

        <Typography variant="h5" sx={{ color: "#f5c518", fontWeight: "bold" }}>
          Total: ₹{state.total}
        </Typography>

        <Typography variant="body2" sx={{ color: "#aaa", mt: 2 }}>
          {state.saved
            ? "Booking record saved to the database."
            : "This booking has not been verified as saved."}
        </Typography>
      </Box>

      <Button
        fullWidth
        variant="outlined"
        onClick={() => window.print()}
        sx={{
          mt: 3,
          color: "#f5c518",
          borderColor: "#f5c518",
          fontWeight: "bold",
          "&:hover": {
            borderColor: "#dfb20c",
            backgroundColor: "#24242c",
          },
        }}
      >
        Print Ticket
      </Button>

      <Button
        fullWidth
        variant="contained"
        onClick={() => navigate("/")}
        sx={{
          mt: 2,
          backgroundColor: "#f5c518",
          color: "#111",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#dfb20c" },
        }}
      >
        Back to Home
      </Button>
    </Container>
  );
}
