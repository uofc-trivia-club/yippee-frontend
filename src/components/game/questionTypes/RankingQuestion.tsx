import RankingComponent from "../RankingComponent";

interface RankingQuestionProps {
  items: string[];
  optionImageUrls?: string[];
  disabled: boolean;
  onOrderChange: (ordered: string[]) => void;
}

export default function RankingQuestion({
  items,
  optionImageUrls,
  disabled,
  onOrderChange,
}: RankingQuestionProps) {
  return (
    <RankingComponent
      items={items}
      optionImageUrls={optionImageUrls}
      disabled={disabled}
      onOrderChange={onOrderChange}
    />
  );
}
