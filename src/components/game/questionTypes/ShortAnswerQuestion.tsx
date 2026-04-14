import { Box, TextField } from "@mui/material";

interface ShortAnswerQuestionProps {
  textAnswer: string;
  onAnswerChange: (text: string) => void;
  disabled: boolean;
  isMultiline?: boolean;
  minRows?: number;
  label?: string;
  inputType?: "text" | "number";
}

export default function ShortAnswerQuestion({
  textAnswer,
  onAnswerChange,
  disabled,
  isMultiline = false,
  minRows = 1,
  label = "Your Answer",
  inputType = "text",
}: ShortAnswerQuestionProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label={label}
        variant="outlined"
        value={textAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
        type={inputType}
        multiline={isMultiline}
        minRows={isMultiline ? minRows : undefined}
      />
    </Box>
  );
}
