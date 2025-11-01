import { Box, Slider, Typography, useTheme } from '@mui/material';
import React from 'react';

interface DifficultySliderProps {
    difficulty: number;
    onChange: (value: number) => void;
}

export const DifficultySlider: React.FC<DifficultySliderProps> = ({ 
    difficulty, 
    onChange 
}) => {
    const theme = useTheme();

    const handleChange = (_event: Event, newValue: number | number[]) => {
        onChange(newValue as number);
    };

    const getDifficultyLabel = (value: number) => {
        if (value <= 3) return 'Easy';
        if (value <= 6) return 'Medium';
        return 'Hard';
    };

    const getDifficultyColor = (value: number) => {
        // Use secondary colors to match buttons in dark mode
        const baseColor = theme.palette.mode === 'dark' 
            ? theme.palette.secondary 
            : theme.palette.primary;
            
        if (value <= 3) return baseColor.light;
        if (value <= 6) return baseColor.main;
        return baseColor.dark;
    };

    return (
        <Box sx={{ 
            width: '100%', 
            maxWidth: 400,
            margin: '20px auto',
            padding: '10px 20px'
        }}>
            <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                    textAlign: 'center',
                    color: theme.palette.mode === 'dark' 
                        ? '#ffffff' 
                        : getDifficultyColor(difficulty)
                }}
            >
                Difficulty: {difficulty} - {getDifficultyLabel(difficulty)}
            </Typography>
            <Slider
                value={difficulty}
                onChange={handleChange}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{
                    height: 8,
                    color: theme.palette.mode === 'dark' 
                        ? theme.palette.secondary.main
                        : undefined,
                    '& .MuiSlider-thumb': {
                        height: 24,
                        width: 24,
                        backgroundColor: getDifficultyColor(difficulty),
                        '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0 0 0 8px ${getDifficultyColor(difficulty)}40`
                        }
                    },
                    '& .MuiSlider-track': {
                        background: theme.palette.mode === 'dark'
                            ? `linear-gradient(to right, ${theme.palette.secondary.light}, ${getDifficultyColor(difficulty)})`
                            : `linear-gradient(to right, ${theme.palette.primary.light}, ${getDifficultyColor(difficulty)})`,
                        height: 8,
                        border: 'none'
                    },
                    '& .MuiSlider-rail': {
                        background: theme.palette.mode === 'dark'
                            ? `linear-gradient(to right, ${theme.palette.secondary.light}, ${theme.palette.secondary.dark})`
                            : `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.dark})`,
                        height: 8,
                        opacity: 0.5
                    },
                    '& .MuiSlider-mark': {
                        backgroundColor: theme.palette.background.paper,
                        height: 8,
                        width: 2,
                        '&.MuiSlider-markActive': {
                            backgroundColor: theme.palette.background.paper,
                            opacity: 0.8
                        }
                    },
                    '& .MuiSlider-valueLabel': {
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? theme.palette.secondary.dark 
                            : theme.palette.secondary.main,
                        color: '#ffffff',
                    }
                }}
            />
        </Box>
    );
};