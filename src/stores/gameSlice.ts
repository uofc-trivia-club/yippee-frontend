// this slice handles the state of a game
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GameSettings, QuizItem, QuizQuestion, User } from "./types"; 

interface GameState {
    user: User; // own user
    roomCode: string;
    clientsInLobby: User[];
    gameSettings: GameSettings | undefined;
    currentItem: QuizItem | undefined;
    currentItemIndex: number;
    currentQuestion: QuizQuestion | undefined;  
    currentQuestionIndex: number;
    gameStatus: string;
    showLeaderboard: boolean;
    finalQuestionLeaderboard: boolean; // leaderboard display is different if it is the final question
    lastSubmittedAnswers: string[];
    lastSubmittedQuestion: QuizQuestion | undefined;
    questionAnalytics: {
        anonymousResponses?: unknown[];
        answerBuckets?: unknown[];
        optionBreakdown?: unknown[];
    } | undefined;
    quizQuestions: QuizQuestion[];
    questionCount: number;
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
    currentItem: undefined,
    currentItemIndex: 0,
    currentQuestion: undefined, 
    currentQuestionIndex: 0,
    gameStatus: "",
    showLeaderboard: false,
    finalQuestionLeaderboard: false,
    lastSubmittedAnswers: [],
    lastSubmittedQuestion: undefined,
    questionAnalytics: undefined,
    quizQuestions: [],
    questionCount: 0,
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
        setLastSubmittedAnswers: (state, action: PayloadAction<string[]>) => {
            state.lastSubmittedAnswers = action.payload;
        },
        setLastSubmittedQuestion: (state, action: PayloadAction<QuizQuestion | undefined>) => {
            state.lastSubmittedQuestion = action.payload;
        },
        setQuestionAnalytics: (state, action: PayloadAction<GameState['questionAnalytics']>) => {
            state.questionAnalytics = action.payload;
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

            const normalize = (value: string | undefined) => (value || '').trim().toLowerCase();
            const currentUserName = normalize(state.user.userName);
            const currentAnonymousRef = normalize((state.user as User & { anonymousRef?: string }).anonymousRef);
            if (!currentUserName && !currentAnonymousRef) {
                return;
            }

            const matchedUser = action.payload.find((user) => {
                const userName = normalize(user.userName);
                const anonymousRef = normalize(user.anonymousRef);
                return (
                    (currentAnonymousRef && anonymousRef === currentAnonymousRef) ||
                    (currentUserName && userName === currentUserName)
                );
            });
            if (matchedUser) {
                console.log('[Lobby sync] matched current user', {
                    currentUserName: state.user.userName,
                    currentAnonymousRef: (state.user as User & { anonymousRef?: string }).anonymousRef,
                    matchedUserName: matchedUser.userName,
                    matchedAnonymousRef: matchedUser.anonymousRef,
                    matchedPoints: matchedUser.points,
                    matchedSubmittedAnswer: matchedUser.submittedAnswer,
                });
                state.user.points = matchedUser.points;
                state.user.submittedAnswer = matchedUser.submittedAnswer;
                state.user.userMessage = matchedUser.userMessage;
                state.user.userRole = matchedUser.userRole || state.user.userRole;
                state.user.userName = matchedUser.userName || state.user.userName;
                (state.user as User & { anonymousRef?: string }).anonymousRef = matchedUser.anonymousRef;
            }
        },
        setGameSettings: (state, action: PayloadAction<GameSettings>) => {
            // console.log('setGameSettings:', { before: state.gameSettings, after: action.payload });
            state.gameSettings = action.payload;
        },
        setCurrentQuestion: (state, action: PayloadAction<QuizQuestion | undefined>) => {
            // console.log('setCurrentQuestion:', { before: state.currentQuestion, after: action.payload });
            state.currentQuestion = action.payload;
        },
        setCurrentItem: (state, action: PayloadAction<QuizItem | undefined>) => {
            state.currentItem = action.payload;
        },
        setCurrentItemIndex: (state, action: PayloadAction<number>) => {
            state.currentItemIndex = action.payload;
        },
        setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
            state.currentQuestionIndex = action.payload;
        },
        setGameStatus: (state, action: PayloadAction<string>) => {
            // console.log('setGameStatus:', { before: state.gameStatus, after: action.payload });
            state.gameStatus = action.payload;
        },
        setQuizQuestions: (state, action: PayloadAction<QuizQuestion[]>) => {
            state.quizQuestions = action.payload;
        },
        resetPlayersSubmittedAnswers: (state) => {
            // Reset submittedAnswer flag for all players in the lobby when a new question starts
            state.clientsInLobby = state.clientsInLobby.map(user => ({
                ...user,
                submittedAnswer: false,
            }));
        },
        setQuestionCount: (state, action: PayloadAction<number>) => {
            state.questionCount = action.payload;
        },
    }
})

export const { ...gameActions } = gameSlice.actions
export default gameSlice.reducer