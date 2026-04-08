import MatchingComponent from "../MatchingComponent";
import { Typography } from "@mui/material";

interface MatchPhraseQuestionProps {
  pairs: Record<string, string>;
  disabled: boolean;
  onMatchesChange: (formattedMatches: string[]) => void;
}

export default function MatchPhraseQuestion({
  pairs,
  disabled,
  onMatchesChange,
}: MatchPhraseQuestionProps) {
  if (Object.keys(pairs).length === 0) {
    return <Typography>No pairs to display.</Typography>;
  }

  const leftItems = Object.keys(pairs);
  const rightItems = Object.values(pairs);

  return (
    <MatchingComponent
      leftItems={leftItems}
      rightItems={rightItems}
      disabled={disabled}
      onMatchesChange={(matches) => {
        const formattedMatches = Object.entries(matches).map(
          ([term, def]) => `${term}:${def}`
        );
        onMatchesChange(formattedMatches);
      }}
    />
  );
}
