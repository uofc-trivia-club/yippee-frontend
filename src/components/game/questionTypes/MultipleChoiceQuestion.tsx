import { Box, Button } from "@mui/material";

import { resolveMediaUrl } from "../../../util/mediaUrl";

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
  // Ensure optionImageUrls is an array before mapping
  const normalizedImageUrls = Array.isArray(optionImageUrls) ? optionImageUrls : [];
  const resolvedOptionImageUrls = normalizedImageUrls.map((url) => resolveMediaUrl(url));
  const normalizedOptions = Array.isArray(options) ? options : [];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(200px, 1fr))' }, gap: { xs: 1, md: 1.25 } }}>
      {normalizedOptions.map((option, index) => (
        <Button
          key={option}
          onClick={() => onAnswerSelect(option)}
          variant={selectedAnswers.includes(option) ? "contained" : "outlined"}
          sx={{ 
            width: '100%', 
            minHeight: { xs: 70, md: 96 }, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            gap: 1, 
            p: { xs: 1, md: 1.25 },
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
          disabled={disabled}
        >
          {resolvedOptionImageUrls?.[index] ? (
            <Box
              component="img"
              src={resolvedOptionImageUrls[index]}
              alt={`Option ${index + 1}`}
              sx={{ width: '100%', maxWidth: 280, height: { xs: 150, sm: 180 }, objectFit: 'contain', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
            />
          ) : null}
          {option}
        </Button>
      ))}
    </Box>
  );
}
