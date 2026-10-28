
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
} from "@mui/material";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMovie() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/api/movies");

        if (!response.ok) {
          throw new Error("Could not load movies.");
        }

        const data = await response.json();

        const selectedMovie = data.movies.find(
          (item) => String(item.id) === String(id)
        );

        if (!selectedMovie) {
          throw new Error("Movie not found.");
        }

        setMovie(selectedMovie);
      } catch (err) {
        setError(err.message || "Unable to load movie details.");
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ color: "white", py: 6 }}>
        <Typography>Loading movie details...</Typography>
      </Container>
    );
  }

  if (error || !movie) {
    return (
      <Container sx={{ color: "white", py: 6 }}>
        <Typography variant="h4">
          {error || "Movie not found"}
        </Typography>

        <Button
          onClick={() => navigate("/")}
          sx={{ mt: 2, color: "#f5c518" }}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ color: "white", py: 6 }}>
      <Button
        onClick={() => navigate("/")}
        sx={{ color: "#f5c518", mb: 3 }}
      >
        ← Back to Movies
      </Button>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
          gap: 4,
          alignItems: "start",
        }}
      >
        <Box
          component="img"
          src={
            movie.poster ||
            "https://placehold.co/500x750/17171c/ffffff?text=No+Poster"
          }
          alt={movie.title}
          sx={{
            width: "100%",
            maxWidth: 300,
            borderRadius: 3,
          }}
        />

        <Box>
          <Typography variant="h3" fontWeight="bold">
            {movie.title}
          </Typography>

          <Typography sx={{ color: "#a6a6b2", mt: 2 }}>
            {movie.genre || "Genre information unavailable"}
          </Typography>

          <Typography sx={{ color: "#f5c518", mt: 1 }}>
            ★ {movie.rating ?? "N/A"}
          </Typography>

          <Typography sx={{ color: "#b5b5bf", mt: 3, lineHeight: 1.8 }}>
            {movie.overview || "No description is available for this movie."}
          </Typography>

          <Typography sx={{ mt: 2 }}>
            Release date: {movie.releaseDate || "Not available"}
          </Typography>

          <Typography
            sx={{ mt: 2, color: "#f5c518", fontSize: "1.2rem" }}
          >
            Ticket price: ₹{movie.price ?? 200}
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate(`/booking/${movie.id}`)}
            sx={{
              mt: 3,
              backgroundColor: "#f5c518",
              color: "#111",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#dfb20c",
              },
            }}
          >
            Continue to Booking
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
