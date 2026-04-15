export type QuizQuestionForm = {
  id: string;
  question: string;
  points: number;
  difficulty: number;
  hint: string;
  imageUrl: string;
  imageId?: string;
  imageFile: File | null;
  explanation: string;
  type: string;
  acceptedAnswers: string[];
  acceptedAnswerInput: string;
  category: string[];
  matchingPairs: Array<{
    left: string;
    right: string;
    leftImageUrl?: string;
    leftImageId?: string;
    leftImageFile: File | null;
    rightImageUrl?: string;
    rightImageId?: string;
    rightImageFile: File | null;
  }>;
  options: Array<{
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
    imageId?: string;
    imageFile: File | null;
  }>;
};

export type PresentationSlideForm = {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
};

export type TimelineItemRef = {
  id: string;
  kind: "slide" | "question";
  refId: string;
};

export type TimelinePreviewItem =
  | {
      timelineId: string;
      kind: "slide";
      timelineIndex: number;
      slideIndex: number;
      slide: PresentationSlideForm;
    }
  | {
      timelineId: string;
      kind: "question";
      timelineIndex: number;
      questionIndex: number;
      question: QuizQuestionForm;
    };

export const QUESTIONS_PER_PAGE = 5;

export const PREDEFINED_CATEGORIES = [
  'Math',
  'Science',
  'History',
  'Geography',
  'Literature',
  'Sports',
  'Technology',
  'Art',
  'Music',
  'General Knowledge',
];

export const QUESTION_TYPE_OPTIONS = [
  { value: 'multiple', label: 'Multiple Choice (Single Answer)' },
  { value: 'multi_select', label: 'Multi-Select (Multiple Answers)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'essay', label: 'Essay' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'match_the_phrase', label: 'Match the Phrase' },
  { value: 'matching', label: 'Matching' },
  { value: 'image_based', label: 'Image Based' },
  { value: 'calendar', label: 'Calendar' },
] as const;

export const createMatchingPairs = () => ([
  { left: "", right: "", leftImageUrl: "", leftImageId: "", leftImageFile: null, rightImageUrl: "", rightImageId: "", rightImageFile: null },
  { left: "", right: "", leftImageUrl: "", leftImageId: "", leftImageFile: null, rightImageUrl: "", rightImageId: "", rightImageFile: null },
]);

export const createInitialQuestion = (): QuizQuestionForm => ({
  id: `question-${Date.now()}-${Math.random()}`,
  question: "",
  points: 1,
  difficulty: 1,
  hint: "",
  imageUrl: "",
  imageId: "",
  imageFile: null,
  explanation: "",
  type: "multiple",
  acceptedAnswers: [],
  acceptedAnswerInput: "",
  category: [],
  matchingPairs: createMatchingPairs(),
  options: [
    { text: "", isCorrect: true, imageUrl: "", imageId: "", imageFile: null },
    { text: "", isCorrect: false, imageUrl: "", imageId: "", imageFile: null },
  ],
});

export const createInitialSlide = (): PresentationSlideForm => ({
  id: `slide-${Date.now()}-${Math.random()}`,
  title: "",
  content: "",
  imageUrl: "",
});