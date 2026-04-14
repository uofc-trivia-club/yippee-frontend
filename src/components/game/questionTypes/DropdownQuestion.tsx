import { Box, MenuItem, TextField } from "@mui/material";
import { resolveMediaUrl } from "../../../util/mediaUrl";

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
  const resolvedOptionImageUrls = (optionImageUrls || []).map((url) => resolveMediaUrl(url));

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
              {resolvedOptionImageUrls?.[index] ? (
                <img
                  src={resolvedOptionImageUrls[index]}
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
