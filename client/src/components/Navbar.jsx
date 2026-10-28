
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LocalMoviesRoundedIcon from "@mui/icons-material/LocalMoviesRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goHome = () => {
    setMobileOpen(false);
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToMovies = () => {
    setMobileOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => {
        document.getElementById("movies")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
      return;
    }

    document.getElementById("movies")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const goToBookings = () => {
    setMobileOpen(false);
    navigate("/my-bookings");
  };

  const goToLogin = () => {
    setMobileOpen(false);
    navigate("/login");
  };

  const navItems = [
    {
      label: "Home",
      action: goHome,
      active: location.pathname === "/",
    },
    {
      label: "Movies",
      action: goToMovies,
      active: location.pathname.startsWith("/movie"),
    },
    {
      label: "My Bookings",
      action: goToBookings,
      active:
        location.pathname === "/my-bookings" ||
        location.pathname === "/confirmation",
    },
  ];

  const navButtonStyle = (active) => ({
    position: "relative",
    px: 2,
    py: 1,
    borderRadius: "7px",
    color: active ? "#f5c518" : "#b9b9c4",
    fontSize: "13px",
    fontWeight: active ? 800 : 600,
    textTransform: "none",
    transition: "color 180ms ease, background 180ms ease",
    "&:hover": {
      color: "#f5c518",
      backgroundColor: "rgba(245,197,24,0.06)",
    },
    ...(active && {
      "&::after": {
        content: '""',
        position: "absolute",
        bottom: 2,
        left: "50%",
        width: "15px",
        height: "2px",
        borderRadius: "2px",
        backgroundColor: "#f5c518",
        transform: "translateX(-50%)",
      },
    }),
  });

  const signInStyle = {
    ml: 1,
    px: 2.5,
    py: 1.15,
    borderRadius: "7px",
    color: "#15120a",
    backgroundColor: "#f5c518",
    boxShadow: "0 4px 18px rgba(245,197,24,0.08)",
    fontSize: "13px",
    fontWeight: 800,
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#ffda43",
      boxShadow: "0 5px 22px rgba(245,197,24,0.17)",
    },
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        zIndex: 1100,
        color: "#f5f5f7",
        backgroundColor: "rgba(9,9,12,0.94)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar
        sx={{
          width: "100%",
          maxWidth: "1244px",
          mx: "auto",
          px: { xs: "18px !important", md: "32px !important" },
          minHeight: { xs: "64px !important", md: "76px !important" },
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          component="button"
          onClick={goHome}
          aria-label="iMovies home"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            p: 0,
            border: 0,
            cursor: "pointer",
            background: "transparent",
            color: "white",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 39,
              height: 39,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(245,197,24,0.27)",
              borderRadius: "10px",
              background:
                "linear-gradient(145deg, rgba(245,197,24,0.14), rgba(245,197,24,0.025))",
            }}
          >
            <LocalMoviesRoundedIcon
              sx={{ color: "#f5c518", fontSize: 25 }}
            />
          </Box>

          <Box sx={{ textAlign: "left" }}>
            <Typography
              component="span"
              sx={{
                display: "block",
                color: "#fff",
                fontSize: "22px",
                fontWeight: 950,
                lineHeight: 1.05,
                letterSpacing: "-1.1px",
              }}
            >
              i<span style={{ color: "#f5c518" }}>Movies</span>
            </Typography>
            <Typography
              component="span"
              sx={{
                display: "block",
                mt: 0.4,
                color: "#777783",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "2px",
              }}
            >
              YOUR CINEMA CLUB
            </Typography>
          </Box>
        </Box>

        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.label}
              onClick={item.action}
              aria-current={item.active ? "page" : undefined}
              sx={navButtonStyle(item.active)}
            >
              {item.label}
            </Button>
          ))}

          <Button
            variant="contained"
            onClick={goToLogin}
            endIcon={<ArrowOutwardRoundedIcon sx={{ fontSize: "16px !important" }} />}
            sx={signInStyle}
          >
            Sign In
          </Button>
        </Box>

        <IconButton
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          sx={{
            display: { xs: "inline-flex", md: "none" },
            width: 42,
            height: 42,
            color: "#f5c518",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "9px",
            backgroundColor: "rgba(255,255,255,0.035)",
            "&:hover": {
              backgroundColor: "rgba(245,197,24,0.09)",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "min(320px, 86vw)", sm: 340 },
            color: "#f5f5f7",
            backgroundColor: "#101015",
            backgroundImage:
              "radial-gradient(ellipse at top right, rgba(245,197,24,0.07), transparent 60%)",
            borderLeft: "1px solid rgba(255,255,255,0.09)",
            pt: 1,
          },
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 900 }}>
            i<span style={{ color: "#f5c518" }}>Movies</span>
          </Typography>

          <IconButton
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            sx={{ color: "#aaaab5" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
          <Typography
            sx={{
              color: "#777783",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            EXPLORE IMOVIES
          </Typography>
        </Box>

        <List sx={{ px: 1.5 }}>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={item.action}
                selected={item.active}
                sx={{
                  minHeight: 48,
                  px: 2,
                  borderRadius: "8px",
                  color: item.active ? "#f5c518" : "#d1d1d9",
                  "&.Mui-selected": {
                    color: "#f5c518",
                    backgroundColor: "rgba(245,197,24,0.09)",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "rgba(245,197,24,0.13)",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: item.active ? 800 : 600,
                  }}
                />
                {item.active && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#f5c518",
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ px: 2.5, pt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={goToLogin}
            endIcon={<ArrowOutwardRoundedIcon />}
            sx={{ ...signInStyle, ml: 0, py: 1.4 }}
          >
            Sign In / Create Account
          </Button>
        </Box>

        <Box sx={{ mt: "auto", px: 2.5, py: 3 }}>
          <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.08)" }} />
          <Typography sx={{ color: "#777783", fontSize: 11 }}>
            Made for the love of cinema.
          </Typography>
        </Box>
      </Drawer>
    </AppBar>
  );
}
