export type PageId =
  | 'dashboard'
  | 'planner'
  | 'subjects'
  | 'tutor'
  | 'notes'
  | 'ask-notes'
  | 'flashcards'
  | 'quiz'
  | 'materials'
  | 'weak-topics'
  | 'progress'
  | 'settings';

export type SubjectCode = 'ADV-JAVA' | 'LINUX' | 'ECOM' | 'QUANTS' | string;

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: string;
  color: string;
  icon: string;
  examDate: string;
  daysUntilExam: number;
  progressPercent: number;
  totalChapters: number;
  completedChapters: number;
  materialsCount: number;
  weakTopicsCount: number;
  description: string;
  topics: string[];
  targetScore?: number;
  isArchived?: boolean;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  subjectCode: string;
  deckName: string;
  front: string;
  back: string;
  explanation?: string;
  formula?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  masteryStatus: 'learning' | 'reviewing' | 'mastered';
  lastReviewed?: string;
  reviewCount: number;
}

export interface FlashcardDeck {
  id: string;
  subjectId: string;
  subjectCode: string;
  title: string;
  description: string;
  cardCount: number;
  masteredCount: number;
  color: string;
  lastStudied: string;
  cards: Flashcard[];
}

export type NoteStyle = 'Quick Revision' | 'Detailed Notes' | 'Exam Notes' | 'Beginner Friendly';
export type NoteLength = 'Short' | 'Medium' | 'Detailed';

export interface NoteItem {
  id: string;
  subjectId: string;
  subjectCode: string;
  title: string;
  topic: string;
  category: 'Cheat Sheet' | 'Summary' | 'High-Yield' | 'Formulas' | 'Exam Review';
  style?: NoteStyle;
  length?: NoteLength;
  sourceMaterialId?: string;
  sourceMaterialTitle?: string;
  dateModified: string;
  readTimeMin: number;
  tags: string[];
  summary: string;
  contentMarkdown: string;
  keyTakeaways: string[];
  keyFormulas?: { name: string; formula: string; explanation: string }[];
  isPinned?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  subjectCode: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  codeSnippet?: string;
  formulaSnippet?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  subjectCode: string;
  durationMinutes: number;
  questionsCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Exam Standard';
  highScore?: number;
  timesTaken: number;
  questions: QuizQuestion[];
}

export interface StudyMaterial {
  id: string;
  materialId?: string;
  userId?: string;
  fileName?: string;
  title: string;
  subjectId: string;
  subjectCode: string;
  type: 'PDF' | 'Text' | 'Markdown' | 'Slides' | 'Doc' | 'Syllabus' | 'Problem Set' | 'Other';
  category?: 'Syllabus' | 'Lecture Notes' | 'Textbook' | 'Previous Year Papers' | 'Notes' | 'Slides' | 'Problem Set' | 'Other';
  topic?: string;
  fileSize: string;
  uploadDate: string;
  uploadTimestamp?: string;
  storagePath?: string;
  downloadUrl?: string;
  tags: string[];
  status: 'Uploading' | 'Processing' | 'Ready' | 'Failed';
  processingStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
  progress?: number;
  errorMessage?: string;
  processingError?: string;
  fileContent?: string;
  pageCount?: number;
  generatedItems: {
    flashcards: number;
    notes: number;
    quizzes: number;
  };
  summarySnippet: string;
}

export type TopicPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';

export interface WeakTopic {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  topicName: string;
  subtopic: string;
  accuracyRate: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Needs Review' | 'Practicing' | 'Mastered';
  frequencyInExams: 'Very High' | 'High' | 'Moderate';
  lastPracticed: string;
  recommendedAction: string;
}

export interface TopicStudyPerformance {
  id: string;
  topic: string;
  subtopic?: string;
  subjectCode: string;
  subjectName: string;
  quizAttempts: number;
  quizTotalQuestions: number;
  quizCorrectAnswers: number;
  quizIncorrectAnswers: number;
  averageQuizScore: number | null; // null if 0 attempts
  previousScorePercent?: number | null; // For tracking improvement
  flashcardsReviewed: number;
  flashcardsNeedingReview: number;
  flashcardsMastered: number;
  flashcardMasteryPercent: number | null; // null if 0 reviewed
  priority: TopicPriority;
  reason: string;
  recommendedAction: string;
  status: 'Needs Review' | 'Practicing' | 'Mastered';
  lastPracticed: string;
  improvementDelta?: number; // e.g. +36
  mistakeExamples?: string[];
}

export interface AiAdaptiveRecommendation {
  title: string;
  strugglingWith: string;
  whyDifficult: string;
  whatToDoNext: string;
  recommendedActivity: string;
  primaryTopic: string;
  primarySubject: string;
  actionType: 'tutor' | 'quiz' | 'flashcards' | 'notes';
  estimatedTimeMinutes?: number;
}

export interface TutorStructuredResponse {
  simpleExplanation: string;
  stepByStepExplanation: string[];
  analogy: string;
  example: string;
  keyTakeaways: string[];
  followUpQuestion: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export type TutorDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface TutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  timestamp: string;
  text: string;
  difficulty?: TutorDifficulty;
  subjectCode?: string;
  structuredResponse?: TutorStructuredResponse;
  codeSnippet?: {
    language: string;
    code: string;
  };
  formulaSnippet?: string;
  keyPoints?: string[];
  suggestedFollowUps?: string[];
}

export interface TutorSession {
  id: string;
  title: string;
  subjectCode: string;
  mode: 'Concept Breakdown' | 'Socratic Practice' | 'Step-by-Step Solver' | 'Exam Tips';
  lastActive: string;
  messages: TutorMessage[];
}

export interface ActivityItem {
  id: string;
  type: 'quiz' | 'flashcard' | 'notes' | 'tutor' | 'material';
  title: string;
  subjectCode: string;
  timestamp: string;
  scoreOrCount?: string;
}

export interface StudyStats {
  streakDays: number;
  hoursThisWeek: number;
  targetExamDays: number;
  targetExamSubject: string;
  cardsDueToday: number;
  weakTopicsCount: number;
  quizzesCompleted: number;
  overallMasteryPercent: number;
}

export interface AskNotesSourceInfo {
  materialId: string;
  materialTitle: string;
  section?: string;
  heading?: string;
  page?: string | number;
  excerpt?: string;
}

export interface AskNotesMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  question?: string;
  answerMarkdown: string;
  sourceInfo?: AskNotesSourceInfo;
  confidence: 'High' | 'Medium' | 'Low';
  isFoundInDocument: boolean;
  suggestGeneralTutor?: boolean;
  suggestedQuestions?: string[];
}

export interface StudentAcademicSettings {
  degree?: string; // e.g. "Bachelor of Computer Applications (BCA)"
  rollNumber?: string; // e.g. "BCA-2024-089"
  targetGraduationYear?: string; // e.g. "2027"
  targetGPA?: string; // e.g. "8.5 CGPA" or "85%"
  targetPercentage?: number; // e.g. 85
  examBoard?: string; // e.g. "Yashwantrao Chavan Maharashtra Open University (YCMOU)"
  semesterExamStartDate?: string; // e.g. "2027-01-03"
  primaryMajor?: string; // e.g. "Computer Applications / IT"
}

export interface StudentStudyPreferences {
  dailyStudyMinutes: number; // default 120 (2 hrs)
  sessionLengthMinutes: number; // default 45
  breakLengthMinutes: number; // default 10
  studyDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  preferredStudySlot: 'Morning (6 AM - 12 PM)' | 'Afternoon (12 PM - 5 PM)' | 'Evening (5 PM - 9 PM)' | 'Night (9 PM - 2 AM)';
  weeklyGoalHours: number; // default 15
}

export interface StudentLearningPreferences {
  tutorStyle: 'Socratic & Interactive' | 'Step-by-Step Problem Solver' | 'Concise & High-Yield' | 'Detailed Conceptual Deep-Dive';
  defaultDifficulty: 'Beginner' | 'Intermediate' | 'Exam Standard';
  defaultNoteStyle: 'Exam Notes' | 'Detailed Notes' | 'Quick Revision' | 'Beginner Friendly';
  flashcardReviewPace: 'Spaced Repetition (Standard)' | 'Accelerated Cramming' | 'Gentle Review';
  includeRealWorldExamples: boolean;
  includeCodeSnippets: boolean;
}

export interface StudentNotificationSettings {
  dailyStudyReminders: boolean;
  upcomingExamAlerts: boolean;
  weakTopicAlerts: boolean;
  emailDigest: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  bio?: string;
  phone?: string;
  college?: string;
  semester?: string;
  academic?: StudentAcademicSettings;
  studyPreferences?: StudentStudyPreferences;
  learningPreferences?: StudentLearningPreferences;
  notifications?: StudentNotificationSettings;
  createdAt?: any;
  updatedAt?: any;
}

/* =========================================================================
   STUDY PLANNER TYPES
   ========================================================================= */

export type PlannerActivityType =
  | 'Learn'
  | 'Review'
  | 'AI Tutor'
  | 'Practice Quiz'
  | 'Flashcards'
  | 'Notes'
  | 'Study Material Review'
  | 'Mock Test'
  | 'Break';

export interface PlannerTask {
  id: string;
  subjectCode: string;
  subjectName: string;
  topic: string;
  activityType: PlannerActivityType;
  durationMinutes: number;
  reason: string;
  isBreak?: boolean;
  completed: boolean;
  completedAt?: string;
  targetAction?: 'tutor' | 'quiz' | 'flashcards' | 'notes' | 'materials';
}

export interface PlannerDayPlan {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Monday, Sep 1"
  totalMinutes: number;
  priority: 'High' | 'Medium' | 'Standard';
  summary?: string;
  tasks: PlannerTask[];
}

export interface PlannerPreferences {
  dailyStudyMinutes: number; // default 120 (2 hours)
  sessionLengthMinutes: number; // default 45
  studyDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetSubject?: string; // ALL or specific subject code
}

export interface PrioritySubjectInfo {
  subjectCode: string;
  subjectName: string;
  priorityRank: number;
  priorityScore: number;
  priorityLevel: 'Urgent' | 'High' | 'Medium' | 'Normal';
  daysUntilExam: number;
  examDate: string;
  isExamPassed: boolean;
  weakTopicsCount: number;
  avgQuizAccuracy: number | null;
  flashcardMastery: number | null;
  reason: string;
}

export interface StudyPlan {
  id: string;
  planId: string;
  userId: string;
  generatedAt: string;
  startDate: string;
  endDate: string;
  preferences: PlannerPreferences;
  prioritySubjects: PrioritySubjectInfo[];
  days: PlannerDayPlan[];
  totalPlannedMinutes: number;
  totalTasksCount: number;
  completedTasksCount: number;
  adaptationInsights?: string[];
  isCurrent: boolean;
}


