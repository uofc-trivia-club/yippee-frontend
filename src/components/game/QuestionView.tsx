// question display for the host
// displays all options 
// after question time is over, displays all the correct answers + stats on who chose each answer

import {
    Box,
    Chip,
    LinearProgress,
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
            case 'calendar': return 'Calendar question';
            case 'essay': return 'Essay question';
            default: return 'Question';
        }
    };
        const shuffledMatchingRightItems = useMemo(() => {
            const pairs = (((game.currentQuestion?.type as any)?.pairs) || []) as any[];
            const rightItems = pairs.length > 0 
              ? pairs.map((p: any) => p.right || p.rightItem || '')
              : (((game.currentQuestion?.type as any)?.rightItems || []) as string[]);
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

    const matchPhraseCorrectAssign = useMemo(() => {
        if (t?.name !== 'match_the_phrase') return {} as Record<string, string>;

        const fromType = (t as any)?.correctAssign;
        if (fromType && typeof fromType === 'object' && !Array.isArray(fromType) && Object.keys(fromType).length > 0) {
            return fromType as Record<string, string>;
        }

        const fromQuestion: string[] = Array.isArray(q?.correctAnswers) ? (q?.correctAnswers as string[]) : [];
        const parsed: Record<string, string> = {};
        fromQuestion.forEach((entry) => {
            const raw = String(entry || '').trim();
            if (!raw) return;
            const separatorIndex = raw.indexOf(':');
            if (separatorIndex <= 0) return;
            const slotKey = raw.slice(0, separatorIndex).trim();
            const slotValue = raw.slice(separatorIndex + 1).trim();
            if (slotKey && slotValue) {
                parsed[slotKey] = slotValue;
            }
        });
        return parsed;
    }, [q?.correctAnswers, t]);

    const answerBreakdown = useMemo(() => {
        const normalizeText = (value: unknown) => String(value ?? '').trim();

        const extractCount = (payload: any) => {
            const candidates = [payload.count, payload.votes, payload.voteCount, payload.total, payload.value, payload.responseCount];
            for (const candidate of candidates) {
                const parsed = Number(candidate);
                if (Number.isFinite(parsed)) {
                    return Math.max(0, parsed);
                }
            }
            return 0;
        };

        const extractLabel = (payload: any, fallbackIndex: number) => {
            const candidates = [payload.label, payload.answer, payload.option, payload.text, payload.value, payload.name, payload.response];
            for (const candidate of candidates) {
                const label = normalizeText(candidate);
                if (label) {
                    return label;
                }
            }
            return `Option ${fallbackIndex + 1}`;
        };

        const rawBreakdown =
            (game.questionAnalytics as any)?.answerBuckets ||
            (game.questionAnalytics as any)?.optionBreakdown ||
            [];

        const parsedFromAnalytics = Array.isArray(rawBreakdown)
            ? rawBreakdown.map((entry, index) => {
                if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
                    const payload = entry as any;
                    return {
                        label: extractLabel(payload, index),
                        count: extractCount(payload),
                    };
                }

                return {
                    label: extractLabel({ label: entry }, index),
                    count: extractCount({ count: entry }),
                };
            })
            : [];

        const questionOptions = (() => {
            switch (t?.name) {
                case 'multiple_choice':
                case 'multi_select':
                case 'dropdown':
                    return t?.options || q?.options || [];
                case 'true_false':
                    return ['True', 'False'];
                default:
                    return [];
            }
        })();

        if (t?.name === 'match_the_phrase') {
            const slots = (((t as any)?.slots || []) as string[]).map((slot) => String(slot || '').trim()).filter(Boolean);
            const fallbackSlots = Array.from({ length: Object.keys(matchPhraseCorrectAssign).length }, (_, index) => `blank${index + 1}`);
            const slotIds = slots.length > 0 ? slots : fallbackSlots;

            const parseSubmittedAssignments = (rawLabel: string) => {
                const parts = rawLabel
                    .split('|')
                    .map((part) => String(part || '').trim())
                    .filter(Boolean);

                const map = new Map<string, string>();
                parts.forEach((part) => {
                    const separatorIndex = part.indexOf(':');
                    if (separatorIndex <= 0) return;
                    const key = part.slice(0, separatorIndex).trim();
                    const value = part.slice(separatorIndex + 1).trim();
                    if (key) map.set(key, value);
                });
                return map;
            };

            const perBlank = slotIds.map((slotId, index) => {
                const expected = String(matchPhraseCorrectAssign[slotId] || '').trim();
                let answeredCount = 0;
                let correctCount = 0;

                parsedFromAnalytics.forEach((entry) => {
                    const assignments = parseSubmittedAssignments(entry.label);
                    const submitted = String(assignments.get(slotId) || '').trim();
                    if (!submitted) return;
                    answeredCount += entry.count;
                    if (expected && submitted.toLowerCase() === expected.toLowerCase()) {
                        correctCount += entry.count;
                    }
                });

                const percent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
                return {
                    label: `Blank ${index + 1}${expected ? ` (${expected})` : ''}`,
                    count: correctCount,
                    answeredCount,
                    percent,
                    isCorrect: true,
                    index,
                };
            });

            return perBlank;
        }

        const countsByLabel = new Map<string, number>();
        parsedFromAnalytics.forEach((entry) => {
            const key = normalizeText(entry.label).toLowerCase();
            countsByLabel.set(key, (countsByLabel.get(key) || 0) + entry.count);
        });

        if (questionOptions.length > 0) {
            const optionEntries = questionOptions.map((option, index) => {
                const normalizedOption = normalizeText(option).toLowerCase();
                const count = countsByLabel.get(normalizedOption) || 0;
                const isCorrect =
                    t?.name === 'multiple_choice' ? (t as any).correctAnswer === option :
                    t?.name === 'multi_select' ? Array.isArray((t as any).correctAnswers) && (t as any).correctAnswers.includes(option) :
                    t?.name === 'dropdown' ? (t as any).correctAnswer === option :
                    t?.name === 'true_false' ? (t as any).correctAnswer === option :
                    false;

                return { label: option, count, isCorrect, index };
            });

            return optionEntries.map((entry) => ({
                ...entry,
                percent: 0,
            }));
        }

        return parsedFromAnalytics.map((entry, index) => ({
            ...entry,
            index,
            percent: 0,
            isCorrect: false,
        }));
    }, [game.questionAnalytics, matchPhraseCorrectAssign, q?.options, t]);

    const totalVotes = useMemo(
        () => answerBreakdown.reduce((sum, entry) => sum + entry.count, 0),
        [answerBreakdown]
    );

    const chartedAnswerBreakdown = useMemo(() => {
        if (t?.name === 'match_the_phrase') {
            return answerBreakdown;
        }

        if (totalVotes <= 0) {
            return answerBreakdown.map((entry) => ({ ...entry, percent: 0 }));
        }

        return answerBreakdown.map((entry) => ({
            ...entry,
            percent: Math.round((entry.count / totalVotes) * 100),
        }));
    }, [answerBreakdown, t?.name, totalVotes]);

    const renderOptionsView = () => {
        if (!q || !t) return null;
        switch (t.name) {
            case 'multiple_choice': {
                const options = t.options || q.options || [];
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
                const options = t.options || q.options || [];
                const correctAnswers = Array.isArray(t.correctAnswers) ? t.correctAnswers : [];
                return options.map((option, index) => {
                    const isCorrect = correctAnswers.includes(option);
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
                const options = t.options || q.options || [];
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
                const acceptedAnswers = Array.isArray(t.correctAnswers) ? t.correctAnswers : [];
                return displayCorrectAnswers ? (
                    <Stack spacing={1}>
                        <Typography color="success.main" fontWeight="bold">
                            Accepted Answers
                        </Typography>
                        {acceptedAnswers.length > 0 ? (
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {acceptedAnswers.map((ans, i) => (
                                    <Chip key={i} label={ans} color="success" variant="outlined" />
                                ))}
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No accepted answers were provided for this question.
                            </Typography>
                        )}
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
            case 'calendar': {
                const acceptedDates = ((t as any).correctAnswers || q?.correctAnswers || []) as string[];
                return displayCorrectAnswers ? (
                    <Stack spacing={1}>
                        <Typography color="success.main" fontWeight="bold">
                            Correct Date(s)
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {acceptedDates.map((date, i) => (
                                <Chip key={i} label={date} color="success" variant="outlined" />
                            ))}
                        </Stack>
                    </Stack>
                ) : (
                    <Typography fontStyle="italic" color="text.secondary">
                        Players are selecting dates from the calendar...
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
                        correctAssign={matchPhraseCorrectAssign}
                        onMatchesChange={() => undefined}
                    />
                );
            }
            case 'matching': {
                const pairs = (((t as any).pairs || []) as Array<{ left?: string; right?: string; leftItem?: string; rightItem?: string }>);
                const left: string[] = pairs.length > 0
                    ? pairs.map((p) => p.left || p.leftItem || '')
                    : (Array.isArray((t as any).leftItems) ? (t as any).leftItems : []);
                const right: string[] = Array.isArray(shuffledMatchingRightItems) ? shuffledMatchingRightItems : [];
                const correctMatches = (((t as any).correctMatches || {}) as Record<string, string>);
                const revealedPairs: Array<{ left: string; right: string }> = pairs.length > 0
                    ? pairs
                        .map((p) => ({ left: p.left || p.leftItem || '', right: p.right || p.rightItem || '' }))
                        .filter((pair) => Boolean(pair.left) && Boolean(pair.right))
                    : left
                        .map((leftItem, index) => ({
                            left: leftItem,
                            right: correctMatches[leftItem] || (((t as any).rightItems || [])[index] || ''),
                        }))
                        .filter((pair) => Boolean(pair.left) && Boolean(pair.right));

                if (displayCorrectAnswers) {
                    if (!revealedPairs.length) return <Typography>No pairs to display.</Typography>;
                    return (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Correct pairs</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25, mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Left
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Right
                                </Typography>
                            </Box>
                            <Stack spacing={1}>
                                {revealedPairs.map((pair, idx) => (
                                    <Box key={`${pair.left}-${pair.right}-${idx}`} sx={{ ...optionTileSx(true), borderColor: theme.palette.success.main }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25, alignItems: 'center' }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Chip label={idx + 1} size="small" color="success" sx={{ minWidth: 34, fontWeight: 700 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                                    {pair.left}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Chip label={String.fromCharCode(65 + idx)} size="small" color="success" variant="outlined" sx={{ minWidth: 34, fontWeight: 700 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                                    {pair.right}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    );
                }

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
                const allItems = Array.isArray((t as any).items) ? (t as any).items
                    : Array.isArray(q?.options) ? q.options
                    : [];
                const correctOrder = Array.isArray((t as any).correctOrder) && (t as any).correctOrder.length > 0
                    ? (t as any).correctOrder
                    : Array.isArray(q?.correctAnswers) && q.correctAnswers.length > 0
                        ? q.correctAnswers
                        : [];
                const displayItems = displayCorrectAnswers && correctOrder.length > 0 ? correctOrder : allItems;
                
                if (!displayItems.length) {
                    return <Typography color="text.secondary">No ranking items to display.</Typography>;
                }
                return (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Items to order</Typography>
                        <Stack spacing={1}>
                            {displayItems.map((item: string, displayIdx: number) => {
                                const originalIdx = allItems.indexOf(item);
                                const imageUrl = resolveMediaUrl(q?.optionImageUrls?.[originalIdx >= 0 ? originalIdx : displayIdx]);
                                return (
                                  <Box
                                    key={displayIdx}
                                    sx={{
                                        ...optionTileSx(true),
                                        borderColor: displayCorrectAnswers ? theme.palette.success.main : theme.palette.divider,
                                        bgcolor: displayCorrectAnswers
                                            ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.16)' : 'rgba(76, 175, 80, 0.10)')
                                            : optionTileSx(false).bgcolor,
                                    }}
                                >
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <Chip
                                            label={displayIdx + 1}
                                            size="small"
                                            color={displayCorrectAnswers ? 'success' : 'default'}
                                            variant={displayCorrectAnswers ? 'filled' : 'outlined'}
                                            sx={{ minWidth: 34, fontWeight: 700 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{item}</Typography>
                                        {imageUrl ? (
                                            <Box
                                                component="img"
                                                src={imageUrl}
                                                alt={`Ranking item ${displayIdx + 1}`}
                                                sx={{ width: { xs: 96, md: 120 }, height: { xs: 64, md: 80 }, objectFit: 'contain', borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
                                            />
                                        ) : null}
                                    </Stack>
                                </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                );
            }
            case 'image_based': {
                const imgUrl = resolveMediaUrl(t.imageUrl);
                const answers = Array.isArray(t.correctAnswers) ? t.correctAnswers : [];
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
                                {answers.length > 0 ? (
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {answers.map((ans, i) => (
                                            <Chip key={i} label={ans} color="success" variant="outlined" />
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No accepted answers were provided for this image question.
                                    </Typography>
                                )}
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

                {displayCorrectAnswers && t?.name !== 'matching' && (
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

                {displayCorrectAnswers && t?.name !== 'matching' && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
                            Answer Breakdown
                        </Typography>
                        {chartedAnswerBreakdown.length > 0 ? (
                            <Stack spacing={1.25}>
                                {chartedAnswerBreakdown.map((entry, index) => {
                                    const barLabel = t?.name === 'ranking' || t?.name === 'ordering'
                                        ? `${index + 1}. ${entry.label}`
                                        : entry.label;

                                    return (
                                        <Box key={`${entry.label}-${index}`} sx={{ display: 'grid', gap: 0.75 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 0, flex: 1 }} noWrap>
                                                    {barLabel}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                    {t?.name === 'match_the_phrase'
                                                        ? `${entry.count}/${(entry as any).answeredCount || 0}`
                                                        : entry.count}
                                                </Typography>
                                            </Stack>
                                            <Box sx={{ position: 'relative' }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={entry.percent}
                                                    sx={{
                                                        height: 14,
                                                        borderRadius: 999,
                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                        '& .MuiLinearProgress-bar': {
                                                            borderRadius: 999,
                                                            bgcolor: entry.isCorrect ? theme.palette.success.main : theme.palette.primary.main,
                                                        },
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 800,
                                                        color: theme.palette.text.primary,
                                                    }}
                                                >
                                                    {entry.percent}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {totalVotes} vote{totalVotes === 1 ? '' : 's'} total
                                </Typography>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Vote breakdown is not available in the current lobby payload.
                            </Typography>
                        )}
                    </Box>
                )}

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