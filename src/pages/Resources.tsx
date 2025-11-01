import { Box, Typography, useTheme } from "@mui/material";

import styles from './Resources.module.css';

export default function Resources() {
  const theme = useTheme();
  
  return (
    <div className={styles.container}>
      <Box 
        className={styles.innerBox}
        sx={{
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 4px 20px rgba(0, 0, 0, 0.5)'
            : '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography>
            Are you wanting to get better at trivia? 
            <br />
            Try looking at these resources to better your knowledge!
            <br />
            [insert list here]
        </Typography>
      </Box> 
    </div>
  );
}