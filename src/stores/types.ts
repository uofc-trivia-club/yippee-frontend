// stores/types.ts

export type Quiz = {
  id?: string;                 // BE sends json:"id,omitempty"
  quizName: string;
  quizDescription: string;
  createdBy: string;
  quizQuestions: QuizQuestion[];
  imageId?: string;            // BE uses ObjectID pointer, omitted if nil
};

export type QuestionType = {
  name: string;
  description: string;
  correctAnswers?: string[];
  incorrectAnswers?: string[];
  options?: string[];
  correctAnswer?: string;
  pairs?: Record<string, string>;
  correctPairs?: Record<string, string>;
  items?: string[];
  correctOrder?: string[];
  leftItems?: string[];
  rightItems?: string[];
  correctMatches?: Record<string, string>;
  imageUrl?: string;
};

export type QuizQuestion = {
  question: string;
  points: number;
  difficulty: number;
  hint: string;
  type: QuestionType;
  category: string[];
  incorrectAnswers: string[];
  correctAnswers: string[];
  options: string[];
};

export type QuizMeta = {
  id?: string;
  quizName?: string;
  quizDescription?: string;
  createdBy?: string;
  imageId?: string;
  questionCount?: number;
};

export type GameSettings = {
  questionTime: number;
  enableMessagesDuringGame: boolean;
  showLeaderboard: boolean;
  shuffleQuestions: boolean;
};

export type User = {
  userName: string;
  userMessage: string;
  userRole: string;
  points: number;
  submittedAnswer: boolean;
};

export type Lobby = {
  roomCode: string;
  quizMeta: QuizMeta;            // BE sends quizMeta, NOT quiz
  status: string;
  gameSettings: GameSettings;
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion;
  timeRemaining: number;
};

export type MessageRequest = {
  action: string;
  user: User;
  roomCode?: string;
  quiz?: Quiz;
  answer?: string[];           
  gameSettings?: GameSettings;  
};

export type MessageResponse = {
  messageToClient: string;
  error?: string;
  lobby?: Lobby;
  clientsInLobby?: User[];
};
