import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { supabase } from '../util/supabase';
import type { User } from '@supabase/supabase-js';

export default function Profile() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', gap: 2 }}>
        <Typography variant="h6" color="text.secondary">Not signed in</Typography>
        <Button variant="contained" onClick={() => navigate('/sign-in')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          Sign in
        </Button>
      </Box>
    );
  }

  const isUcalgary = theme.palette.primary.main === '#d6001c';
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';
  const email = user.email ?? 'No email';
  const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? '';
  const provider = user.app_metadata?.provider ?? 'email';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', px: 2, py: 4 }}>
      <Card
        elevation={8}
        sx={{ width: '100%', maxWidth: 460, borderRadius: 3, overflow: 'hidden', position: 'relative' }}
      >
        <Box sx={{
          height: 6,
          background: isUcalgary
            ? 'linear-gradient(90deg, #d6001c 0%, #ffcd00 50%, #ff671f 100%)'
            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }} />
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme.palette.primary.main,
              fontSize: '2rem',
              fontWeight: 700,
              mb: 1,
            }}
          >
            {email.charAt(0).toUpperCase()}
          </Avatar>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {name || 'User'}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>

          <Divider sx={{ width: '100%', my: 1 }} />

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Provider</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{provider}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Joined</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{createdAt}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">User ID</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.id}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              py: 1.2,
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              '&:hover': { borderColor: theme.palette.error.dark, bgcolor: 'rgba(244,67,54,0.04)' },
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
