import { Box, FormControlLabel, Slider, Switch, Typography } from '@mui/material';

import { GameSettings } from '../../stores/types';
import { useState } from 'react';

interface ManageGameSettingsProps {
  onSettingsChange: (gameSettings: GameSettings) => void;
}

export default function ManageGameSettings({ onSettingsChange }: ManageGameSettingsProps) {
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    questionTime: 30,
    enableMessagesDuringGame: true,
    showLeaderboard: true,
    shuffleQuestions: false,
  });

  const handleChange = (field: keyof GameSettings, value: number | boolean) => {
    const newSettings = { ...gameSettings, [field]: value };
    setGameSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Box sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Game Settings</Typography>
        <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>
            Question Time: {gameSettings.questionTime === 0 ? 'infinite seconds' : `${gameSettings.questionTime} seconds`}
        </Typography>
        <Slider
            value={gameSettings.questionTime}
            onChange={(_, value) => handleChange('questionTime', value as number)}
            min={0}
            max={120}
            step={5}
            marks={[
            { value: 0, label: '∞' },
            { value: 30, label: '30s' },
            { value: 60, label: '60s' },
            { value: 120, label: '120s' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => value === 0 ? '∞' : `${value}s`}
        />
        </Box>
      <FormControlLabel
        control={
          <Switch
            checked={gameSettings.enableMessagesDuringGame}
            onChange={(e) => handleChange('enableMessagesDuringGame', e.target.checked)}
          />
        }
        label="Show Messages During Game"
      />

      <FormControlLabel
        control={
          <Switch
            checked={gameSettings.showLeaderboard}
            onChange={(e) => handleChange('showLeaderboard', e.target.checked)}
          />
        }
        label="Show Leaderboard"
      />

      <FormControlLabel
        control={
          <Switch
            checked={gameSettings.shuffleQuestions}
            onChange={(e) => handleChange('shuffleQuestions', e.target.checked)}
          />
        }
        label="Shuffle Questions"
      />
    </Box>
  );
}