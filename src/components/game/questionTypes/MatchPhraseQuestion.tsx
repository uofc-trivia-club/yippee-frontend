import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";

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

function DraggableOption({ option, index, disabled }: { option: string; index: number; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `option-${index}`,
    data: { option },
    disabled,
  });

  return (
    <Chip
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      label={option}
      color="primary"
      variant="outlined"
      sx={{
        cursor: disabled ? "default" : "grab",
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.55 : 1,
        fontWeight: 700,
        px: 0.5,
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

  const [assignments, setAssignments] = useState<AssignmentMap>(correctAssign || {});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    if (showCorrectAnswers && correctAssign) {
      setAssignments(correctAssign);
      return;
    }

    setAssignments({});
  }, [correctAssign, showCorrectAnswers, phrase]);

  useEffect(() => {
    if (showCorrectAnswers) return;

    const formattedMatches = Object.entries(assignments)
      .filter(([, value]) => Boolean(value))
      .map(([slotId, value]) => `${slotId}:${value}`);

    onMatchesChange(formattedMatches);
  }, [assignments, onMatchesChange, showCorrectAnswers]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled || showCorrectAnswers) return;

    const option = event.active.data.current?.option as string | undefined;
    const slotId = event.over?.id as string | undefined;
    if (!option || !slotId) return;

    setAssignments((prev) => {
      const next: AssignmentMap = { ...prev };
      for (const existingSlotId of Object.keys(next)) {
        if (next[existingSlotId] === option) {
          delete next[existingSlotId];
        }
      }
      next[slotId] = option;
      return next;
    });
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

  const currentAssignments = showCorrectAnswers && correctAssign ? correctAssign : assignments;
  const revealedOptions = options.length > 0 ? options : [];

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
            const slotValue = slotId ? currentAssignments[slotId] : undefined;

            return (
              <span key={`phrase-segment-${index}`}>
                {segment}
                {index < derivedSlotIds.length && slotId ? (
                  <BlankSlot
                    slotId={slotId}
                    label={slotLabel}
                    value={slotValue}
                    disabled={disabled}
                    onClear={showCorrectAnswers ? undefined : () => clearSlot(slotId)}
                  />
                ) : null}
              </span>
            );
          })}
        </Typography>
      </Paper>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
          {revealedOptions.map((option, index) => (
            <DraggableOption key={`${option}-${index}`} option={option} index={index} disabled={disabled || showCorrectAnswers} />
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
          Drag each word onto a blank. You can move words between blanks before submitting.
        </Typography>
      )}
      </Box>
    </DndContext>
  );
}
