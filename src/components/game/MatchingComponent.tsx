import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Xarrow from 'react-xarrows';

interface MatchingComponentProps {
  leftItems: string[];
  rightItems: string[];
  disabled: boolean;
  onMatchesChange: (matches: Record<string, string>) => void;
}

export default function MatchingComponent({ leftItems, rightItems, disabled, onMatchesChange }: MatchingComponentProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  useEffect(() => {
    onMatchesChange(matches);
  }, [matches, onMatchesChange]);

  const handleLeftClick = (item: string) => {
    if (disabled) return;
    setSelectedLeft(item === selectedLeft ? null : item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || !selectedLeft) return;
    
    // Add new match
    setMatches(prev => {
      const newMatches = { ...prev };
      // Remove any existing match involving the selected right item
      for (const leftKey of Object.keys(newMatches)) {
        if (newMatches[leftKey] === item) {
          delete newMatches[leftKey];
        }
      }
      newMatches[selectedLeft] = item;
      return newMatches;
    });
    
    setSelectedLeft(null);
  };

  const clearMatch = (leftItem: string) => {
    if (disabled) return;
    setMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[leftItem];
      return newMatches;
    });
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        {/* Left Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, position: 'relative' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>Terms</Typography>
          {leftItems.map((item, idx) => (
            <Paper
              key={`left-${idx}`}
              id={`left-${idx}`}
              elevation={selectedLeft === item ? 4 : 1}
              onClick={() => handleLeftClick(item)}
              sx={{
                p: 2,
                cursor: disabled ? 'default' : 'pointer',
                bgcolor: selectedLeft === item ? 'primary.light' : matches[item] ? 'success.light' : 'background.paper',
                color: (selectedLeft === item || matches[item]) ? 'white' : 'text.primary',
                border: selectedLeft === item ? '2px solid' : '1px solid',
                borderColor: selectedLeft === item ? 'primary.main' : 'divider',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 60,
                zIndex: 1
              }}
            >
              <Typography variant="body2">{item}</Typography>
              {matches[item] && !disabled && (
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); clearMatch(item); }}
                  sx={{ color: 'white' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
          ))}
        </Box>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, position: 'relative' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>Definitions</Typography>
          {rightItems.map((item, idx) => {
            const isMatched = Object.values(matches).includes(item);
            return (
              <Paper
                key={`right-${idx}`}
                id={`right-${idx}`}
                elevation={isMatched ? 2 : 1}
                onClick={() => handleRightClick(item)}
                sx={{
                  p: 2,
                  cursor: (disabled || !selectedLeft) ? 'default' : 'pointer',
                  bgcolor: isMatched ? 'success.light' : 'background.paper',
                  color: isMatched ? 'white' : 'text.primary',
                  border: '1px solid',
                  borderColor: isMatched ? 'success.main' : 'divider',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 60,
                  zIndex: 1,
                  opacity: (!isMatched && selectedLeft && !disabled) ? 0.8 : 1,
                  boxShadow: (!isMatched && selectedLeft && !disabled) ? '0 0 10px rgba(25, 118, 210, 0.4)' : 'none'
                }}
              >
                <Typography variant="body2">{item}</Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Drawing wires */}
      {Object.entries(matches).map(([leftItem, rightItem]) => {
        const leftIdx = leftItems.indexOf(leftItem);
        const rightIdx = rightItems.indexOf(rightItem);
        if (leftIdx === -1 || rightIdx === -1) return null;
        
        return (
          <Xarrow
            key={`arrow-${leftIdx}-${rightIdx}`}
            start={`left-${leftIdx}`}
            end={`right-${rightIdx}`}
            color="#2e7d32" // theme.palette.success.main roughly
            strokeWidth={4}
            path="smooth"
            headSize={4}
            curveness={0.8}
            animateDrawing={true}
          />
        );
      })}
    </Box>
  );
}
