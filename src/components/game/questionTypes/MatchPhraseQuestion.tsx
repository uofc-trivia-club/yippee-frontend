import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";

import { CSS } from "@dnd-kit/utilities";

interface MatchPhraseQuestionProps {
  phrase: string;
  slots: string[];
  options: string[];
  disabled: boolean;
  onMatchesChange: (formattedMatches: string[]) => void;
  showCorrectAnswers?: boolean;
  correctAssign?: Record<string, string>;
}

type AssignmentMap = Record<string, string>;
type OptionEntry = { id: string; text: string };

function DraggableOption({ option, disabled, selected, onSelect }: { option: OptionEntry; disabled: boolean; selected?: boolean; onSelect?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: option.id,
    data: { optionId: option.id },
    disabled,
  });

  return (
    <Chip
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      label={option.text}
      color="primary"
      variant="outlined"
      onClick={disabled ? undefined : onSelect}
      sx={{
        cursor: disabled ? "default" : "grab",
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.55 : 1,
        fontWeight: 700,
        px: 0.5,
        touchAction: "none",
        borderColor: selected ? "primary.main" : undefined,
        bgcolor: selected ? "rgba(25, 118, 210, 0.08)" : undefined,
      }}
    />
  );
}

function BlankSlot({
  slotId,
  label,
  value,
  disabled,
  onClear,
}: {
  slotId: string;
  label: string;
  value?: string;
  disabled: boolean;
  onClear?: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: slotId, disabled });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        minWidth: 130,
        px: 1,
        py: 0.75,
        mx: 0.5,
        borderRadius: 2,
        border: "2px dashed",
        borderColor: isOver ? "primary.main" : "divider",
        bgcolor: isOver ? "rgba(25, 118, 210, 0.08)" : "background.paper",
        verticalAlign: "middle",
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
        {label}
      </Typography>
      {value ? (
        <Chip
          label={value}
          color="success"
          variant="filled"
          onDelete={disabled ? undefined : onClear}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      ) : (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
          Drop here
        </Typography>
      )}
    </Box>
  );
}

export default function MatchPhraseQuestion({
  phrase,
  slots,
  options,
  disabled,
  onMatchesChange,
  showCorrectAnswers = false,
  correctAssign,
}: MatchPhraseQuestionProps) {
  const phraseSegments = useMemo(() => phrase.split(/_{3,}/), [phrase]);
  const derivedSlotIds = useMemo(
    () => Array.from({ length: Math.max(0, phraseSegments.length - 1) }, (_, index) => slots[index] || `blank${index + 1}`),
    [phraseSegments.length, slots]
  );

  const optionEntries = useMemo<OptionEntry[]>(
    () => (Array.isArray(options) ? options : []).map((text, index) => ({ id: `opt-${index}`, text })),
    [options]
  );
  const optionMap = useMemo(() => Object.fromEntries(optionEntries.map((entry) => [entry.id, entry.text])), [optionEntries]);

  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  useEffect(() => {
    setAssignments({});
    setSelectedOptionId(null);
  }, [correctAssign, showCorrectAnswers, phrase]);

  useEffect(() => {
    if (showCorrectAnswers) return;

    const formattedMatches = derivedSlotIds
      .map((slotId) => {
        const optionId = assignments[slotId];
        const optionText = optionId ? optionMap[optionId] || '' : '';
        return optionText ? `${slotId}:${optionText}` : null;
      })
      .filter((entry): entry is string => Boolean(entry));

    onMatchesChange(formattedMatches);
  }, [assignments, derivedSlotIds, onMatchesChange, optionMap, showCorrectAnswers]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled || showCorrectAnswers) return;

    const optionId = event.active.data.current?.optionId as string | undefined;
    const slotId = event.over?.id as string | undefined;
    if (!optionId || !slotId) return;

    setAssignments((prev) => {
      const next: AssignmentMap = { ...prev };
      for (const existingSlotId of Object.keys(next)) {
        if (next[existingSlotId] === optionId) {
          delete next[existingSlotId];
        }
      }
      next[slotId] = optionId;
      return next;
    });
    setSelectedOptionId(null);
  };

  const assignSelectedOptionToSlot = (slotId: string) => {
    if (disabled || showCorrectAnswers || !selectedOptionId) return;
    setAssignments((prev) => {
      const next: AssignmentMap = { ...prev };
      for (const existingSlotId of Object.keys(next)) {
        if (next[existingSlotId] === selectedOptionId) {
          delete next[existingSlotId];
        }
      }
      next[slotId] = selectedOptionId;
      return next;
    });
    setSelectedOptionId(null);
  };

  const clearSlot = (slotId: string) => {
    if (disabled || showCorrectAnswers) return;
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  if (!phraseSegments.length) {
    return <Typography>No phrase available.</Typography>;
  }

  const revealedOptions = optionEntries.length > 0 ? optionEntries : [];
  const assignedOptionIds = new Set(Object.values(assignments));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Drag the words into the blanks.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          background: (theme) => theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.02)",
        }}
      >
        <Typography variant="body1" sx={{ lineHeight: 2.4 }}>
          {phraseSegments.map((segment, index) => {
            const slotId = derivedSlotIds[index];
            const slotLabel = `Blank ${index + 1}`;
            const slotValue = slotId
              ? (showCorrectAnswers
                  ? correctAssign?.[slotId]
                  : (assignments[slotId] ? optionMap[assignments[slotId]] : undefined))
              : undefined;

            return (
              <span key={`phrase-segment-${index}`}>
                {segment}
                {index < derivedSlotIds.length && slotId ? (
                  <Box
                    onClick={() => assignSelectedOptionToSlot(slotId)}
                    sx={{ display: 'inline-flex', alignItems: 'center', cursor: selectedOptionId && !disabled && !showCorrectAnswers ? 'pointer' : 'default' }}
                  >
                    <BlankSlot
                      slotId={slotId}
                      label={slotLabel}
                      value={slotValue}
                      disabled={disabled}
                      onClear={showCorrectAnswers ? undefined : () => clearSlot(slotId)}
                    />
                  </Box>
                ) : null}
              </span>
            );
          })}
        </Typography>
      </Paper>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
          {revealedOptions.filter((option) => !assignedOptionIds.has(option.id)).map((option) => (
            <DraggableOption
              key={option.id}
              option={option}
              disabled={disabled || showCorrectAnswers}
              selected={selectedOptionId === option.id}
              onSelect={() => setSelectedOptionId((prev) => (prev === option.id ? null : option.id))}
            />
          ))}
        </Stack>

        {showCorrectAnswers && correctAssign && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Correct assignments
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {Object.entries(correctAssign).map(([slotId, value]) => (
                <Chip key={slotId} label={`${slotId}: ${value}`} color="success" variant="outlined" />
              ))}
            </Stack>
          </Box>
        )}

      {!disabled && !showCorrectAnswers && (
        <Typography variant="caption" color="text.secondary">
          Drag each word onto a blank, or tap a word then tap a blank on mobile.
        </Typography>
      )}
      </Box>
    </DndContext>
  );
}
