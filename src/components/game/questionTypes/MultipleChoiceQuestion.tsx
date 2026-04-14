import { Box, Button } from "@mui/material";

interface MultipleChoiceQuestionProps {
  options: string[];
  optionImageUrls?: string[];
  selectedAnswers: string[];
  onAnswerSelect: (option: string) => void;
  disabled: boolean;
}

export default function MultipleChoiceQuestion({
  options,
  optionImageUrls,
  selectedAnswers,
  onAnswerSelect,
  disabled,
}: MultipleChoiceQuestionProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {options.map((option, index) => (
        <Button
          key={option}
          onClick={() => onAnswerSelect(option)}
          variant={selectedAnswers.includes(option) ? "contained" : "outlined"}
          sx={{ m: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', gap: 0.75 }}
          disabled={disabled}
        >
          {optionImageUrls?.[index] ? (
            <img
              src={optionImageUrls[index]}
              alt={`Option ${index + 1}`}
              style={{ width: 84, height: 56, objectFit: "cover", borderRadius: 6 }}
            />
          ) : null}
          {option}
        </Button>
      ))}
    </Box>
  );
}
