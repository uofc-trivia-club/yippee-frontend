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
    console.log('Current Question:', game.currentQuestion);
    console.log('Correct Answers:', game.currentQuestion?.correctAnswers);

    return (
        // display the options
        <>
        {!displayCorrectAnswers ? (
            <>
            <Typography variant="h5" gutterBottom>
                Quiz: {game.currentQuestion?.question}
            </Typography>
            <Box>
                {Array.isArray(game.currentQuestion?.options) && 
                game.currentQuestion?.options.map((option, index) => (
                    <Typography key={index} variant="body1">
                    {index + 1}. {option}
                    </Typography>
                ))
                }
            </Box>
            </>
        ) : (
            // display the correct answers + stats
            <>
            <Typography variant="h5" gutterBottom>
                Quiz: {game.currentQuestion?.question}
            </Typography>
            <Typography variant="h5" gutterBottom>
                Viewing the correct answers:
            </Typography>
            <Box>
                {Array.isArray(game.currentQuestion?.options) && 
                    game.currentQuestion?.options.map((option, index) => (
                        <Typography 
                            key={index} 
                            variant="body1"
                            sx={{ 
                                color: game.currentQuestion?.correctAnswers.includes(option) 
                                    ? theme.palette.success.main 
                                    : 'inherit'
                            }}
                        >
                            {index + 1}. {option}
                        </Typography>
                    ))
                }
            </Box>
            </>
        )}
        </>
    )
}