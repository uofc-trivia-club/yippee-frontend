// used in lobby view for players

import { Box, Typography } from "@mui/material";

import { User } from "../stores/types";

interface PlayerCardProps {
  player: User;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  // Calculate size based on name length
  const getCardSize = (name: string) => {
    const baseSize = 80; // Minimum size
    const charWidth = 8; // Approximate width per character
    const width = Math.max(baseSize, name.length * charWidth);
    return {
      width: `${width}px`,
      height: `${baseSize}px`
    };
  };

  // Get color based on first letter of name
  const getPlayerColor = () => {
    const colors = [
      "#64b5f6", "#81c784", "#ffb74d", "#4dd0e1", "#ba68c8", 
      "#e57373", "#f06292", "#7986cb", "#a1887f", "#90a4ae"
    ];
    const charCode = player.userName.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  return (
    <Box
      sx={{
        ...getCardSize(player.userName),
        borderRadius: "12px",
        backgroundColor: getPlayerColor(),
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "8px",
        color: "white",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {player.userName}
      </Typography>
      
      {player.userMessage && (
        <Box
          sx={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            backgroundColor: "#ffeb91",
            padding: "4px 8px",
            borderRadius: "16px",
            fontSize: "0.7rem",
            fontStyle: "italic",
            whiteSpace: "nowrap",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "#333",
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: "-5px",
              right: "10px",
              border: "6px solid transparent",
              borderTopColor: "#ffeb91",
            },
          }}
        >
          {player.userMessage}
        </Box>
      )}
    </Box>
  );
}
