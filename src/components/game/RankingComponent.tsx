import { Box, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface RankingComponentProps {
  items: string[];
  disabled: boolean;
  onOrderChange: (orderedItems: string[]) => void;
}

export default function RankingComponent({ items, disabled, onOrderChange }: RankingComponentProps) {
  const [orderedItems, setOrderedItems] = useState<string[]>(items);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setOrderedItems(items);
    onOrderChange(items);
  }, [items]);

  const handleDragStart = (event: React.DragEvent, index: number) => {
    if (disabled) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    if (disabled) return;
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (disabled || dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Swap positions to match expected replace behavior.
    const next = [...orderedItems];
    [next[dragIndex], next[index]] = [next[index], next[dragIndex]];

    setOrderedItems(next);
    onOrderChange(next);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (!orderedItems.length) {
    return <Typography>No items to rank.</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle2">Drag and drop to rank items:</Typography>
      {orderedItems.map((item, idx) => (
        <Box key={`${item}-${idx}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              width: 24,
              textAlign: "right",
              color: "text.secondary",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {idx + 1}.
          </Typography>
          <Paper
            draggable={!disabled}
            onDragStart={(event) => handleDragStart(event, idx)}
            onDragOver={(event) => handleDragOver(event, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            elevation={dragIndex === idx ? 6 : 1}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 1,
              border: "1px solid",
              borderColor: dragOverIndex === idx ? "primary.main" : "divider",
              bgcolor: dragIndex === idx ? "action.hover" : "background.paper",
              cursor: disabled ? "default" : "grab",
              opacity: dragIndex === idx ? 0.75 : 1,
              transition: "all 0.15s ease",
              userSelect: "none",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2">{item}</Typography>
            <DragIndicatorIcon fontSize="small" color="disabled" />
          </Paper>
        </Box>
      ))}
    </Box>
  );
}
