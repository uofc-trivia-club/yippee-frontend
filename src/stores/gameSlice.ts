// this slice handles the state of a game
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GameSettings, QuizQuestion, User } from "./types"; 

interface GameState {
    user: User; // own user
    roomCode: string;
    clientsInLobby: User[];
    // quiz: Quiz | undefined; 
    gameSettings: GameSettings | undefined;
    currentQuestion: QuizQuestion | undefined;  
    gameStatus: string;
    showLeaderboard: boolean;
    finalQuestionLeaderboard: boolean; // leaderboard display is different if it is the final question
}

const initialState = {
    user: {
        userName: "", 
        userMessage: "",
        userRole: "",
        points: 0, 
        submittedAnswer: false,
    }, 
    roomCode: "", 
    clientsInLobby: [], 
    gameSettings: undefined,
    currentQuestion: undefined, 
    gameStatus: "",
    showLeaderboard: false,
    finalQuestionLeaderboard: false,
} satisfies GameState as GameState

const gameSlice = createSlice({
    name: "game",
    initialState, 
    reducers: {
        setUserName: (state, action: PayloadAction<string>) => {
            // console.log('setUserName:', { before: { ...state.user }, after: { ...state.user, userName: action.payload } });
            state.user.userName = action.payload;
        },
        setRoomCode: (state, action: PayloadAction<string>) => {
            // console.log('setRoomCode:', { before: state.roomCode, after: action.payload });
            state.roomCode = action.payload;
        },         
        setRole: (state, action: PayloadAction<string>) => {
            // console.log('setRole:', { before: { ...state.user }, after: { ...state.user, userRole: action.payload } });
            state.user.userRole = action.payload;
        },
        setMessage: (state, action: PayloadAction<string>) => {
            // console.log('setMessage:', { before: { ...state.user }, after: { ...state.user, userMessage: action.payload } });
            state.user.userMessage = action.payload;
        },
        setSubmittedAnswer: (state, action: PayloadAction<boolean>) => {
            // console.log('setSubmittedAnswer:', { before: { ...state.user }, after: { ...state.user, userMessage: action.payload } });
            state.user.submittedAnswer = action.payload;
        },
        setShowLeaderboard: (state, action: PayloadAction<boolean>) => {
            // console.log('setShowLeaderboard:', { before: state.showLeaderboard , after: action.payload });
            state.showLeaderboard = action.payload;
        },
        setFinalQuestionLeaderboard: (state, action: PayloadAction<boolean>) => {
            // console.log('setFinalQuestionLeaderboard:', { before: state.finalQuestionLeaderboard , after: action.payload });
            state.finalQuestionLeaderboard = action.payload;
        },        upsertClientsInLobby: (state, action: PayloadAction<User[]>) => {
            // console.log('upsertClientsInLobby:', { before: [...state.clientsInLobby], after: action.payload });
            state.clientsInLobby = action.payload;
        },
        setGameSettings: (state, action: PayloadAction<GameSettings>) => {
            // console.log('setGameSettings:', { before: state.gameSettings, after: action.payload });
            state.gameSettings = action.payload;
        },
        setCurrentQuestion: (state, action: PayloadAction<QuizQuestion>) => {
            // console.log('setCurrentQuestion:', { before: state.currentQuestion, after: action.payload });
            state.currentQuestion = action.payload;
        },
        setGameStatus: (state, action: PayloadAction<string>) => {
            // console.log('setGameStatus:', { before: state.gameStatus, after: action.payload });
            state.gameStatus = action.payload;
        },
    }
})

export const { ...gameActions } = gameSlice.actions
export default gameSlice.reducer