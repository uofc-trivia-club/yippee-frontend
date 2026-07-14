import { useTheme } from "@mui/material/styles";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { supabase } from "../../util/supabase";

export default function SignUp() {
  const theme = useTheme();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          lastName: lastName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const isUcalgary = theme.palette.primary.main === "#d6001c";

  if (success) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          px: 2,
          py: 4,
        }}
      >
        <Card
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: 480,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: 6,
              background: isUcalgary
                ? "linear-gradient(90deg, #d6001c 0%, #ffcd00 50%, #ff671f 100%)"
                : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          />
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Check your email
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click the
              link to activate your account, then sign in.
            </Typography>
            <Button
              variant="contained"
              href="/sign-in"
              sx={{ textTransform: "none" }}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 80px)",
        px: 2,
        py: 4,
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            height: 6,
            background: isUcalgary
              ? "linear-gradient(90deg, #d6001c 0%, #ffcd00 50%, #ff671f 100%)"
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        />
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: ".15rem",
                color: theme.palette.primary.main,
              }}
            >
              YIPPEE
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Create your account and start hosting quizzes!
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel
                    htmlFor="firstName"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    First Name
                  </FormLabel>
                  <TextField
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jon"
                    autoComplete="given-name"
                    required
                    fullWidth
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.02)",
                      },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel
                    htmlFor="lastName"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Last Name
                  </FormLabel>
                  <TextField
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Snow"
                    autoComplete="family-name"
                    required
                    fullWidth
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.02)",
                      },
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>

            <FormControl>
              <FormLabel htmlFor="email" sx={{ fontWeight: 600, mb: 0.5 }}>
                Email
              </FormLabel>
              <TextField
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.02)",
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password" sx={{ fontWeight: 600, mb: 0.5 }}>
                Password
              </FormLabel>
              <TextField
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min. 6 characters)"
                autoComplete="new-password"
                required
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.02)",
                  },
                }}
              />
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              size="large"
              sx={{
                mt: 1,
                py: 1.3,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                bgcolor: theme.palette.primary.main,
                "&:hover": { bgcolor: theme.palette.primary.dark },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Account"
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                underline="hover"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  cursor: "pointer",
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
