import { Box, IconButton, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

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
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [shuffledRightItems, setShuffledRightItems] = useState<string[]>(rightItems);
  const matchEntries = Object.entries(matches) as Array<[string, string]>;
  const leftSignature = leftItems.join('\u0001');
  const rightSignature = rightItems.join('\u0001');

  const connectionColors = [
    '#ef5350',
    '#42a5f5',
    '#66bb6a',
    '#ffa726',
    '#ab47bc',
    '#26c6da',
    '#8d6e63',
    '#ec407a',
  ];

  const getConnectionColor = (index: number) => {
    if (index < connectionColors.length) {
      return connectionColors[index];
    }
    // Generate additional colors deterministically for large sets.
    const hue = Math.round((index * 137.508) % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  useEffect(() => {
    onMatchesChange(matches);
  }, [matches, onMatchesChange]);

  useEffect(() => {
    // Reset selection/matches and shuffle right-side options once per question payload.
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatches({});
    const nextItems = [...rightItems];
    for (let i = nextItems.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
    }
    setShuffledRightItems(nextItems);
  }, [leftSignature, rightSignature]);

  const handleLeftClick = (item: string) => {
    if (disabled) return;

    // Right-to-left matching: select right first, then click left to pair.
    if (selectedRight) {
      setMatches(prev => {
        const next = { ...prev };
        delete next[item];
        for (const leftKey of Object.keys(next)) {
          if (next[leftKey] === selectedRight) {
            delete next[leftKey];
          }
        }
        next[item] = selectedRight;
        return next;
      });
      setSelectedRight(null);
      setSelectedLeft(null);
      return;
    }

    setSelectedLeft(item === selectedLeft ? null : item);
  };

  const handleRightClick = (item: string) => {
    if (disabled) return;

    if (!selectedLeft) {
      setSelectedRight(item === selectedRight ? null : item);
      return;
    }
    
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
    setSelectedRight(null);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: { xs: 1.5, md: 4 } }}>
        {/* Left Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, position: 'relative' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>Terms</Typography>
          {leftItems.map((item, idx) => (
            (() => {
              const matched = Boolean(matches[item]);
              const connectionColor = matched ? getConnectionColor(idx) : undefined;
              return (
            <Paper
              key={`left-${idx}`}
              id={`left-${idx}`}
              elevation={selectedLeft === item ? 4 : 1}
              onClick={() => handleLeftClick(item)}
              sx={{
                p: { xs: 1, md: 2 },
                cursor: disabled ? 'default' : 'pointer',
                bgcolor: selectedLeft === item ? 'primary.light' : matched ? 'rgba(0,0,0,0.03)' : 'background.paper',
                color: selectedLeft === item ? 'white' : 'text.primary',
                border: selectedLeft === item ? '2px solid' : '1px solid',
                borderColor: selectedLeft === item ? 'primary.main' : 'divider',
                borderLeft: matched ? `8px solid ${connectionColor}` : undefined,
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: { xs: 48, md: 60 },
                zIndex: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' }, lineHeight: 1.2 }}>{item}</Typography>
              </Box>
              {matched && !disabled && (
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); clearMatch(item); }}
                  sx={{ color: selectedLeft === item ? 'white' : 'text.secondary' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
              );
            })()
          ))}
        </Box>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, position: 'relative' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>Definitions</Typography>
          {shuffledRightItems.map((item, idx) => {
            const matchedLeftIdx = leftItems.findIndex((leftItem) => matches[leftItem] === item);
            const isMatched = matchedLeftIdx >= 0;
            const connectionColor = isMatched ? getConnectionColor(matchedLeftIdx) : undefined;
            const isSelectedRight = selectedRight === item;
            return (
              <Paper
                key={`right-${idx}`}
                id={`right-${idx}`}
                elevation={isMatched ? 2 : 1}
                onClick={() => handleRightClick(item)}
                sx={{
                    p: { xs: 1, md: 2 },
                  cursor: (disabled || !selectedLeft) ? 'default' : 'pointer',
                  bgcolor: isMatched ? 'rgba(0,0,0,0.03)' : 'background.paper',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: isSelectedRight ? 'primary.main' : isMatched ? connectionColor : 'divider',
                  borderRight: isMatched ? `8px solid ${connectionColor}` : undefined,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                    minHeight: { xs: 48, md: 60 },
                  zIndex: 1,
                  opacity: (!isMatched && (selectedLeft || selectedRight) && !disabled) ? 0.8 : 1,
                  boxShadow: (!isMatched && (selectedLeft || selectedRight) && !disabled) ? '0 0 10px rgba(25, 118, 210, 0.4)' : 'none'
                }}
              >
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' }, lineHeight: 1.2 }}>{item}</Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Drawing wires */}
        {matchEntries.map(([leftItem, rightItem]) => {
        const leftIdx = leftItems.indexOf(leftItem);
        const rightIdx = shuffledRightItems.indexOf(rightItem);
        if (leftIdx === -1 || rightIdx === -1) return null;
        
        return (
          <Xarrow
            key={`arrow-${leftIdx}-${rightIdx}`}
            start={`left-${leftIdx}`}
            end={`right-${rightIdx}`}
            startAnchor="right"
            endAnchor="left"
            color={getConnectionColor(leftIdx)}
            strokeWidth={4}
            path="straight"
            headSize={5}
            curveness={0}
            animateDrawing={false}
          />
        );
      })}
    </Box>
  );
}
