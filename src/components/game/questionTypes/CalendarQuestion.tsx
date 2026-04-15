import { Box, Button, TextField, Typography, Chip, Paper, Stack } from "@mui/material";
import { useState, useEffect } from "react";

interface CalendarQuestionProps {
  question: string;
  correctAnswers: string[];
  disabled: boolean;
  onAnswer: (answer: string[]) => void;
  showCorrectAnswers?: boolean;
}

export default function CalendarQuestion({
  question,
  correctAnswers,
  disabled,
  onAnswer,
  showCorrectAnswers = false,
}: CalendarQuestionProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    onAnswer(selectedDates);
  }, [selectedDates, onAnswer]);

  const addDate = () => {
    if (!dateInput.trim()) return;
    
    // Validate ISO 8601 format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return;
    }

    if (!selectedDates.includes(dateInput)) {
      setSelectedDates([...selectedDates, dateInput]);
      setDateInput("");
    }
  };

  const removeDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter((date) => date !== dateToRemove));
  };

  const isDateCorrect = (date: string) => correctAnswers.includes(date);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        Select the correct date(s) in YYYY-MM-DD format.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }}
      >
        <TextField
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          disabled={disabled || showCorrectAnswers}
          size="small"
          sx={{ mb: 1, width: { xs: "100%", sm: "auto" } }}
          InputLabelProps={{ shrink: true }}
        />
        <Button
          onClick={addDate}
          disabled={disabled || showCorrectAnswers || !dateInput}
          variant="contained"
          size="small"
          sx={{ ml: { xs: 0, sm: 1 }, mt: { xs: 1, sm: 0 } }}
        >
          Add Date
        </Button>
      </Paper>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        {selectedDates.map((date) => (
          <Chip
            key={date}
            label={date}
            onDelete={disabled || showCorrectAnswers ? undefined : () => removeDate(date)}
            color={
              showCorrectAnswers
                ? isDateCorrect(date)
                  ? "success"
                  : "error"
                : "primary"
            }
            variant={showCorrectAnswers ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
            }}
          />
        ))}
      </Stack>

      {showCorrectAnswers && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Correct date(s):
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {correctAnswers.map((date) => (
              <Chip
                key={date}
                label={date}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {!disabled && !showCorrectAnswers && (
        <Typography variant="caption" color="text.secondary">
          You can select multiple dates by adding them one at a time.
        </Typography>
      )}
    </Box>
  );
}
