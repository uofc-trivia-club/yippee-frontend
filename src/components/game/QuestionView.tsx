// question display for the host
// displays all options 
// after question time is over, displays all the correct answers + stats on who chose each answer

import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";

import MatchPhraseQuestion from "./questionTypes/MatchPhraseQuestion";
import { RootState } from "../../stores/store";
import { resolveMediaUrl } from "../../util/mediaUrl";
import { useMemo } from "react";
import { useSelector } from "react-redux";

interface QuestionViewProps {
  displayCorrectAnswers: boolean;
}

export default function QuestionView({ displayCorrectAnswers }: QuestionViewProps) {
    const game = useSelector((state: RootState) => state.game);
    const theme = useTheme();
    const q = game.currentQuestion;
    const t = q?.type;
    const questionNumber = (game.currentQuestionIndex ?? 0) + 1;
    const getQuestionTypeTitle = (typeName?: string) => {
        switch (typeName) {
            case 'multiple_choice': return 'Multiple-choice question';
            case 'multi_select': return 'Multi-select question';
            case 'dropdown': return 'Dropdown question';
            case 'true_false': return 'True/false question';
            case 'short_answer': return 'Short-answer question';
            case 'fill_in_blank': return 'Fill-in-the-blank question';
            case 'numerical': return 'Numerical question';
            case 'match_the_phrase': return 'Match-the-phrase question';
            case 'matching': return 'Matching question';
            case 'ranking': return 'Ranking question';
            case 'ordering': return 'Ranking question';
            case 'image_based': return 'Image-based question';
            case 'essay': return 'Essay question';
            default: return 'Question';
        }
    };
        const shuffledMatchingRightItems = useMemo(() => {
            const rightItems = (((game.currentQuestion?.type as any)?.rightItems || []) as string[]);
            const nextItems = [...rightItems];
            for (let i = nextItems.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
            }
            return nextItems;
        }, [game.currentQuestion?.type]);

        const questionCardSx = {
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,249,252,0.96))',
            boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
            } as const;

        const optionTileSx = (isCorrect: boolean) => ({
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isCorrect && displayCorrectAnswers ? theme.palette.success.main : theme.palette.divider,
                bgcolor: isCorrect && displayCorrectAnswers
                        ? (theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.18)' : 'rgba(76,175,80,0.10)')
                        : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.92)'),
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 10px 18px rgba(0,0,0,0.06)',
                },
            }) as const;

    const renderOptionsView = () => {
        if (!q || !t) return null;
        switch (t.name) {
            case 'multiple_choice': {
                const options = t.options || [];
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswer === option;
                    const optionImageUrl = resolveMediaUrl(q?.optionImageUrls?.[index]);
                    return (
                        <Box key={index} sx={optionTileSx(isCorrect)}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Chip
                                    label={index + 1}
                                    size="small"
                                    color={displayCorrectAnswers && isCorrect ? 'success' : 'default'}
                                    variant={displayCorrectAnswers && isCorrect ? 'filled' : 'outlined'}
                                    sx={{ minWidth: 34, fontWeight: 700 }}
                                />
                                <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                                    {option}
                                </Typography>
                                {optionImageUrl ? (
                                    <Box
                                        component="img"
                                        src={optionImageUrl}
                                        alt={`Option ${index + 1}`}
                                        sx={{ width: { xs: 96, md: 120 }, height: { xs: 64, md: 80 }, objectFit: 'contain', borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
                                    />
                                ) : null}
                                {displayCorrectAnswers && isCorrect && (
                                    <Chip label="Correct" size="small" color="success" />
                                )}
                            </Stack>
                        </Box>
                    );
                });
            }
            case 'multi_select': {
                const options = t.options || [];
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswers.includes(option);
                    const optionImageUrl = resolveMediaUrl(q?.optionImageUrls?.[index]);
                    return (
                        <Box key={index} sx={optionTileSx(isCorrect)}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Chip
                                    label={index + 1}
                                    size="small"
                                    color={displayCorrectAnswers && isCorrect ? 'success' : 'default'}
                                    variant={displayCorrectAnswers && isCorrect ? 'filled' : 'outlined'}
                                    sx={{ minWidth: 34, fontWeight: 700 }}
                                />
                                <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                                    {option}
                                </Typography>
                                {optionImageUrl ? (
                                    <Box
                                        component="img"
                                        src={optionImageUrl}
                                        alt={`Option ${index + 1}`}
                                        sx={{ width: { xs: 96, md: 120 }, height: { xs: 64, md: 80 }, objectFit: 'contain', borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
                                    />
                                ) : null}
                                {displayCorrectAnswers && isCorrect && (
                                    <Chip label="Correct" size="small" color="success" />
                                )}
                            </Stack>
                        </Box>
                    );
                });
            }
            case 'dropdown': {
                const options = t.options || [];
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswer === option;
                    const optionImageUrl = resolveMediaUrl(q?.optionImageUrls?.[index]);
                    return (
                        <Box key={index} sx={optionTileSx(isCorrect)}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Chip
                                    label={String.fromCharCode(65 + index)}
                                    size="small"
                                    color={displayCorrectAnswers && isCorrect ? 'success' : 'default'}
                                    variant={displayCorrectAnswers && isCorrect ? 'filled' : 'outlined'}
                                    sx={{ minWidth: 34, fontWeight: 700 }}
                                />
                                <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                                    {option}
                                </Typography>
                                {optionImageUrl ? (
                                    <Box
                                        component="img"
                                        src={optionImageUrl}
                                        alt={`Option ${index + 1}`}
                                        sx={{ width: { xs: 96, md: 120 }, height: { xs: 64, md: 80 }, objectFit: 'contain', borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
                                    />
                                ) : null}
                                {displayCorrectAnswers && isCorrect && (
                                    <Chip label="Correct" size="small" color="success" />
                                )}
                            </Stack>
                        </Box>
                    );
                });
            }
            case 'true_false': {
                const options = ["True", "False"];
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswer === option;
                    return (
                        <Box key={index} sx={optionTileSx(isCorrect)}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Chip
                                    label={index === 0 ? 'T' : 'F'}
                                    size="small"
                                    color={displayCorrectAnswers && isCorrect ? 'success' : 'default'}
                                    variant={displayCorrectAnswers && isCorrect ? 'filled' : 'outlined'}
                                    sx={{ minWidth: 34, fontWeight: 700 }}
                                />
                                <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                                    {option}
                                </Typography>
                                {displayCorrectAnswers && isCorrect && (
                                    <Chip label="Correct" size="small" color="success" />
                                )}
                            </Stack>
                        </Box>
                    );
                });
            }
            case 'short_answer':
            case 'fill_in_blank': {
                const acceptedAnswers = t.correctAnswers;
                return displayCorrectAnswers ? (
                    <Stack spacing={1}>
                        <Typography color="success.main" fontWeight="bold">
                            Accepted Answers
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {acceptedAnswers.map((ans, i) => (
                                <Chip key={i} label={ans} color="success" variant="outlined" />
                            ))}
                        </Stack>
                    </Stack>
                ) : (
                    <Typography fontStyle="italic" color="text.secondary">
                        Players are typing their responses...
                    </Typography>
                );
            }
            case 'numerical': {
                return displayCorrectAnswers ? (
                    <Stack spacing={1}>
                        <Typography color="success.main" fontWeight="bold">
                            Correct Numerical Answer
                        </Typography>
                        <Chip label={`${t.correctAnswer}`} color="success" variant="outlined" sx={{ width: 'fit-content' }} />
                    </Stack>
                ) : (
                    <Typography fontStyle="italic" color="text.secondary">
                        Players are entering a number...
                    </Typography>
                );
            }
            case 'match_the_phrase': {
                return (
                    <MatchPhraseQuestion
                        phrase={(t as any).phrase || q?.question || ''}
                        slots={((t as any).slots || []) as string[]}
                        options={((t as any).options || []) as string[]}
                        disabled={true}
                        showCorrectAnswers={displayCorrectAnswers}
                        correctAssign={(t as any).correctAssign || {}}
                        onMatchesChange={() => undefined}
                    />
                );
            }
            case 'matching': {
                const left = t.leftItems;
                const right = shuffledMatchingRightItems;
                if (!left.length || !right.length) return <Typography>No pairs to display.</Typography>;
                return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Left</Typography>
                            <Stack spacing={1}>
                                {left.map((item, idx) => (
                                    <Box key={idx} sx={optionTileSx(false)}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{idx + 1}. {item}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Right</Typography>
                            <Stack spacing={1}>
                                {right.map((item, idx) => (
                                    <Box key={idx} sx={optionTileSx(false)}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{String.fromCharCode(65 + idx)}. {item}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                );
            }
            case 'ranking':
            case 'ordering': {
                const items = (t as any).items;
                return (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Items to order</Typography>
                        <Stack spacing={1}>
                            {items.map((item: string, idx: number) => (
                                <Box key={idx} sx={optionTileSx(false)}>
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <Chip label={idx + 1} size="small" variant="outlined" sx={{ minWidth: 34, fontWeight: 700 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item}</Typography>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                );
            }
            case 'image_based': {
                const imgUrl = resolveMediaUrl(t.imageUrl);
                const answers = t.correctAnswers;
                return (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                        {imgUrl && (
                            <Box
                                component="img"
                                src={imgUrl}
                                alt="Question"
                                sx={{
                                    width: '100%',
                                    maxWidth: 760,
                                    borderRadius: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                                    objectFit: 'contain',
                                }}
                            />
                        )}
                        {displayCorrectAnswers && (
                            <Box>
                                <Typography color="success.main" fontWeight="bold" sx={{ mb: 1 }}>Correct Answers</Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {answers.map((ans, i) => (
                                        <Chip key={i} label={ans} color="success" variant="outlined" />
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Box>
                );
            }
            case 'essay': {
                return (
                    <Box sx={{ p: 2, borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>
                        <Typography fontStyle="italic" color="text.secondary">
                            Essay question. Answers will be reviewed manually.
                        </Typography>
                    </Box>
                );
            }
            default:
                return <Typography>No options to display.</Typography>;
        }
    };

    return (
        <Paper elevation={0} sx={questionCardSx}>
            <Stack spacing={2}>
                <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        <Chip
                            label={`Question ${questionNumber}`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                        />
                    </Stack>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {getQuestionTypeTitle(t?.name)}
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            lineHeight: 1.15,
                            letterSpacing: '-0.02em',
                            wordBreak: 'break-word',
                        }}
                    >
                        {q?.question || 'No question available'}
                    </Typography>
                    {q?.imageUrl ? (
                        <Box
                            component="img"
                            src={resolveMediaUrl(q.imageUrl)}
                            alt="Question"
                            sx={{
                                mt: 1.5,
                                width: '100%',
                                maxWidth: 860,
                                borderRadius: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                                objectFit: 'contain',
                            }}
                        />
                    ) : null}
                    {q?.category?.length ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                            {q.category.map((category) => (
                                <Chip key={category} label={category} size="small" variant="outlined" />
                            ))}
                        </Stack>
                    ) : null}
                </Box>

                {displayCorrectAnswers && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(76, 175, 80, 0.16)'
                              : 'rgba(76, 175, 80, 0.10)',
                            border: `1px solid ${theme.palette.success.main}`,
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Viewing the correct answers
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mt: 1 }}>{renderOptionsView()}</Box>

                {displayCorrectAnswers && q?.explanation ? (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(33, 150, 243, 0.16)'
                                : 'rgba(33, 150, 243, 0.10)',
                            border: `1px solid ${theme.palette.info.main}`,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                            Explanation
                        </Typography>
                        <Typography variant="body2">{q.explanation}</Typography>
                    </Box>
                ) : null}
            </Stack>
        </Paper>
    );
}