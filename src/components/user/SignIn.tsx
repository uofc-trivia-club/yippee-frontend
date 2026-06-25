import { useTheme } from '@mui/material/styles';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../util/supabase';

export default function SignIn() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate('/', { replace: true });
  };

  const isUcalgary = theme.palette.primary.main === '#d6001c';

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 80px)',
      px: 2,
      py: 4,
    }}>
      <Card
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box sx={{
          height: 6,
          background: isUcalgary
            ? 'linear-gradient(90deg, #d6001c 0%, #ffcd00 50%, #ff671f 100%)'
            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }} />
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '.15rem',
                color: theme.palette.primary.main,
              }}
            >
              YIPPEE
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome back! Sign in to your account.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl>
              <FormLabel htmlFor="email" sx={{ fontWeight: 600, mb: 0.5 }}>Email</FormLabel>
              <TextField
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                size="medium"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } }}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password" sx={{ fontWeight: 600, mb: 0.5 }}>Password</FormLabel>
              <TextField
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                size="medium"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } }}
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
                fontSize: '1rem',
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link href="/sign-up" underline="hover" sx={{ fontWeight: 600, color: theme.palette.primary.main, cursor: 'pointer' }}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
