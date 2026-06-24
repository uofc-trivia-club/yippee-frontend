import { useTheme } from '@mui/material/styles';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../util/authApi';
import { setCredentials } from '../../stores/authSlice';

export default function SignUp() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [lastNameError, setLastNameError] = useState(false);
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;
    const lastName = document.getElementById('lastName') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('First name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!lastName.value || lastName.value.length < 1) {
      setLastNameError(true);
      setLastNameErrorMessage('Last name is required.');
      isValid = false;
    } else {
      setLastNameError(false);
      setLastNameErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const data = new FormData(event.currentTarget);
    const name = data.get('name') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    setLoading(true);
    setApiError('');

    try {
      const result = await authApi.signup({ name, lastName, email, password });
      dispatch(setCredentials({ user: result.user, token: result.token }));
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
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
          maxWidth: 480,
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
              Create your account and start hosting quizzes!
            </Typography>
          </Box>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {apiError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="name" sx={{ fontWeight: 600, mb: 0.5 }}>
                    First Name
                  </FormLabel>
                  <TextField
                    autoComplete="given-name"
                    name="name"
                    required
                    fullWidth
                    id="name"
                    placeholder="Jon"
                    error={nameError}
                    helperText={nameErrorMessage}
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="lastName" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Last Name
                  </FormLabel>
                  <TextField
                    autoComplete="family-name"
                    name="lastName"
                    required
                    fullWidth
                    id="lastName"
                    placeholder="Snow"
                    error={lastNameError}
                    helperText={lastNameErrorMessage}
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
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
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                size="medium"
                error={emailError}
                helperText={emailErrorMessage}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password" sx={{ fontWeight: 600, mb: 0.5 }}>
                Password
              </FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="Create a password (min. 6 characters)"
                type="password"
                id="password"
                autoComplete="new-password"
                variant="outlined"
                size="medium"
                error={passwordError}
                helperText={passwordErrorMessage}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
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
                fontSize: '1rem',
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                underline="hover"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
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
