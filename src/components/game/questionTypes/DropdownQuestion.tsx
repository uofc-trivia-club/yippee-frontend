import { Box, Button, Grid, MenuItem, TextField } from "@mui/material";

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
  const hasManyOptions = options.length > 8;

  // For many options, use grid layout on desktop; dropdown on mobile
  if (hasManyOptions) {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Dropdown for mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
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
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Grid layout for desktop */}
        <Grid container spacing={1} sx={{ display: { xs: 'none', md: 'grid' } }}>
          {options.map((option, index) => (
            <Grid item xs={6} sm={4} md={3} key={`${option}-${index}`}>
              <Button
                fullWidth
                variant={selectedAnswers.includes(option) ? 'contained' : 'outlined'}
                onClick={() => onAnswerSelect([option])}
                disabled={disabled}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                {option}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Original dropdown for small option lists
  return (
    <Box sx={{ width: '100%' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}>
              {resolvedOptionImageUrls?.[index] ? (
                <img
                  src={resolvedOptionImageUrls[index]}
                  alt={`Option ${index + 1}`}
                  style={{ width: 72, height: 52, objectFit: "contain", borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff' }}
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
