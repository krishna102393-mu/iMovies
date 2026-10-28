
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";

export default function Booking() {
  const { id } = useParams();
  const [selectedTime, setSelectedTime] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const navigate = useNavigate();
const ticketPrice = 200;

  const showtimes = ["10:00 AM", "1:30 PM", "5:00 PM", "8:30 PM"];

  return (
    <Container sx={{ color: "white", py: 6 }}>
      <Typography variant="h3" fontWeight="bold">
        Book Your Tickets
      </Typography>

      <Typography sx={{ color: "#f5c518", mt: 2 }}>
        Movie: {id.replaceAll("-", " ")}
      </Typography>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Select a Show Time
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {showtimes.map((time) => (
          <Button
            key={time}
            onClick={() => setSelectedTime(time)}
            variant={selectedTime === time ? "contained" : "outlined"}
            sx={{
              color: selectedTime === time ? "#111" : "#f5c518",
              backgroundColor:
                selectedTime === time ? "#f5c518" : "transparent",
              borderColor: "#f5c518",
              "&:hover": { borderColor: "#dfb20c" },
            }}
          >
            {time}
          </Button>
        ))}
      </Box>

      {selectedTime && (
        <Typography sx={{ mt: 3, color: "#a6a6b2" }}>
          Selected showtime: {selectedTime}
        </Typography>
      )}
      
<Box sx={{ mt: 4 }}>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Number of Tickets
  </Typography>

  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    <Button
      variant="outlined"
      disabled={ticketCount === 1}
      onClick={() => setTicketCount(ticketCount - 1)}
      sx={{ color: "#f5c518", borderColor: "#f5c518" }}
    >
      −
    </Button>

    <Typography variant="h6">{ticketCount}</Typography>

    <Button
      variant="outlined"
      disabled={ticketCount === 10}
      onClick={() => setTicketCount(ticketCount + 1)}
      sx={{ color: "#f5c518", borderColor: "#f5c518" }}
    >
      +
    </Button>
  </Box>

  <Typography sx={{ mt: 3, color: "#f5c518" }} variant="h5">
    Total: ₹{ticketCount * ticketPrice}
  </Typography>
  
<Button
  variant="contained"
  disabled={!selectedTime}
  onClick={() =>
  navigate("/seats", {
    state: {
      movie: id,
      time: selectedTime,
      ticketCount: ticketCount,
    },
  })
}
  sx={{
    mt: 3,
    display: "block",
    backgroundColor: "#f5c518",
    color: "#111",
    fontWeight: "bold",
    "&:hover": { backgroundColor: "#dfb20c" },
  }}
>
  Confirm Booking
</Button>

</Box>

    </Container>
  );
}
