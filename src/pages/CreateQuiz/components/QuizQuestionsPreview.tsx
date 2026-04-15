import { Box, Card, CardContent, Chip, Typography, useTheme } from "@mui/material";

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { QuizQuestionForm } from "../createQuizTypes";

interface QuizQuestionsPreviewProps {
  questions: QuizQuestionForm[];
  getDifficultyLabel: (difficulty: number) => string;
  getDifficultyColor: (difficulty: number) => string;
  getMatchingPreviewImageSrc: (file: File | null, url?: string) => string;
}

export default function QuizQuestionsPreview({
  questions,
  getDifficultyLabel,
  getDifficultyColor,
  getMatchingPreviewImageSrc,
}: QuizQuestionsPreviewProps) {
  const theme = useTheme();

  if (questions.length === 0) return null;

  return (
    <>
      {questions.map((q, qIndex) => (
        <Card
          key={q.id}
          sx={{
            mb: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {qIndex + 1}. {q.question}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                <Chip
                  label={`${q.points} pts`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={getDifficultyLabel(q.difficulty)}
                  size="small"
                  sx={{
                    bgcolor: getDifficultyColor(q.difficulty),
                    color: '#fff',
                  }}
                />
              </Box>
            </Box>

            {q.hint && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                💡 Hint: {q.hint}
              </Typography>
            )}

            {q.category.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {q.category.map((cat, idx) => (
                  <Chip
                    key={idx}
                    label={cat}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}

            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
              {q.type === 'short_answer' || q.type === 'fill_in_blank'
                ? 'Accepted Answers:'
                : q.type === 'calendar'
                  ? 'Correct Date(s):'
                : q.type === 'numerical'
                  ? 'Correct Number:'
                : q.type === 'match_the_phrase'
                  ? 'Phrase Match:'
                : 'Answer Options:'}
            </Typography>

            {(q.type === 'short_answer' || q.type === 'fill_in_blank' || q.type === 'calendar') ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {q.acceptedAnswers.length > 0 ? q.acceptedAnswers.map((ans, ansIdx) => (
                  <Chip
                    key={`${ans}-${ansIdx}`}
                    icon={<CheckCircleIcon />}
                    label={ans}
                    color="success"
                    variant="outlined"
                  />
                )) : (
                  <Typography variant="body2" color="text.secondary">(No answer set)</Typography>
                )}
              </Box>
            ) : q.type === 'match_the_phrase' ? (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}>
                  <Typography variant="body2" sx={{ lineHeight: 2 }}>
                    {q.question.split(/_{3,}/).map((segment, segmentIndex, segmentArray) => (
                      <span key={`preview-segment-${segmentIndex}`}>
                        {segment}
                        {segmentIndex < segmentArray.length - 1 && (
                          <Chip
                            label={q.acceptedAnswers[segmentIndex] || `blank ${segmentIndex + 1}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{ mx: 0.5, height: 24 }}
                          />
                        )}
                      </span>
                    ))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {q.options.map((option, idx) => (
                    <Chip key={`bank-${idx}`} label={option.text} variant="outlined" />
                  ))}
                </Box>
              </Box>
            ) : q.type === 'matching' ? (
              <Box sx={{ display: 'grid', gap: 1.25 }}>
                {q.matchingPairs.map((pair, pairIdx) => (
                  <Box
                    key={`preview-match-${pairIdx}`}
                    sx={{
                      p: 1.25,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1.5,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                      {(pair.leftImageFile || pair.leftImageUrl) ? (
                        <Box
                          component="img"
                          src={getMatchingPreviewImageSrc(pair.leftImageFile, pair.leftImageUrl)}
                          alt={`Matching left ${pairIdx + 1}`}
                          sx={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                        />
                      ) : null}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {pair.left || `Left item ${pairIdx + 1}`}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      matches
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                      {(pair.rightImageFile || pair.rightImageUrl) ? (
                        <Box
                          component="img"
                          src={getMatchingPreviewImageSrc(pair.rightImageFile, pair.rightImageUrl)}
                          alt={`Matching right ${pairIdx + 1}`}
                          sx={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                        />
                      ) : null}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {pair.right || `Right item ${pairIdx + 1}`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : q.type === 'numerical' ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(q.acceptedAnswers[0] || '').trim() ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={q.acceptedAnswers[0]}
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">(No number set)</Typography>
                )}
              </Box>
            ) : (
              q.options.map((option, oIndex) => (
                <Box
                  key={oIndex}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    border: `2px solid ${option.isCorrect ? theme.palette.success.main : theme.palette.divider}`,
                    backgroundColor: option.isCorrect
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'rgba(76, 175, 80, 0.05)'
                      : 'transparent',
                  }}
                >
                  {option.isCorrect ? (
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: theme.palette.text.disabled, mr: 1 }} />
                  )}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: option.isCorrect ? 600 : 400,
                    }}
                  >
                    {option.text}
                  </Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}