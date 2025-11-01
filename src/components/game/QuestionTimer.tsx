import { useEffect, useRef, useState } from "react";

import { Typography } from "@mui/material";

interface QuestionTimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export default function QuestionTimer({ duration, onTimeUp, isActive }: QuestionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setTimeRemaining(duration);

    if (duration > 0 && isActive) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        onTimeUp();
      }, duration * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [duration, isActive, onTimeUp]);

  if (!isActive || duration <= 0) return null;

  return (
    <Typography 
      variant="h6" 
      sx={{ 
        color: timeRemaining && timeRemaining <= 10 ? 'error.main' : 'text.primary',
        animation: timeRemaining && timeRemaining <= 10 ? 'pulse 1s infinite' : 'none',
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.5 },
          '100%': { opacity: 1 },
        },
        marginY: 2,
        textAlign: 'center'
      }}
    >
      Time Remaining: {timeRemaining ?? duration} seconds
    </Typography>
  );
}