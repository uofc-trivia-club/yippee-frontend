import { Box, TextField } from "@mui/material";
import { resolveMediaUrl } from "../../../util/mediaUrl";

interface ImageBasedQuestionProps {
  imageUrl: string | undefined;
  textAnswer: string;
  onAnswerChange: (text: string) => void;
  disabled: boolean;
}

export default function ImageBasedQuestion({
  imageUrl,
  textAnswer,
  onAnswerChange,
  disabled,
}: ImageBasedQuestionProps) {
  const resolvedImageUrl = resolveMediaUrl(imageUrl);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {resolvedImageUrl && (
        <img
          src={resolvedImageUrl}
          alt="Question"
          style={{ maxWidth: 300, marginBottom: 8 }}
        />
      )}
      <TextField
        label="Your Answer"
        variant="outlined"
        value={textAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
      />
    </Box>
  );
}
