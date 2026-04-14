import { Box, Paper, Typography } from "@mui/material";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useState } from "react";

import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface RankingComponentProps {
  items: string[];
  disabled: boolean;
  onOrderChange: (orderedItems: string[]) => void;
}

export default function RankingComponent({ items, disabled, onOrderChange }: RankingComponentProps) {
  const [orderedItems, setOrderedItems] = useState<string[]>(items);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    setOrderedItems(items);
    onOrderChange(items);
  }, [items, onOrderChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.indexOf(String(active.id));
    const newIndex = orderedItems.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(next);
    onOrderChange(next);
  };

  if (!orderedItems.length) {
    return <Typography>No items to rank.</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle2">Drag and drop to rank items:</Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
          {orderedItems.map((item, idx) => (
            <SortableRankRow
              key={item}
              id={item}
              index={idx}
              text={item}
              disabled={disabled}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );
}

function SortableRankRow({
  id,
  index,
  text,
  disabled,
}: {
  id: string;
  index: number;
  text: string;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 220ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
        {index + 1}.
      </Typography>
      <Paper
        ref={setNodeRef}
        style={style}
        elevation={isDragging ? 8 : 1}
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 1,
          border: "1px solid",
          borderColor: isDragging ? "primary.main" : "divider",
          bgcolor: isDragging ? "action.hover" : "background.paper",
          cursor: disabled ? "default" : "grab",
          opacity: isDragging ? 0.85 : 1,
          transition: "box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
          userSelect: "none",
          touchAction: "none",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        {...attributes}
        {...listeners}
      >
        <Typography variant="body2">{text}</Typography>
        <DragIndicatorIcon fontSize="small" color="disabled" />
      </Paper>
    </Box>
  );
}
