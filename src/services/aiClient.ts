import { TutorStructuredResponse, TutorDifficulty, PageId } from '../types';

/**
 * Unified Client-Side AI Service Layer
 * Centralizes all AI endpoint calls with structured typings, telemetry, and error recovery.
 */

export interface AiTutorRequest {
  question: string;
  subject?: string;
  difficulty?: TutorDifficulty;
  history?: Array<{ sender: string; text: string }>;
}

export interface AiTutorResponse {
  simpleExplanation: string;
  stepByStepExplanation: string[];
  analogy: string;
  example: string;
  keyTakeaways: string[];
  followUpQuestion: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export interface AskNotesRequest {
  materialId?: string;
  materialTitle: string;
  materialSubject: string;
  materialCategory?: string;
  materialContent: string;
  question: string;
  history?: Array<{ sender: string; text: string }>;
}

export interface AskNotesResult {
  isFoundInDocument: boolean;
  answerMarkdown: string;
  sourceSection: string;
  sourceExcerpt: string;
  confidence: 'High' | 'Medium' | 'Low';
  suggestGeneralTutor: boolean;
  suggestedQuestions: string[];
}

export interface GenerateNotesRequest {
  subject: string;
  topic: string;
  style: string;
  length: string;
  materialTitle?: string;
  materialCategory?: string;
  materialContent?: string;
  action?: 'generate' | 'shorter' | 'detailed' | 'regenerate';
  currentMarkdown?: string;
}

export interface GenerateQuizRequest {
  subject: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard';
  questionCount: number;
  questionType?: string;
}

export interface GenerateFlashcardsRequest {
  subject: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard';
  cardCount: number;
}

export const aiClient = {
  /**
   * Send question to AI Tutor
   */
  async askTutor(req: AiTutorRequest): Promise<AiTutorResponse> {
    const response = await fetch('/api/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Tutor service error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure from AI Tutor');
    }

    return data.data;
  },

  /**
   * Ask questions grounded strictly in selected study material
   */
  async askNotes(req: AskNotesRequest): Promise<AskNotesResult> {
    const response = await fetch('/api/notes/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Document grounding error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure from Ask Notes');
    }

    return data.data;
  },

  /**
   * Generate academic study notes with structured formulas and takeaways
   */
  async generateNotes(req: GenerateNotesRequest): Promise<any> {
    const response = await fetch('/api/notes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Note generator error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure from Note Generator');
    }

    return data.data;
  },

  /**
   * Generate verified multiple choice quiz questions
   */
  async generateQuiz(req: GenerateQuizRequest): Promise<any> {
    const response = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Quiz generator error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure from Quiz Generator');
    }

    return data.data;
  },

  /**
   * Generate active recall flashcards
   */
  async generateFlashcards(req: GenerateFlashcardsRequest): Promise<any> {
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Flashcard generator error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure from Flashcard Generator');
    }

    return data.data;
  },

  /**
   * Fetch adaptive next step recommendations
   */
  async getRecommendations(weakTopics: any[], subjectFilter: string = 'ALL'): Promise<any> {
    const response = await fetch('/api/recommendations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weakTopics,
        subject: subjectFilter,
      }),
    });

    if (!response.ok) {
      throw new Error(`Recommendations error ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Generate adaptive study plan
   */
  async generateStudyPlan(payload: any): Promise<any> {
    const response = await fetch('/api/planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Study planner error ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  },
};
