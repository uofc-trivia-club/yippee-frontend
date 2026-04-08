import MatchingComponent from "../MatchingComponent";
import { Typography } from "@mui/material";

interface MatchingQuestionProps {
  leftItems: string[];
  rightItems: string[];
  disabled: boolean;
  onMatchesChange: (formattedMatches: string[]) => void;
}

export default function MatchingQuestion({
  leftItems,
  rightItems,
  disabled,
  onMatchesChange,
}: MatchingQuestionProps) {
  if (!leftItems.length || !rightItems.length) {
    return <Typography>No pairs to display.</Typography>;
  }

  return (
    <MatchingComponent
      leftItems={leftItems}
      rightItems={rightItems}
      disabled={disabled}
      onMatchesChange={(matches) => {
        const formattedMatches = Object.entries(matches).map(
          ([l, r]) => `${l}:${r}`
        );
        onMatchesChange(formattedMatches);
      }}
    />
  );
}
