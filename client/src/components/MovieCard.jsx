
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
} from "@mui/material";

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        backgroundColor: "#17171c",
        color: "white",
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 0.3s",
        "&:hover": {
          transform: "translateY(-6px)",
        },
      }}
    >
      <CardMedia
        component="img"
        height="320"
        image={
          movie.poster ||
          "https://placehold.co/500x750/17171c/ffffff?text=No+Poster"
        }
        alt={movie.title}
      />

      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          {movie.title}
        </Typography>

        <Typography sx={{ color: "#a6a6b2", mt: 1 }}>
          {movie.genre}
        </Typography>

        <Typography sx={{ color: "#f5c518", mt: 1 }}>
          ★ {movie.rating}
        </Typography>

        <Typography
          sx={{
            color: "#a6a6b2",
            mt: 1,
            minHeight: 48,
          }}
        >
          {movie.overview
            ? `${movie.overview.slice(0, 90)}${
                movie.overview.length > 90 ? "..." : ""
              }`
            : "Discover this movie on iMovies."}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate(`/movie/${movie.id}`)}
            sx={{
              backgroundColor: "#f5c518",
              color: "#111",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#dfb20c",
              },
            }}
          >
            Book Tickets
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
