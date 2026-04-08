import RankingComponent from "../RankingComponent";

interface RankingQuestionProps {
  items: string[];
  disabled: boolean;
  onOrderChange: (ordered: string[]) => void;
}

export default function RankingQuestion({
  items,
  disabled,
  onOrderChange,
}: RankingQuestionProps) {
  return (
    <RankingComponent
      items={items}
      disabled={disabled}
      onOrderChange={onOrderChange}
    />
  );
}
