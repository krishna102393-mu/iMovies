
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleModeChange = (_, newMode) => {
    setMode(newMode);
    setIsRegister(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (isRegister && (!name.trim() || password.length < 8)) {
      setError("Enter your name and a password of at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister
        ? "/register"
        : mode === "admin"
          ? "/admin/login"
          : "/login";

      const response = await fetch(
        `http://localhost:5000/api/auth${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister
              ? { name, email, password }
              : { email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (!data.token || !data.user) {
        throw new Error("The server returned an invalid login response.");
      }

      if (data.user.role !== mode) {
        throw new Error("Your account does not match the selected login type.");
      }

      // Demo storage. We'll move to secure HttpOnly cookies before production.
      localStorage.setItem("imoviesToken", data.token);
      localStorage.setItem("imoviesUser", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 7, color: "white" }}>
      <Box
        sx={{
          backgroundColor: "#141419",
          border: "1px solid #30303a",
          borderRadius: 4,
          p: { xs: 3, sm: 5 },
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LocalMoviesIcon sx={{ color: "#f5c518", fontSize: 52 }} />

          <Typography variant="h4" fontWeight="900">
            i<span style={{ color: "#f5c518" }}>Movies</span>
          </Typography>

          <Typography sx={{ color: "#a6a6b2", mt: 1 }}>
            {isRegister
              ? "Create your account"
              : "Sign in to continue"}
          </Typography>
        </Box>

        <Tabs
          value={mode}
          onChange={handleModeChange}
          variant="fullWidth"
          sx={{
            mb: 3,
            "& .MuiTab-root": { color: "#aaa", fontWeight: "bold" },
            "& .Mui-selected": { color: "#f5c518 !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#f5c518" },
          }}
        >
          <Tab value="user" label="User Login" />
          <Tab value="admin" label="Admin Login" />
        </Tabs>

        {mode === "admin" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Administrator credentials are required. User accounts cannot
            access the admin area.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {isRegister && mode === "user" && (
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              margin="normal"
              autoComplete="name"
              slotProps={{ htmlInput: { maxLength: 100 } }}
              sx={fieldStyle}
            />
          )}

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="email"
            sx={fieldStyle}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete={isRegister ? "new-password" : "current-password"}
            slotProps={{
              htmlInput: { minLength: isRegister ? 8 : undefined },
            }}
            sx={fieldStyle}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              backgroundColor: "#f5c518",
              color: "#111",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#dfb20c" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#111" }} />
            ) : isRegister ? (
              "Create Account"
            ) : mode === "admin" ? (
              "Admin Sign In"
            ) : (
              "User Sign In"
            )}
          </Button>
        </Box>

        {mode === "user" && (
          <Typography textAlign="center" sx={{ mt: 3, color: "#aaa" }}>
            {isRegister ? "Already have an account? " : "New to iMovies? "}
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              sx={{ color: "#f5c518", fontWeight: "bold" }}
            >
              {isRegister ? "Sign in" : "Create account"}
            </Link>
          </Typography>
        )}

        <Button
          fullWidth
          onClick={() => navigate("/")}
          sx={{ mt: 2, color: "#aaa" }}
        >
          Back to Movies
        </Button>
      </Box>
    </Container>
  );
}

const fieldStyle = {
  "& .MuiInputBase-root": { color: "white" },
  "& .MuiInputLabel-root": { color: "#aaa" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#454550" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#f5c518",
  },
};
