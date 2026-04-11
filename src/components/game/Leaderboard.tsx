// leaderboard

import { Avatar, Box, Paper, Stack, Typography, useTheme } from '@mui/material';

import { RootState } from '../../stores/store';
import { User } from '../../stores/types';
import { useSelector } from 'react-redux';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorForRank = (index: number) => {
  if (index === 0) return '#FFD700'; // Gold
  if (index === 1) return '#C0C0C0'; // Silver
  if (index === 2) return '#CD7F32'; // Bronze
  return '#9E9E9E'; // Gray
};

export default function Leaderboard() {
    const game = useSelector((state: RootState) => state.game);
    const theme = useTheme();

    // sort users by points in descending order
    const sortedUsers = Object.values(game.clientsInLobby)
        .filter((user): user is User => 
            user !== null && 
            typeof user === 'object' && 
            'userRole' in user && 
            user.userRole === 'player'
        )
        .sort((a, b) => b.points - a.points);
    
    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 800, mb: 3 }}>
                {game.finalQuestionLeaderboard ? 'Final Results! 🎉' : 'Leaderboard'}
            </Typography>
        
            <Stack spacing={2} sx={{ maxWidth: 800, margin: '0 auto' }}>
                {sortedUsers.map((user, index) => {
                    const isCurrentUser = user.userName === game.user.userName;
                    const rankColor = getColorForRank(index);
                    const medalEmojis = ['🥇', '🥈', '🥉'];
                    
                    return (
                        <Paper
                            key={user.userName}
                            elevation={index === 0 ? 8 : 2}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2.5,
                                p: 2.5,
                                borderRadius: 3,
                                background: index === 0 
                                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.1))'
                                    : theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    boxShadow: `0 8px 24px ${rankColor}40`,
                                    transform: 'translateY(-2px)',
                                }
                            }}
                        >
                            {/* Rank Medal */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                bgcolor: rankColor,
                                color: 'white',
                                fontWeight: 900,
                                fontSize: '1.5rem',
                            }}>
                                {index < 3 ? medalEmojis[index] : `#${index + 1}`}
                            </Box>
                            
                            {/* Player Avatar */}
                            <Avatar
                                sx={{
                                    width: 60,
                                    height: 60,
                                    bgcolor: theme.palette.primary.main,
                                    fontWeight: 700,
                                    fontSize: '1.2rem',
                                    border: `3px solid ${rankColor}`,
                                }}
                            >
                                {getInitials(user.userName)}
                            </Avatar>
                            
                            {/* Player Info */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {user.userName}
                                    {isCurrentUser && (
                                        <Typography component="span" sx={{ ml: 1, fontSize: '0.9rem', color: 'text.secondary' }}>
                                            (You)
                                        </Typography>
                                    )}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user.userRole === 'host' ? 'Host' : 'Player'}
                                </Typography>
                            </Box>
                            
                            {/* Points */}
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: rankColor }}>
                                    {user.points}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    points
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}