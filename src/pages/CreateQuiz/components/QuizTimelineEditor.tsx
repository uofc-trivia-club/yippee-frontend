import { Box, Button, Card, CardContent, Chip, Typography, useTheme } from "@mui/material";
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { TimelinePreviewItem } from "../createQuizTypes";

interface QuizTimelineEditorProps {
  timelinePreviewItems: TimelinePreviewItem[];
  selectedTimelineId: string | null;
  expandedQuestions: Set<string>;
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  onSelectItem: (item: TimelinePreviewItem) => void;
  onExpandQuestion: (questionId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onDeleteSlide: (slideId: string) => void;
  renderSlideCard: (item: Extract<TimelinePreviewItem, { kind: 'slide' }>, listIndex: number) => React.ReactNode;
  renderQuestionCard: (item: Extract<TimelinePreviewItem, { kind: 'question' }>) => React.ReactNode;
}

export default function QuizTimelineEditor({
  timelinePreviewItems,
  selectedTimelineId,
  sensors,
  onDragEnd,
  onSelectItem,
  onExpandQuestion,
  onExpandAll,
  onCollapseAll,
  renderSlideCard,
  renderQuestionCard,
}: QuizTimelineEditorProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '260px minmax(0, 1fr)' }, gap: 2, mb: 3 }}>
      <Card
        sx={{
          height: 'fit-content',
          position: { lg: 'sticky' },
          top: { lg: 12 },
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa',
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.25 }}>
            Sequence Preview
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
            Click an item to jump and edit.
          </Typography>
          <Box sx={{ display: 'grid', gap: 1, maxHeight: 560, overflowY: 'auto', pr: 0.5 }}>
            {timelinePreviewItems.map((item) => (
              <Box
                key={item.timelineId}
                onClick={() => onSelectItem(item)}
                sx={{
                  border: '1px solid',
                  borderColor: selectedTimelineId === item.timelineId
                    ? (item.kind === 'slide' ? 'info.main' : 'secondary.main')
                    : 'divider',
                  borderRadius: 1.5,
                  p: 1,
                  cursor: 'pointer',
                  bgcolor: selectedTimelineId === item.timelineId
                    ? (item.kind === 'slide' ? 'rgba(3,169,244,0.10)' : 'rgba(255,107,149,0.10)')
                    : 'transparent',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  #{item.timelineIndex + 1} • {item.kind === 'slide' ? `Slide ${item.slideIndex + 1}` : `Question ${item.questionIndex + 1}`}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.kind === 'slide'
                    ? (item.slide.title || item.slide.content || 'Untitled slide')
                    : (item.question.question || 'Untitled question')}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa',
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6" fontWeight="700">Unified Timeline</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button size="small" onClick={onExpandAll}>Expand All</Button>
              <Button size="small" onClick={onCollapseAll}>Collapse All</Button>
              <Chip size="small" color="secondary" label={`${timelinePreviewItems.length} items`} />
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Slides and questions live in one sequence. Drag to reorder.
          </Typography>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={timelinePreviewItems.map((item) => item.timelineId)} strategy={verticalListSortingStrategy}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                {timelinePreviewItems.map((item, listIndex) => (
                  item.kind === 'slide'
                    ? renderSlideCard(item, listIndex)
                    : renderQuestionCard(item)
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </Box>
  );
}