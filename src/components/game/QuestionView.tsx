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
    console.log('Current Question:', game.currentQuestion);
    console.log('Correct Answers:', game.currentQuestion?.correctAnswers);

    const renderOptionsView = () => {
        switch(qType) {
            case 'multiple_choice':
            case 'true_false':
            case 'dropdown':
                const options = qType === 'true_false' 
                    ? ['True', 'False'] 
                    : (game.currentQuestion?.options || game.currentQuestion?.type?.options || []);
                    
                return options.map((option, index) => {
                    const isCorrect = 
                        game.currentQuestion?.type?.correctAnswers?.includes(option) || 
                        game.currentQuestion?.type?.correctAnswer === option || 
                        game.currentQuestion?.correctAnswers?.includes(option);
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

            case 'short_answer':
            case 'fill_in_blank':
                const acceptedAnswers = game.currentQuestion?.type?.correctAnswers || game.currentQuestion?.correctAnswers || [];
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

            default:
                const defaultOptions = game.currentQuestion?.options || game.currentQuestion?.type?.options || [];
                return defaultOptions.map((option, index) => {
                    const isCorrect = 
                        game.currentQuestion?.type?.correctAnswers?.includes(option) || 
                        game.currentQuestion?.type?.correctAnswer === option || 
                        game.currentQuestion?.correctAnswers?.includes(option);
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