import { GameSettings, Quiz, User } from "../stores/types";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../stores/store";
import { getWebSocket } from "../util/websocketMiddleware";
import { useEffect } from "react";
import { websocketActions } from "../stores/websocketSlice";

/**
 * Hook to check and establish WebSocket connection
 */
export const useCheckConnection = () => {
  const dispatch = useDispatch();
  const isConnected = useSelector((state: RootState) => state.websocket.isConnected);

  useEffect(() => {
    if (!isConnected) {
      dispatch(websocketActions.connect("ws://localhost:8080/ws"));
    }
  }, [isConnected, dispatch]);
};

// Define command types for better type safety
type WebSocketCommandType = 
  | "createLobby"
  | "joinLobby"
  | "sendLobbyMessage"
  | "startGame"
  | "submitAnswer"
  | "showLeaderboard"
  | "nextQuestion"
  | "endGame";

// Define the structure for WebSocket commands
interface WebSocketCommand {
  action: WebSocketCommandType;
  handler: (webSocket: WebSocket, ...args: any[]) => void;
}

// webSocket commands
const WebSocketCommands: Record<WebSocketCommandType, WebSocketCommand> = {
  createLobby: {
    action: "createLobby",
    handler: (webSocket: WebSocket, quiz: Quiz, user: User) => {
      webSocket.send(JSON.stringify({ action: "createLobby", quiz, user }));
    }
  },
  joinLobby: {
    action: "joinLobby",
    handler: (webSocket: WebSocket, roomCode: string, user: User) => {
      webSocket.send(JSON.stringify({ action: "joinLobby", roomCode, user }));
    }
  },
  sendLobbyMessage: {
    action: "sendLobbyMessage",
    handler: (webSocket: WebSocket, roomCode: string, user: User) => {
      webSocket.send(JSON.stringify({ action: "sendLobbyMessage", roomCode, user }));
    }
  },
  startGame: {
    action: "startGame",
    handler: (webSocket: WebSocket, roomCode: string, user: User, gameSettings: GameSettings) => {
      webSocket.send(JSON.stringify({ action: "startGame", roomCode, user, gameSettings }));
    }
  },
  submitAnswer: {
    action: "submitAnswer",
    handler: (webSocket: WebSocket, roomCode: string, user: User, answer: number) => {
      webSocket.send(JSON.stringify({ action: "submitAnswer", roomCode, user, answer }));
    }
  },
  showLeaderboard: {
    action: "showLeaderboard",
    handler: (webSocket: WebSocket, roomCode: string, user: User) => {
      webSocket.send(JSON.stringify({ action: "showLeaderboard", roomCode, user }));
    }
  },
  nextQuestion: {
    action: "nextQuestion",
    handler: (webSocket: WebSocket, roomCode: string, user: User) => {
      webSocket.send(JSON.stringify({ action: "nextQuestion", roomCode, user }));
    }
  },
  endGame: {
    action: "endGame",
    handler: (webSocket: WebSocket, roomCode: string, user: User) => {
      webSocket.send(JSON.stringify({ action: "endGame", roomCode, user }));
    }
  }
};

/**
 * Execute a WebSocket command with proper error handling
 */
export const executeWebSocketCommand = (
  command: WebSocketCommandType,
  payload: Record<string, any>,
  onError?: (error: string) => void
) => {
  const webSocket = getWebSocket();
  
  if (!webSocket) {
    handleError("WebSocket instance is not available.", onError);
    return;
  }

  if (webSocket.readyState === WebSocket.CONNECTING) {
    webSocket.onopen = () => {
      console.log("WebSocket connection established.");
      executeCommand(command, webSocket, payload, onError);
    };
  } else if (webSocket.readyState === WebSocket.OPEN) {
    executeCommand(command, webSocket, payload, onError);
  } else {
    handleError("WebSocket connection is not available. Please try again.", onError);
  }
};

/**
 * Execute the specific command with its handler
 */
const executeCommand = (
  command: WebSocketCommandType,
  webSocket: WebSocket,
  payload: Record<string, any>,
  onError?: (error: string) => void
) => {
  const commandConfig = WebSocketCommands[command];

  if (!commandConfig) {
    handleError(`Unknown WebSocket command: "${command}".`, onError);
    return;
  }

  try {
    commandConfig.handler(webSocket, ...Object.values(payload));
  } catch (error) {
    handleError(`Error executing command "${command}": ${error}`, onError);
  }
};

/**
 * Helper function to handle errors consistently
 */
const handleError = (message: string, onError?: (error: string) => void) => {
  console.error(message);
  if (onError) {
    onError(message);
  }
};

export { WebSocketCommands };
export type { WebSocketCommandType };