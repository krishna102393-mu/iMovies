
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Radio,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

const API = "http://localhost:5000";

const methods = [
  { id: "upi", label: "UPI", description: "Simulated UPI payment", Icon: PhoneAndroidRoundedIcon },
  { id: "card", label: "Credit / Debit Card", description: "Simulated card payment", Icon: CreditCardRoundedIcon },
  { id: "netbanking", label: "Net Banking", description: "Simulated online banking", Icon: AccountBalanceRoundedIcon },
];

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!state?.lockToken || !state?.movieId || !Array.isArray(state?.seats)) {
    return (
      <Box sx={pageStyle}>
        <Container maxWidth="sm">
          <Paper sx={panelStyle}>
            <Typography variant="h5" fontWeight={800}>
              Payment session unavailable
            </Typography>
            <Typography sx={{ color: "#aaa", my: 2 }}>
              Please return to seat selection and start your booking again.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/")}>
              Back to movies
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const pay = async () => {
    setLoading(true);
    setError("");

    try {
      // Demonstration only: no money is transferred.
      // This endpoint saves a booking after the simulated success action.
      const response = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: state.movieId,
          movieTitle: state.movieTitle,
          lockToken: state.lockToken,
          customerName: state.customerName,
          customerEmail: state.customerEmail,
          showDate: state.date,
          showTime: state.time,
          seats: state.seats,
          totalAmount: state.total,
          paymentMethod: method,
          paymentStatus: "simulated_success",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking could not be confirmed.");
      }

      navigate("/confirmation", {
        state: {
          movie: state.movieTitle,
          movieId: state.movieId,
          date: state.date,
          time: state.time,
          ticketCount: state.seats.length,
          seats: state.seats,
          total: state.total,
          bookingId: data.booking?._id || "",
          customerName: state.customerName,
          customerEmail: state.customerEmail,
          paymentMethod: method,
          paymentStatus: "simulated_success",
          saved: true,
        },
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Unable to complete the demo payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={pageStyle}>
      <Container maxWidth="sm">
        <Button
          onClick={() => navigate(-1)}
          sx={{ color: "#f5c518", mb: 2, textTransform: "none" }}
        >
          ← Back to seats
        </Button>

        <Typography sx={{ color: "#f5c518", letterSpacing: 3, fontSize: 11, fontWeight: 800 }}>
          IMOVIES CHECKOUT
        </Typography>
        <Typography variant="h4" fontWeight={900} sx={{ mt: 1, mb: 3 }}>
          Complete your <Box component="span" sx={{ color: "#f5c518" }}>payment</Box>
        </Typography>

        <Paper sx={panelStyle}>
          <Typography fontSize={19} fontWeight={800}>
            {state.movieTitle}
          </Typography>
          <Typography sx={{ color: "#aaa", mt: 1 }}>
            {state.date} · {state.time}
          </Typography>
          <Typography sx={{ color: "#aaa", mt: 0.5 }}>
            Seats: {state.seats.join(", ")}
          </Typography>

          <Box sx={{ borderTop: "1px solid #333", my: 2 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: "#bbb" }}>Total payable</Typography>
            <Typography sx={{ color: "#f5c518", fontWeight: 900, fontSize: 28 }}>
              ₹{state.total}
            </Typography>
          </Stack>
        </Paper>

        <Typography fontWeight={800} sx={{ mt: 3, mb: 1.5 }}>
          Choose a payment method
        </Typography>

        <Stack spacing={1.5}>
          {methods.map(({ id, label, description, Icon }) => (
            <Paper
              key={id}
              onClick={() => setMethod(id)}
              sx={{
                ...panelStyle,
                p: 2,
                cursor: "pointer",
                borderColor: method === id ? "#f5c518" : "#303038",
                background: method === id ? "#201e15" : "#141419",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Radio
                  checked={method === id}
                  sx={{ color: "#777", "&.Mui-checked": { color: "#f5c518" } }}
                />
                <Icon sx={{ color: "#f5c518" }} />
                <Box flex={1}>
                  <Typography fontWeight={700}>{label}</Typography>
                  <Typography sx={{ color: "#999", fontSize: 12 }}>
                    {description}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Alert severity="info" sx={{ mt: 2 }}>
          Demo checkout only. No real payment will be processed.
        </Alert>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Button
          fullWidth
          variant="contained"
          disabled={loading}
          onClick={pay}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockRoundedIcon />}
          sx={{
            mt: 3,
            py: 1.7,
            borderRadius: 2,
            background: "#f5c518",
            color: "#111",
            fontWeight: 900,
            textTransform: "none",
            "&:hover": { background: "#ffda43" },
          }}
        >
          {loading ? "Confirming booking..." : `Simulate payment · ₹${state.total}`}
        </Button>
      </Container>
    </Box>
  );
}

const pageStyle = {
  minHeight: "100vh",
  py: 5,
  color: "#f5f5f7",
  background: "radial-gradient(ellipse at top, #252013 0%, #09090c 48%)",
};

const panelStyle = {
  p: 2.5,
  color: "#f5f5f7",
  background: "#141419",
  border: "1px solid #303038",
  borderRadius: 3,
};
