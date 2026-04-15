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
import { useEffect, useRef, useState } from "react";

import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { resolveMediaUrl } from "../../../util/mediaUrl";

interface RankingQuestionProps {
  items: string[];
  optionImageUrls?: string[];
  disabled: boolean;
  onOrderChange: (ordered: string[]) => void;
}

type RankedItem = { id: string; text: string; imageUrl?: string };

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const createSeededRng = (seed: number) => {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const deterministicShuffle = <T,>(items: T[], seedSource: string): T[] => {
  const next = [...items];
  const rand = createSeededRng(hashString(seedSource));
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export default function RankingQuestion({
  items,
  optionImageUrls,
  disabled,
  onOrderChange,
}: RankingQuestionProps) {
  const shuffleSeed = `${items.join('\u0001')}::${(optionImageUrls || []).join('\u0001')}`;
  const [orderedItems, setOrderedItems] = useState<RankedItem[]>(() => {
    const initial = items.map((text, index) => ({ id: `${index}-${text}`, text, imageUrl: resolveMediaUrl(optionImageUrls?.[index]) }));
    return deterministicShuffle(initial, shuffleSeed);
  });
  const onOrderChangeRef = useRef(onOrderChange);
  const itemsRef = useRef(items);
  const optionImageUrlsRef = useRef(optionImageUrls);
  const itemsSignature = items.join('\u0001');
  const imageUrlsSignature = (optionImageUrls || []).join('\u0001');

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
    onOrderChangeRef.current = onOrderChange;
  }, [onOrderChange]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    optionImageUrlsRef.current = optionImageUrls;
  }, [optionImageUrls]);

  useEffect(() => {
    const nextItems = itemsRef.current.map((text, index) => ({
      id: `${index}-${text}`,
      text,
      imageUrl: resolveMediaUrl(optionImageUrlsRef.current?.[index]),
    }));

    const shuffled = deterministicShuffle(nextItems, shuffleSeed);

    setOrderedItems(shuffled);
    onOrderChangeRef.current(shuffled.map((item: RankedItem) => item.text));
  }, [itemsSignature, imageUrlsSignature, shuffleSeed]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((item) => item.id === String(active.id));
    const newIndex = orderedItems.findIndex((item) => item.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(next);
    onOrderChangeRef.current(next.map((item: RankedItem) => item.text));
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
              key={item.id}
              id={item.id}
              index={idx}
              text={item.text}
              imageUrl={item.imageUrl}
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
  imageUrl,
  disabled,
}: {
  id: string;
  index: number;
  text: string;
  imageUrl?: string;
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={text}
              sx={{ width: { xs: 72, md: 96 }, height: { xs: 52, md: 68 }, objectFit: "contain", borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", flexShrink: 0 }}
            />
          ) : null}
          <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {text}
          </Typography>
        </Box>
        <DragIndicatorIcon fontSize="small" color="disabled" />
      </Paper>
    </Box>
  );
}
