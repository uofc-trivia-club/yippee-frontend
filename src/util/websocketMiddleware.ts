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
                                // Reset question index to 0 for a new game
                                store.dispatch(gameActions.setCurrentQuestionIndex(0));
                                if (typeof data.lobby.quizMeta?.questionCount === "number") {
                                    store.dispatch(gameActions.setQuestionCount(data.lobby.quizMeta.questionCount));
                                }
                                // Reset leaderboard flags
                                store.dispatch(gameActions.setShowLeaderboard(false));
                                store.dispatch(gameActions.setFinalQuestionLeaderboard(false));
                                if (data.clientsInLobby) {
                                    store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                                }
                            }
                            break;

                        case "Joined lobby":
                            if (data.lobby?.roomCode) {
                                store.dispatch(gameActions.setRoomCode(data.lobby.roomCode));
                                store.dispatch(gameActions.setGameStatus(data.lobby.status || "Waiting"));
                                if (typeof data.lobby.quizMeta?.questionCount === "number") {
                                    store.dispatch(gameActions.setQuestionCount(data.lobby.quizMeta.questionCount));
                                }
                                if (typeof data.lobby.currentQuestionIndex === "number") {
                                    store.dispatch(gameActions.setCurrentQuestionIndex(data.lobby.currentQuestionIndex));
                                }
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

                        case "Quiz changed":
                            if (data.lobby) {
                                store.dispatch(gameActions.setGameStatus(data.lobby.status || "Waiting"));
                                if (typeof data.lobby.quizMeta?.questionCount === "number") {
                                    store.dispatch(gameActions.setQuestionCount(data.lobby.quizMeta.questionCount));
                                }
                                if (data.lobby.currentQuestion) {
                                    store.dispatch(gameActions.setCurrentQuestion(data.lobby.currentQuestion));
                                }
                                if (typeof data.lobby.currentQuestionIndex === "number") {
                                    store.dispatch(gameActions.setCurrentQuestionIndex(data.lobby.currentQuestionIndex));
                                }
                            }
                            if (data.clientsInLobby) {
                                store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                            }
                            store.dispatch(gameActions.setSubmittedAnswer(false));
                            store.dispatch(gameActions.setLastSubmittedAnswers([]));
                            store.dispatch(gameActions.setShowLeaderboard(false));
                            store.dispatch(gameActions.setFinalQuestionLeaderboard(false));
                                store.dispatch(gameActions.resetPlayersSubmittedAnswers());
                            break;

                        case "Game start":
                            if (data.lobby?.status) {
                                store.dispatch(gameActions.setGameStatus(data.lobby.status));
                                if (typeof data.lobby.quizMeta?.questionCount === "number") {
                                    store.dispatch(gameActions.setQuestionCount(data.lobby.quizMeta.questionCount));
                                }
                                // Reset to first question when game starts
                                store.dispatch(gameActions.setCurrentQuestionIndex(0));
                                store.dispatch(gameActions.setShowLeaderboard(false));
                                store.dispatch(gameActions.setFinalQuestionLeaderboard(false));
                                if (data.lobby.currentQuestion) {
                                    store.dispatch(gameActions.setCurrentQuestion(data.lobby.currentQuestion));
                                }
                            }
                                // Reset all players' submitted answers at game start
                                store.dispatch(gameActions.resetPlayersSubmittedAnswers());
                            break;

                        case "Show leaderboard":
                            if (data.clientsInLobby) {
                                store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                            }
                            store.dispatch(gameActions.setShowLeaderboard(true));
                            break;

                        case "Show leaderboard - Final Question":
                            if (data.clientsInLobby) {
                                store.dispatch(gameActions.upsertClientsInLobby(data.clientsInLobby));
                            }
                            store.dispatch(gameActions.setShowLeaderboard(true));
                            store.dispatch(gameActions.setFinalQuestionLeaderboard(true));
                            break;


                        case "Next question":
                            if (typeof data.lobby?.quizMeta?.questionCount === "number") {
                                store.dispatch(gameActions.setQuestionCount(data.lobby.quizMeta.questionCount));
                            }
                            if (data.lobby?.currentQuestion) {
                                store.dispatch(gameActions.setCurrentQuestion(data.lobby.currentQuestion));
                            }
                            if (typeof data.lobby?.currentQuestionIndex === "number") {
                                store.dispatch(gameActions.setCurrentQuestionIndex(data.lobby.currentQuestionIndex));
                            }
                            // reset the submittedAnswer back to false for user
                            store.dispatch(gameActions.setSubmittedAnswer(false))
                            store.dispatch(gameActions.setLastSubmittedAnswers([]))
                            store.dispatch(gameActions.setShowLeaderboard(false))
                                // Reset all players' submittedAnswer flags for the new question
                                store.dispatch(gameActions.resetPlayersSubmittedAnswers());
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