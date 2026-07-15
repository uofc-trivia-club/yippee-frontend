import React from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelinePreviewItem } from "../createQuizTypes";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import QuizIcon from "@mui/icons-material/Quiz";

interface QuizEditorLayoutProps {
  timelinePreviewItems: TimelinePreviewItem[];
  selectedTimelineId: string | null;
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  onSelectItem: (item: TimelinePreviewItem) => void;
  onDeleteSlide: (slideId: string) => void;
  onAddSlide: () => void;
  onAddQuestion: () => void;
  renderSlideEditor: (
    item: Extract<TimelinePreviewItem, { kind: "slide" }>,
  ) => React.ReactNode;
  renderQuestionEditor: (
    item: Extract<TimelinePreviewItem, { kind: "question" }>,
  ) => React.ReactNode;
}

function SidebarItem({
  item,
  isSelected,
  onSelect,
  onDelete,
}: {
  item: TimelinePreviewItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (slideId: string) => void;
}) {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.timelineId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        py: 0.6,
        px: 0.75,
        borderRadius: 1,
        cursor: "pointer",
        borderLeft: "3px solid",
        borderLeftColor: isSelected
          ? item.kind === "slide"
            ? "info.main"
            : "secondary.main"
          : "transparent",
        bgcolor: isSelected
          ? item.kind === "slide"
            ? "rgba(3,169,244,0.08)"
            : "rgba(255,107,149,0.08)"
          : "transparent",
        "&:hover": {
          bgcolor: isSelected
            ? item.kind === "slide"
              ? "rgba(3,169,244,0.12)"
              : "rgba(255,107,149,0.12)"
            : theme.palette.action.hover,
        },
        transition: "all 0.15s ease",
      }}
    >
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        sx={{
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          color: theme.palette.text.secondary,
          p: 0.25,
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      {item.kind === "slide" ? (
        <SlideshowIcon fontSize="small" color="info" sx={{ flexShrink: 0 }} />
      ) : (
        <QuizIcon fontSize="small" color="secondary" sx={{ flexShrink: 0 }} />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, display: "block", lineHeight: 1.2 }}
        >
          {item.kind === "slide"
            ? `Slide ${item.slideIndex + 1}`
            : `Q${item.questionIndex + 1}`}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}
        >
          {item.kind === "slide"
            ? item.slide.title || item.slide.content || "Untitled"
            : item.question.question || "Untitled question"}
        </Typography>
      </Box>

      {item.kind === "slide" && onDelete && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.slide.id);
          }}
          sx={{ color: theme.palette.error.main, p: 0.25, flexShrink: 0 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

export default function QuizEditorLayout({
  timelinePreviewItems,
  selectedTimelineId,
  sensors,
  onDragEnd,
  onSelectItem,
  onDeleteSlide,
  onAddSlide,
  onAddQuestion,
  renderSlideEditor,
  renderQuestionEditor,
}: QuizEditorLayoutProps) {
  const theme = useTheme();

  const selectedItem = timelinePreviewItems.find(
    (item) => item.timelineId === selectedTimelineId,
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "240px minmax(0, 1fr)" },
        gap: 2,
        mb: 3,
      }}
    >
      {/* Sidebar */}
      <Card
        sx={{
          height: "fit-content",
          position: { lg: "sticky" },
          top: { lg: 12 },
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : "#fafafa",
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Quiz Items
            </Typography>
            <Chip
              label={timelinePreviewItems.length}
              size="small"
              sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
            />
          </Box>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={timelinePreviewItems.map((item) => item.timelineId)}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ display: "grid", gap: 0.75, mb: 1.5 }}>
                {timelinePreviewItems.map((item) => (
                  <SidebarItem
                    key={item.timelineId}
                    item={item}
                    isSelected={selectedTimelineId === item.timelineId}
                    onSelect={() => onSelectItem(item)}
                    onDelete={onDeleteSlide}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>

          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Button
              size="small"
              variant="contained"
              color="info"
              onClick={onAddSlide}
              startIcon={<AddIcon />}
              fullWidth
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Slide
            </Button>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={onAddQuestion}
              startIcon={<AddIcon />}
              fullWidth
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Question
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Editor Area */}
      <Card
        sx={{
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : "#fafafa",
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
          minHeight: 400,
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {selectedItem ? (
            selectedItem.kind === "slide" ? (
              renderSlideEditor(selectedItem)
            ) : (
              <DndContext sensors={[]} collisionDetection={closestCenter}>
                <SortableContext
                  items={[selectedItem.timelineId]}
                  strategy={verticalListSortingStrategy}
                >
                  {renderQuestionEditor(selectedItem)}
                </SortableContext>
              </DndContext>
            )
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                color: theme.palette.text.secondary,
                gap: 1,
              }}
            >
              <SlideshowIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom sx={{ opacity: 0.6 }}>
                Select an item to edit
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.5 }}>
                Choose a slide or question from the sidebar.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
