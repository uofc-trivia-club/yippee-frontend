import { Box, MenuItem, TextField } from "@mui/material";

interface DropdownQuestionProps {
  options: string[];
  selectedAnswers: string[];
  onAnswerSelect: (answers: string[]) => void;
  disabled: boolean;
}

export default function DropdownQuestion({
  options,
  selectedAnswers,
  onAnswerSelect,
  disabled,
}: DropdownQuestionProps) {
  return (
    <Box sx={{ maxWidth: 420 }}>
      <TextField
        select
        fullWidth
        label="Choose an answer"
        value={selectedAnswers[0] || ''}
        onChange={(e) => {
          const value = e.target.value;
          onAnswerSelect(value ? [value] : []);
        }}
        disabled={disabled}
      >
        <MenuItem value="">
          <em>Select...</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
