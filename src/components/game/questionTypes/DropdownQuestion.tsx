import { Box, MenuItem, TextField } from "@mui/material";

interface DropdownQuestionProps {
  options: string[];
  optionImageUrls?: string[];
  selectedAnswers: string[];
  onAnswerSelect: (answers: string[]) => void;
  disabled: boolean;
}

export default function DropdownQuestion({
  options,
  optionImageUrls,
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
        {options.map((option, index) => (
          <MenuItem key={`${option}-${index}`} value={option}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {optionImageUrls?.[index] ? (
                <img
                  src={optionImageUrls[index]}
                  alt={`Option ${index + 1}`}
                  style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4 }}
                />
              ) : null}
              <span>{option}</span>
            </Box>
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
