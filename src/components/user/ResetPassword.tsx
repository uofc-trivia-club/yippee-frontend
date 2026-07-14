import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { supabase } from "../../util/supabase";

export default function ResetPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("type=recovery")) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
  };

  const isUcalgary = theme.palette.primary.main === "#d6001c";

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
          maxWidth: 440,
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
          {done ? (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Password updated
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your password has been reset successfully.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/sign-in")}
                sx={{
                  py: 1.3,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: theme.palette.primary.main,
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                }}
              >
                Sign in
              </Button>
            </Box>
          ) : (
            <>
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Enter your new password.
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
                <FormControl>
                  <FormLabel
                    htmlFor="password"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    New Password
                  </FormLabel>
                  <TextField
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
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

                <FormControl>
                  <FormLabel
                    htmlFor="confirm"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Confirm Password
                  </FormLabel>
                  <TextField
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
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
                    "Reset Password"
                  )}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
