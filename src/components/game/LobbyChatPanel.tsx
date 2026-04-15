import { Avatar, Box, Card, CardContent, Chip, Divider, IconButton, InputAdornment, List, ListItem, Stack, TextField, Typography } from "@mui/material";

import SendIcon from '@mui/icons-material/Send';

interface LobbyChatMessage {
  id: string;
  userName: string;
  userRole: string;
  message: string;
}

interface LobbyChatPanelProps {
  chatMessages: LobbyChatMessage[];
  lobbyMessage: string;
  onLobbyMessageChange: (value: string) => void;
  onSendMessage: () => void;
  error: string | null;
  getPlayerIcon: (name: string) => React.ElementType;
}

export default function LobbyChatPanel({
  chatMessages,
  lobbyMessage,
  onLobbyMessageChange,
  onSendMessage,
  error,
  getPlayerIcon,
}: LobbyChatPanelProps) {
  return (
    <Box>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Chat
              </Typography>
              <Chip label={`${chatMessages.length} messages`} size="small" />
            </Box>

            <Box
              sx={{
                maxHeight: 260,
                overflowY: 'auto',
                px: 0.5,
                py: 0.5,
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.75)',
              }}
            >
              {chatMessages.length > 0 ? (
                <List disablePadding>
                  {chatMessages.map((message) => {
                    const MessageIcon = getPlayerIcon(message.userName);
                    const isHost = message.userRole === 'host';

                    return (
                      <ListItem key={message.id} disableGutters sx={{ px: 1, py: 0.75 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.25,
                            width: '100%',
                          }}
                        >
                          <Avatar sx={{ bgcolor: (theme) => isHost ? theme.palette.secondary.main : theme.palette.primary.main, width: 34, height: 34 }}>
                            <MessageIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                                {message.userName}
                              </Typography>
                              <Chip
                                label={isHost ? 'Host' : 'Player'}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
                              />
                            </Stack>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1.25,
                                py: 0.75,
                                borderRadius: 2,
                                bgcolor: isHost ? 'rgba(255, 64, 129, 0.12)' : 'rgba(33, 150, 243, 0.10)',
                                border: `1px solid ${isHost ? 'rgba(255, 64, 129, 0.25)' : 'rgba(33, 150, 243, 0.20)'}`,
                                wordBreak: 'break-word',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography variant="body2">{message.message}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No messages yet. Send the first one.
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider />

            <TextField
              id="message"
              label="Type a message"
              variant="outlined"
              fullWidth
              value={lobbyMessage}
              onChange={(e) => onLobbyMessageChange(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Send a message to the lobby"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="send message"
                      onClick={onSendMessage}
                      edge="end"
                      disabled={!lobbyMessage.trim()}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Typography color="error" sx={{ mt: 0.5 }}>
                {error}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}