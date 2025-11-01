import { MessageResponse } from "../stores/types";
import { Middleware } from "@reduxjs/toolkit";
import { gameActions } from "../stores/gameSlice";
import { websocketActions } from "../stores/websocketSlice";

let socket: WebSocket | null = null;

export const getWebSocket = () => socket;

export const websocketMiddleware: Middleware = (store) => (next) => (action) => {
    if (websocketActions.connect.match(action)) {
        const url = action.payload;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            socket = new WebSocket(url);

            socket.onopen = () => {
                store.dispatch(websocketActions.connectionOpened());
            };

            socket.onmessage = (event) => {
                try {
                    const data: MessageResponse = JSON.parse(event.data);
                    console.log("WebSocket message:", data);

                    // Handle different message types
                    switch (data.messageToClient) {
                        case "Lobby created":
                            if (data.lobby?.roomCode) {
                                store.dispatch(gameActions.setRoomCode(data.lobby.roomCode));
                                store.dispatch(gameActions.setGameStatus("Waiting"));
                                if (data.clientsInLobby) {
                                    store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                                }
                            }
                            break;

                        case "Joined lobby":
                            if (data.lobby?.roomCode) {
                                store.dispatch(gameActions.setRoomCode(data.lobby.roomCode));
                                store.dispatch(gameActions.setGameStatus(data.lobby.status || "Waiting"));
                                // store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                                if (data.clientsInLobby) {
                                    store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                                }
                            }
                            break;

                        case "Lobby updated":
                            if (data.clientsInLobby) {
                                store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                            }
                            break;

                        case "Game start":
                            if (data.lobby?.status) {
                                store.dispatch(gameActions.setGameStatus(data.lobby.status));
                                if (data.lobby.currentQuestion) {
                                    store.dispatch(gameActions.setCurrentQuestion(data.lobby.currentQuestion));
                                }
                            }
                            break;

                        case "Show leaderboard":
                            store.dispatch(gameActions.setShowLeaderboard(true))
                            break;

                        case "Show leaderboard - Final Question":
                            store.dispatch(gameActions.setShowLeaderboard(true))
                            store.dispatch(gameActions.setFinalQuestionLeaderboard(true))
                            break;

                        case "Next question":
                            if (data.lobby?.currentQuestion) {
                                store.dispatch(gameActions.setCurrentQuestion(data.lobby.currentQuestion));
                            }
                            // reset the submittedAnswer back to false for user
                            store.dispatch(gameActions.setSubmittedAnswer(false))
                            store.dispatch(gameActions.setShowLeaderboard(false))
                            break;

                        case "Game completed":
                            if (data.lobby?.status) {
                                store.dispatch(gameActions.setGameStatus(data.lobby.status));
                            }
                            break;

                        default:
                            console.warn("Unhandled message type:", data.messageToClient);
                    }
                } catch (err) {
                    console.error("WebSocket message parse error:", err);
                    store.dispatch(websocketActions.connectionError("Failed to parse WebSocket message"));
                }
            };

            socket.onclose = () => {
                store.dispatch(websocketActions.connectionClosed());
                socket = null;
            };

            socket.onerror = (err) => {
                console.error("WebSocket error:", err);
                store.dispatch(websocketActions.connectionError("WebSocket error occurred"));
                socket = null;
            };
        }
    }

    if (websocketActions.disconnect.match(action)) {
        if (socket) {
            socket.close();
            socket = null;
            store.dispatch(websocketActions.connectionClosed());
        }
    }

    return next(action);
};