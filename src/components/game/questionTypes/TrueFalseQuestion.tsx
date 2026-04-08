import { Box, Button } from "@mui/material";

interface TrueFalseQuestionProps {
  selectedAnswers: string[];
  onAnswerSelect: (option: string) => void;
  disabled: boolean;
}

export default function TrueFalseQuestion({
  selectedAnswers,
  onAnswerSelect,
  disabled,
}: TrueFalseQuestionProps) {
  const options = ["True", "False"];

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {options.map((option) => (
        <Button
          key={option}
          onClick={() => onAnswerSelect(option)}
          variant={selectedAnswers.includes(option) ? "contained" : "outlined"}
          sx={{ m: 1, minWidth: '120px' }}
          disabled={disabled}
        >
          {option}
        </Button>
      ))}
    </Box>
  );
}
