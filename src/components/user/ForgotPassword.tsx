import { useEffect, useRef, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { supabase } from '../../util/supabase';
import { useTheme } from '@mui/material';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({ open, handleClose }: ForgotPasswordProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        const typedErr = resetError as any;
        if (typedErr.status === 429 || resetError.message.toLowerCase().includes('rate limit') || resetError.message.toLowerCase().includes('email rate')) {
          setError('Too many requests. Supabase\'s free tier limits how many reset emails can be sent per hour. Configure custom SMTP in your Supabase dashboard to remove this limit, or try again later.');
        } else {
          setError(resetError.message);
        }
        return;
      }

      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setEmail('');
    setSent(false);
    setError('');
    setCooldown(0);
    if (timerRef.current) clearInterval(timerRef.current);
    handleClose();
  };

  const handleRetry = () => {
    setSent(false);
    setError('');
    startCooldown();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
        sx: {
          backgroundImage: "none",
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      {sent ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Check your email
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We sent a reset link to <strong>{email}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Didn't get it? Check your spam folder, or{' '}
            <Button
              type="button"
              onClick={handleRetry}
              disabled={cooldown > 0}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: theme.palette.primary.main,
                minWidth: 0,
                p: 0,
                verticalAlign: 'baseline',
                fontSize: 'inherit',
                '&:hover': { background: 'none', textDecoration: 'underline' },
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'send again'}
            </Button>
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCloseDialog}
            sx={{
              py: 1.3,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            Done
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{
            height: 6,
            background: theme.palette.primary.main === '#d6001c'
              ? 'linear-gradient(90deg, #d6001c 0%, #ffcd00 50%, #ff671f 100%)'
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }} />
          <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pt: 4, px: 4 }}>
            Reset password
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, px: 4, pb: 2, pt: 1 }}>
            <DialogContentText sx={{ textAlign: 'center' }}>
              Enter your account&apos;s email address, and we&apos;ll send you a link to
              reset your password.
            </DialogContentText>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              required
              id="email"
              name="email"
              label="Email address"
              placeholder="your@email.com"
              type="email"
              fullWidth
              variant="outlined"
              size="medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ pb: 4, px: 4, gap: 1.5 }}>
            <Button
              onClick={handleCloseDialog}
              fullWidth
              variant="outlined"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                color: theme.palette.mode === 'dark' ? theme.palette.common.white : undefined,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : undefined,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loading || !email}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                py: 1,
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {loading ? 'Sending...' : 'Continue'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
