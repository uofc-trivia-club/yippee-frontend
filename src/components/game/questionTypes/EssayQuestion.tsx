import { Box, TextField, Typography } from "@mui/material";

interface EssayQuestionProps {
  textAnswer: string;
  onAnswerChange: (text: string) => void;
  disabled: boolean;
}

export default function EssayQuestion({
  textAnswer,
  onAnswerChange,
  disabled,
}: EssayQuestionProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography fontStyle="italic" color="text.secondary">
        Essay question. Answers will be reviewed manually.
      </Typography>
      <TextField
        label="Your Response"
        variant="outlined"
        multiline
        minRows={4}
        value={textAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
      />
    </Box>
  );
}
