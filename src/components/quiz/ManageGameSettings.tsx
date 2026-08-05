import {
  Box,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Typography,
  useTheme,
} from "@mui/material";

import { GameSettings } from "../../stores/types";
import { useState } from "react";

interface ManageGameSettingsProps {
  onSettingsChange: (gameSettings: GameSettings) => void;
}

export default function ManageGameSettings({
  onSettingsChange,
}: ManageGameSettingsProps) {
  const theme = useTheme();
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
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.02)",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
        Game Settings
      </Typography>
      <Box sx={{ mb: 1.5 }}>
        <Typography gutterBottom>
          Time Per Question:{" "}
          {gameSettings.questionTime === 0
            ? "Infinite"
            : `${gameSettings.questionTime} seconds`}
        </Typography>
        <Slider
          value={gameSettings.questionTime}
          onChange={(_, value) => handleChange("questionTime", value as number)}
          min={0}
          max={120}
          step={5}
          marks={[
            { value: 0, label: "∞" },
            { value: 30, label: "30s" },
            { value: 60, label: "60s" },
            { value: 120, label: "120s" },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => (value === 0 ? "∞" : `${value}s`)}
        />
      </Box>
      <Stack>
        <FormControlLabel
          control={
            <Switch
              checked={gameSettings.enableMessagesDuringGame}
              onChange={(e) =>
                handleChange("enableMessagesDuringGame", e.target.checked)
              }
            />
          }
          label="Messages During Game"
        />

        <FormControlLabel
          control={
            <Switch
              checked={gameSettings.showLeaderboard}
              onChange={(e) => handleChange("showLeaderboard", e.target.checked)}
            />
          }
          label="Show Leaderboard"
        />

        <FormControlLabel
          control={
            <Switch
              checked={gameSettings.shuffleQuestions}
              onChange={(e) => handleChange("shuffleQuestions", e.target.checked)}
            />
          }
          label="Shuffle Questions"
        />
      </Stack>
    </Box>
  );
}
