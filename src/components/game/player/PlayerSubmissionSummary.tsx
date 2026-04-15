import { Box, Typography } from "@mui/material";

interface PlayerSubmissionSummaryProps {
  submissionWasCorrect: boolean;
  points: number;
  rank: number | null;
  pointsBehind: number;
  leaderName?: string;
  explanation?: string;
}

const getRankOrdinal = (n: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = n % 100;
  return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
};

export default function PlayerSubmissionSummary({
  submissionWasCorrect,
  points,
  rank,
  pointsBehind,
  leaderName,
  explanation,
}: PlayerSubmissionSummaryProps) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: submissionWasCorrect ? 'success.main' : 'error.main',
        bgcolor: submissionWasCorrect ? 'success.light' : 'error.light',
        color: submissionWasCorrect ? 'success.contrastText' : 'error.contrastText',
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        {submissionWasCorrect ? '✅ You got it right!' : '❌ Incorrect'}
      </Typography>

      <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Current Points</Typography>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          {points}
        </Typography>
      </Box>

      <Box sx={{ mb: 1 }}>
        {rank && pointsBehind === 0 ? (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            🏆 You're in {getRankOrdinal(rank)} place!
          </Typography>
        ) : rank ? (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            You are {pointsBehind} {pointsBehind === 1 ? 'point' : 'points'} behind {leaderName}!
          </Typography>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Waiting for rank update...
          </Typography>
        )}
      </Box>

      <Typography variant="body2" sx={{ opacity: 0.9, mt: 2 }}>
        {submissionWasCorrect
          ? 'Great job! Keep this up.'
          : 'Review the correct answer on the host screen.'}
      </Typography>

      {explanation ? (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
            Explanation
          </Typography>
          <Typography variant="body2">{explanation}</Typography>
        </Box>
      ) : null}
    </Box>
  );
}