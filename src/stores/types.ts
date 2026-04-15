// Quiz type (restored)
export type Quiz = {
  id?: string;
  quizName: string;
  quizDescription: string;
  createdBy: string;
  quizQuestions: QuizQuestion[];
  quizItems?: QuizItem[];
  imageId?: string;
};

export type PresentationSlide = {
  title?: string;
  content?: string;
  imageUrl?: string;
};

export type QuizItem = {
  kind: "slide" | "question";
  slide?: PresentationSlide;
  question?: QuizQuestion;
};

// Multiple Choice
export interface MultipleChoiceType {
  name: "multiple_choice";
  description: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  options: string[];
}

// Multi Select
export interface MultiSelectType {
  name: "multi_select";
  description: string;
  correctAnswers: string[];
  incorrectAnswers: string[];
  options: string[];
}

// True/False
export interface TrueFalseType {
  name: "true_false";
  description: string;
  correctAnswer: string;
}

// Short Answer
export interface ShortAnswerType {
  name: "short_answer";
  description: string;
  correctAnswers: string[];
}

// Essay
export interface EssayType {
  name: "essay";
  description: string;
}

// Fill in the Blank
export interface FillInBlankType {
  name: "fill_in_blank";
  description: string;
  correctAnswers: string[];
}

// Numerical
export interface NumericalType {
  name: "numerical";
  description: string;
  correctAnswer: number;
}

// Match the Phrase
export interface MatchThePhraseType {
  name: "match_the_phrase";
  description: string;
  phrase: string;
  slots: string[];
  options: string[];
  correctAssign: Record<string, string>;
}

// Dropdown
export interface DropdownType {
  name: "dropdown";
  description: string;
  options: string[];
  correctAnswer: string;
}

// Ranking
export interface RankingType {
  name: "ranking";
  description: string;
  items: string[];
  correctOrder: string[];
}

// Ordering
export interface OrderingType {
  name: "ordering";
  description: string;
  items: string[];
  correctOrder: string[];
}

// Matching
export interface MatchingType {
  name: "matching";
  description: string;
  leftItems: string[];
  rightItems: string[];
  correctMatches: Record<string, string>;
}

// Image Based
export interface ImageBasedType {
  name: "image_based";
  description: string;
  imageUrl: string;
  correctAnswers: string[];
}

// Calendar
export interface CalendarType {
  name: "calendar";
  description: string;
  correctAnswers: string[]; // ISO 8601 format: YYYY-MM-DD
}

// Union type for all question types
export type QuestionType =
  | MultipleChoiceType
  | MultiSelectType
  | TrueFalseType
  | ShortAnswerType
  | EssayType
  | FillInBlankType
  | NumericalType
  | MatchThePhraseType
  | DropdownType
  | RankingType
  | OrderingType
  | MatchingType
  | ImageBasedType
  | CalendarType;

export type QuizQuestion = {
  question: string;
  points: number;
  difficulty: number;
  hint: string;
  imageUrl?: string;
  imageId?: string;
  explanation?: string;
  optionImageUrls?: string[];
  optionImageIds?: string[];
  type: QuestionType;
  category: string[];
  // The following fields are kept for compatibility, but you should use type-specific fields
  incorrectAnswers?: string[];
  correctAnswers?: string[];
  options?: string[];
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
  anonymousRef?: string;
  userMessage: string;
  userRole: string;
  points: number;
  submittedAnswer: boolean;
  submittedAnswers?: string[];
};

export type Lobby = {
  roomCode: string;
  quizMeta: QuizMeta;            // BE sends quizMeta, NOT quiz
  status: string;
  gameSettings: GameSettings;
  currentItemIndex?: number;
  currentItem?: QuizItem;
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion;
  timeRemaining: number;
  questionAnalytics?: {
    anonymousResponses?: unknown[];
    answerBuckets?: unknown[];
    optionBreakdown?: unknown[];
  };
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
