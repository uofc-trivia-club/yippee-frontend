// question display for the host
// displays all options 
// after question time is over, displays all the correct answers + stats on who chose each answer

import { Box, Typography, useTheme } from "@mui/material";

import { RootState } from "../../stores/store";
import { useSelector } from "react-redux";

interface QuestionViewProps {
  displayCorrectAnswers: boolean;
}

export default function QuestionView({ displayCorrectAnswers }: QuestionViewProps) {
    const game = useSelector((state: RootState) => state.game);
    const theme = useTheme();
    const qType = game.currentQuestion?.type?.name;
    const q = game.currentQuestion;
    const t = q?.type;

    const renderOptionsView = () => {
        if (!q || !t) return null;
        switch (t.name) {
            case 'multiple_choice': {
                const options = t.options;
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswers.includes(option);
                    return (
                        <Typography
                            key={index}
                            variant="body1"
                            sx={{
                                color: (displayCorrectAnswers && isCorrect)
                                    ? theme.palette.success.main
                                    : 'inherit',
                                fontWeight: (displayCorrectAnswers && isCorrect) ? 'bold' : 'normal'
                            }}
                        >
                            {index + 1}. {option} {(displayCorrectAnswers && isCorrect) ? ' ✓' : ''}
                        </Typography>
                    );
                });
            }
            case 'dropdown': {
                const options = t.options;
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswer === option;
                    return (
                        <Typography
                            key={index}
                            variant="body1"
                            sx={{
                                color: (displayCorrectAnswers && isCorrect)
                                    ? theme.palette.success.main
                                    : 'inherit',
                                fontWeight: (displayCorrectAnswers && isCorrect) ? 'bold' : 'normal'
                            }}
                        >
                            {index + 1}. {option} {(displayCorrectAnswers && isCorrect) ? ' ✓' : ''}
                        </Typography>
                    );
                });
            }
            case 'true_false': {
                const options = ["True", "False"];
                return options.map((option, index) => {
                    const isCorrect = t.correctAnswer === option;
                    return (
                        <Typography
                            key={index}
                            variant="body1"
                            sx={{
                                color: (displayCorrectAnswers && isCorrect)
                                    ? theme.palette.success.main
                                    : 'inherit',
                                fontWeight: (displayCorrectAnswers && isCorrect) ? 'bold' : 'normal'
                            }}
                        >
                            {index + 1}. {option} {(displayCorrectAnswers && isCorrect) ? ' ✓' : ''}
                        </Typography>
                    );
                });
            }
            case 'short_answer':
            case 'fill_in_blank': {
                const acceptedAnswers = t.correctAnswers;
                return displayCorrectAnswers ? (
                    <Box>
                        <Typography color="success.main" fontWeight="bold">
                            Accepted Answers:
                        </Typography>
                        {acceptedAnswers.map((ans, i) => (
                            <Typography key={i} variant="body1">- {ans}</Typography>
                        ))}
                    </Box>
                ) : (
                    <Typography fontStyle="italic" color="text.secondary">
                        Players are typing their responses...
                    </Typography>
                );
            }
            case 'match_the_phrase': {
                const pairs = t.correctPairs;
                if (!pairs || Object.keys(pairs).length === 0) return <Typography>No pairs to display.</Typography>;
                return (
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box>
                            <Typography variant="subtitle2">Term</Typography>
                            {Object.keys(pairs).map((term, idx) => (
                                <Typography key={idx} variant="body2">{idx + 1}. {term}</Typography>
                            ))}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Definition</Typography>
                            {Object.values(pairs).map((def, idx) => (
                                <Typography key={idx} variant="body2">{String.fromCharCode(65 + idx)}. {def}</Typography>
                            ))}
                        </Box>
                    </Box>
                );
            }
            case 'matching': {
                const left = t.leftItems;
                const right = t.rightItems;
                if (!left.length || !right.length) return <Typography>No pairs to display.</Typography>;
                return (
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box>
                            <Typography variant="subtitle2">Left</Typography>
                            {left.map((item, idx) => (
                                <Typography key={idx} variant="body2">{idx + 1}. {item}</Typography>
                            ))}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Right</Typography>
                            {right.map((item, idx) => (
                                <Typography key={idx} variant="body2">{String.fromCharCode(65 + idx)}. {item}</Typography>
                            ))}
                        </Box>
                    </Box>
                );
            }
            case 'ranking':
            case 'ordering': {
                const items = (t as any).items;
                return (
                    <Box>
                        <Typography variant="subtitle2">Items to order:</Typography>
                        {items.map((item: string, idx: number) => (
                            <Typography key={idx} variant="body2">{idx + 1}. {item}</Typography>
                        ))}
                    </Box>
                );
            }
            case 'image_based': {
                const imgUrl = t.imageUrl;
                const answers = t.correctAnswers;
                return (
                    <Box>
                        {imgUrl && <img src={imgUrl} alt="Question" style={{ maxWidth: 300, marginBottom: 8 }} />}
                        {displayCorrectAnswers && (
                            <Box>
                                <Typography color="success.main" fontWeight="bold">Correct Answers:</Typography>
                                {answers.map((ans, i) => (
                                    <Typography key={i} variant="body1">- {ans}</Typography>
                                ))}
                            </Box>
                        )}
                    </Box>
                );
            }
            case 'essay': {
                return <Typography fontStyle="italic" color="text.secondary">Essay question. Answers will be reviewed manually.</Typography>;
            }
            default:
                return <Typography>No options to display.</Typography>;
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Quiz: {game.currentQuestion?.question}
            </Typography>
            
            {displayCorrectAnswers && (
                <Typography variant="h5" gutterBottom>
                    Viewing the correct answers:
                </Typography>
            )}
            
            <Box sx={{ mt: 1 }}>
                {renderOptionsView()}
            </Box>
        </Box>
    );
}