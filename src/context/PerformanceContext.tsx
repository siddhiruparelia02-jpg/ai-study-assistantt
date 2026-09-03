import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TopicStudyPerformance, TopicPriority, AiAdaptiveRecommendation, ActivityItem } from '../types';
import {
  saveQuizResultToFirestore,
  loadQuizResultsFromFirestore,
  saveFlashcardSessionToFirestore,
  loadFlashcardSessionsFromFirestore,
  saveTopicPerformanceToFirestore,
  loadTopicPerformancesFromFirestore,
  saveActivityToFirestore,
  loadActivitiesFromFirestore,
  isFirestoreReady,
} from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface QuizAttemptHistoryItem {
  id: string;
  quizTitle: string;
  subjectCode: string;
  subjectName: string;
  topicName: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timestamp: string;
  date: string;
}

export interface FlashcardHistoryItem {
  id: string;
  deckTitle: string;
  subjectCode: string;
  subjectName: string;
  topicName: string;
  masteredCount: number;
  reviewCount: number;
  totalReviewed: number;
  masteryPercent: number;
  timestamp: string;
}

export interface PerformanceContextType {
  topicsPerformance: TopicStudyPerformance[];
  quizHistory: QuizAttemptHistoryItem[];
  flashcardHistory: FlashcardHistoryItem[];
  activities: ActivityItem[];
  studySessionsCount: number;
  isLoadingFirestore: boolean;
  firestoreError: string | null;
  recordQuizAttempt: (
    subjectCode: string,
    topicName: string,
    correctCount: number,
    totalQuestions: number,
    mistakes?: string[],
    quizTitle?: string
  ) => Promise<void>;
  recordFlashcardReview: (
    subjectCode: string,
    topicName: string,
    knownCount: number,
    reviewCount: number,
    deckTitle?: string
  ) => Promise<void>;
  recordTutorInteraction: (subjectCode: string, topicOrQuery: string) => void;
  recordNotesGenerated: (subjectCode: string, noteTitle: string) => void;
  recordMaterialAdded: (subjectCode: string, materialTitle: string) => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  getTopicPerformance: (topicName: string, subjectCode?: string) => TopicStudyPerformance | undefined;
  aiRecommendation: AiAdaptiveRecommendation | null;
  isLoadingRecommendation: boolean;
  fetchAiRecommendation: (subjectFilter?: string) => Promise<void>;
  resetToInitialData: () => void;
  clearAllDataForTestingEmptyState: () => void;
  refreshFromFirestore: () => Promise<void>;
}

// Initial baseline topic data representing core curriculum (with zero quiz attempts & flashcard mastery)
const baselineTopicsData: TopicStudyPerformance[] = [
  {
    id: 'perf-adv-java-1',
    topic: 'JDBC & Database Connectivity',
    subtopic: 'Type 1-4 Drivers & PreparedStatement',
    subjectCode: 'ADV-JAVA',
    subjectName: 'Advance Java',
    quizAttempts: 0,
    quizTotalQuestions: 0,
    quizCorrectAnswers: 0,
    quizIncorrectAnswers: 0,
    averageQuizScore: null,
    previousScorePercent: null,
    flashcardsReviewed: 0,
    flashcardsNeedingReview: 0,
    flashcardsMastered: 0,
    flashcardMasteryPercent: null,
    priority: 'INSUFFICIENT_DATA',
    reason: 'Diagnostic assessment pending. Practice a quiz or flashcards to assess mastery.',
    recommendedAction: 'Take a quiz or review flashcards to establish baseline performance.',
    status: 'Needs Review',
    lastPracticed: 'Not started',
    mistakeExamples: ['Statement vs PreparedStatement precompilation', 'ResultSet cursor navigation'],
  },
  {
    id: 'perf-linux-1',
    topic: 'Linux File Permissions & Inodes',
    subtopic: 'Octal chmod, chown, Hard & Soft Links',
    subjectCode: 'LINUX',
    subjectName: 'Linux Adminstration',
    quizAttempts: 0,
    quizTotalQuestions: 0,
    quizCorrectAnswers: 0,
    quizIncorrectAnswers: 0,
    averageQuizScore: null,
    previousScorePercent: null,
    flashcardsReviewed: 0,
    flashcardsNeedingReview: 0,
    flashcardsMastered: 0,
    flashcardMasteryPercent: null,
    priority: 'INSUFFICIENT_DATA',
    reason: 'Diagnostic assessment pending. Practice a quiz or flashcards to assess mastery.',
    recommendedAction: 'Take a quiz or review flashcards to establish baseline performance.',
    status: 'Needs Review',
    lastPracticed: 'Not started',
    mistakeExamples: ['Octal permission calculations', 'Hard link inode reference counter'],
  },
  {
    id: 'perf-ecom-1',
    topic: 'Electronic Payment Gateways & EDI',
    subtopic: 'B2B/B2C Models & Gateway Authorization',
    subjectCode: 'ECOM',
    subjectName: 'E-Commerce',
    quizAttempts: 0,
    quizTotalQuestions: 0,
    quizCorrectAnswers: 0,
    quizIncorrectAnswers: 0,
    averageQuizScore: null,
    previousScorePercent: null,
    flashcardsReviewed: 0,
    flashcardsNeedingReview: 0,
    flashcardsMastered: 0,
    flashcardMasteryPercent: null,
    priority: 'INSUFFICIENT_DATA',
    reason: 'Diagnostic assessment pending. Practice a quiz or flashcards to assess mastery.',
    recommendedAction: 'Take a quiz or review flashcards to establish baseline performance.',
    status: 'Needs Review',
    lastPracticed: 'Not started',
    mistakeExamples: ['Payment gateway authorization workflow', 'EDI standard document exchange'],
  },
  {
    id: 'perf-quants-1',
    topic: 'Correlation & Linear Regression',
    subtopic: 'Karl Pearson r & Regression Lines',
    subjectCode: 'QUANTS',
    subjectName: 'Quants',
    quizAttempts: 0,
    quizTotalQuestions: 0,
    quizCorrectAnswers: 0,
    quizIncorrectAnswers: 0,
    averageQuizScore: null,
    previousScorePercent: null,
    flashcardsReviewed: 0,
    flashcardsNeedingReview: 0,
    flashcardsMastered: 0,
    flashcardMasteryPercent: null,
    priority: 'INSUFFICIENT_DATA',
    reason: 'Diagnostic assessment pending. Practice a quiz or flashcards to assess mastery.',
    recommendedAction: 'Take a quiz or review flashcards to establish baseline performance.',
    status: 'Needs Review',
    lastPracticed: 'Not started',
    mistakeExamples: ['Karl Pearson r boundary condition (-1 to +1)', 'Regression line intersection at mean'],
  },
];

// Helper: Calculate priority based strictly on rules
export function calculateTopicPriority(
  quizScore: number | null,
  flashcardMastery: number | null
): TopicPriority {
  if (quizScore === null && flashcardMastery === null) {
    return 'INSUFFICIENT_DATA';
  }

  // HIGH PRIORITY: Quiz score below 50% OR Flashcard mastery below 50%
  if ((quizScore !== null && quizScore < 50) || (flashcardMastery !== null && flashcardMastery < 50)) {
    return 'HIGH';
  }

  // MEDIUM PRIORITY: Quiz score 50–70% OR Flashcard mastery 50–70%
  if (
    (quizScore !== null && quizScore <= 70) ||
    (flashcardMastery !== null && flashcardMastery <= 70)
  ) {
    return 'MEDIUM';
  }

  // LOW PRIORITY: Quiz score above 70% AND Flashcard mastery above 70% (or single metric above 70%)
  if (
    (quizScore === null || quizScore > 70) &&
    (flashcardMastery === null || flashcardMastery > 70)
  ) {
    return 'LOW';
  }

  return 'LOW';
}

export function getRecommendedAction(priority: TopicPriority): string {
  switch (priority) {
    case 'HIGH':
      return 'Review the concept before taking another quiz.';
    case 'MEDIUM':
      return 'Review your notes and practice 5 questions.';
    case 'LOW':
      return 'Continue with the next topic.';
    case 'INSUFFICIENT_DATA':
    default:
      return 'Take a quiz or review flashcards to establish baseline performance.';
  }
}

export function generateTopicReason(
  topicName: string,
  quizAttempts: number,
  totalQ: number,
  incorrectQ: number,
  avgScore: number | null,
  flashReviewed: number,
  flashNeedReview: number,
  flashMastery: number | null
): string {
  if (quizAttempts === 0 && flashReviewed === 0) {
    return 'Diagnostic assessment pending.';
  }

  if (incorrectQ > 0 && totalQ > 0) {
    const cleanTopic = topicName.split('&')[0].trim().toLowerCase();
    return `You answered ${incorrectQ} of ${totalQ} ${cleanTopic} questions incorrectly.`;
  }

  if (flashNeedReview > 0 && flashReviewed > 0) {
    return `You marked ${flashNeedReview} of ${flashReviewed} flashcards for review.`;
  }

  if (avgScore !== null && avgScore < 50) {
    return `Your average quiz score is ${avgScore}% across ${quizAttempts} attempt${quizAttempts > 1 ? 's' : ''}.`;
  }

  if (flashMastery !== null && flashMastery < 50) {
    return `Flashcard mastery is ${flashMastery}% with ${flashNeedReview} cards needing review.`;
  }

  if (avgScore !== null && avgScore >= 70 && (flashMastery === null || flashMastery >= 70)) {
    return `Strong performance with ${avgScore}% quiz score. Ready to advance.`;
  }

  return `Average accuracy is ${avgScore ?? flashMastery}%.`;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [topicsPerformance, setTopicsPerformance] = useState<TopicStudyPerformance[]>(baselineTopicsData);
  const [quizHistory, setQuizHistory] = useState<QuizAttemptHistoryItem[]>([]);
  const [flashcardHistory, setFlashcardHistory] = useState<FlashcardHistoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [studySessionsCount, setStudySessionsCount] = useState<number>(0);
  const [aiRecommendation, setAiRecommendation] = useState<AiAdaptiveRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState<boolean>(false);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Helper to get pretty subject name
  const getSubjectName = (code: string) => {
    const c = (code || '').toUpperCase();
    if (c === 'JAVA' || c === 'ADV-JAVA') return 'Advance Java';
    if (c === 'LINUX') return 'Linux Adminstration';
    if (c === 'ECOM') return 'E-Commerce';
    if (c === 'QUANTS') return 'Quants';
    if (c === 'SE' || c === 'CS302') return 'Software Engineering';
    if (c === 'CSA' || c === 'CS301') return 'Computer System Architecture';
    return code || 'Advance Java';
  };

  // Load persistent state from Firestore for the specific user
  const refreshFromFirestore = useCallback(async () => {
    if (!user || !isFirestoreReady()) {
      setIsLoadingFirestore(false);
      return;
    }
    setIsLoadingFirestore(true);
    setFirestoreError(null);
    try {
      const [savedQuizzes, savedFlashcards, savedTopics, savedActivities] = await Promise.all([
        loadQuizResultsFromFirestore(user.uid),
        loadFlashcardSessionsFromFirestore(user.uid),
        loadTopicPerformancesFromFirestore(user.uid),
        loadActivitiesFromFirestore(user.uid),
      ]);

      if (savedQuizzes) {
        setQuizHistory(savedQuizzes);
      }
      if (savedFlashcards) {
        setFlashcardHistory(savedFlashcards);
      }
      if (savedActivities) {
        setActivities(savedActivities);
      }
      if (savedTopics && savedTopics.length > 0) {
        // Merge saved topics with baseline topics
        const merged = [...savedTopics];
        baselineTopicsData.forEach((bt) => {
          if (!merged.some((m) => m.id === bt.id || m.topic.toLowerCase() === bt.topic.toLowerCase())) {
            merged.push(bt);
          }
        });
        setTopicsPerformance(merged);
      } else {
        setTopicsPerformance(baselineTopicsData);
      }
      setStudySessionsCount(
        (savedQuizzes?.length || 0) + (savedFlashcards?.length || 0) + (savedActivities?.length || 0)
      );
    } catch (err: any) {
      console.warn('Firestore initial load notice (fallback active):', err);
      setFirestoreError(err?.message || 'Firestore connecting in local offline fallback mode.');
    } finally {
      setIsLoadingFirestore(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshFromFirestore();
    } else {
      // Clear data on sign out
      setQuizHistory([]);
      setFlashcardHistory([]);
      setActivities([]);
      setTopicsPerformance(baselineTopicsData);
      setStudySessionsCount(0);
      setAiRecommendation(null);
      setIsLoadingFirestore(false);
    }
  }, [user, refreshFromFirestore]);

  const addActivity = (act: Omit<ActivityItem, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const newAct: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: act.type,
      title: act.title,
      subjectCode: act.subjectCode,
      timestamp: act.timestamp || 'Just now',
      scoreOrCount: act.scoreOrCount,
    };
    setActivities((prev) => [newAct, ...prev]);

    // Persist to Firestore asynchronously
    saveActivityToFirestore(newAct).catch((e) => console.warn('Activity firestore save notice:', e));
  };

  const recordTutorInteraction = (subjectCode: string, topicOrQuery: string) => {
    setStudySessionsCount((prev) => prev + 1);
    addActivity({
      type: 'tutor',
      title: `AI Tutor Session: ${topicOrQuery.slice(0, 45)}${topicOrQuery.length > 45 ? '...' : ''}`,
      subjectCode: subjectCode || 'ADV-JAVA',
      timestamp: 'Just now',
      scoreOrCount: 'Completed',
    });
  };

  const recordNotesGenerated = (subjectCode: string, noteTitle: string) => {
    setStudySessionsCount((prev) => prev + 1);
    addActivity({
      type: 'notes',
      title: `Notes Generated: ${noteTitle}`,
      subjectCode: subjectCode || 'ADV-JAVA',
      timestamp: 'Just now',
      scoreOrCount: 'Saved to Notes',
    });
  };

  const recordMaterialAdded = (subjectCode: string, materialTitle: string) => {
    setStudySessionsCount((prev) => prev + 1);
    addActivity({
      type: 'material',
      title: `Study Material: ${materialTitle}`,
      subjectCode: subjectCode || 'ADV-JAVA',
      timestamp: 'Just now',
      scoreOrCount: 'Uploaded',
    });
  };

  // Fetch or regenerate AI Recommendation
  const fetchAiRecommendation = async (subjectFilter: string = 'ALL') => {
    setIsLoadingRecommendation(true);
    try {
      const filtered = topicsPerformance.filter(
        (t) => subjectFilter === 'ALL' || t.subjectCode === subjectFilter
      );

      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weakTopics: filtered,
          subject: subjectFilter,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setAiRecommendation(resJson.data);
      }
    } catch (err) {
      // Clean deterministic fallback
      const highPrio = topicsPerformance.find((t) => t.priority === 'HIGH') || topicsPerformance[0];
      if (highPrio) {
        setAiRecommendation({
          title: `Focus on ${highPrio.topic}`,
          strugglingWith: `${highPrio.topic} in ${highPrio.subjectCode}`,
          whyDifficult: highPrio.reason,
          whatToDoNext: highPrio.recommendedAction,
          recommendedActivity: `Practice 5 questions on ${highPrio.topic} to improve mastery above 70%.`,
          primaryTopic: highPrio.topic,
          primarySubject: highPrio.subjectCode,
          actionType: highPrio.averageQuizScore && highPrio.averageQuizScore < 50 ? 'tutor' : 'quiz',
          estimatedTimeMinutes: 10,
        });
      }
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  useEffect(() => {
    fetchAiRecommendation('ALL');
  }, []);

  // Record Quiz Result, Recalculate Topic Performance & Persist to Firestore
  const recordQuizAttempt = async (
    subjectCode: string,
    topicName: string,
    correctCount: number,
    totalQuestions: number,
    mistakes: string[] = [],
    quizTitle?: string
  ) => {
    const attemptScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const cleanSubj = subjectCode || 'ADV-JAVA';
    const subjName = getSubjectName(cleanSubj);
    const title = quizTitle || `${cleanSubj}: ${topicName} Quiz`;

    // 1. Log to Quiz History
    const historyItem: QuizAttemptHistoryItem = {
      id: `quiz-hist-${Date.now()}`,
      quizTitle: title,
      subjectCode: cleanSubj,
      subjectName: subjName,
      topicName,
      scorePercent: attemptScore,
      correctCount,
      totalQuestions,
      timestamp: 'Just now',
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
    setQuizHistory((prev) => [historyItem, ...prev]);

    // 2. Increment session count & add activity
    setStudySessionsCount((prev) => prev + 1);
    addActivity({
      type: 'quiz',
      title: `Completed ${title}`,
      subjectCode: cleanSubj,
      timestamp: 'Just now',
      scoreOrCount: `${attemptScore}% (${correctCount}/${totalQuestions})`,
    });

    // 3. Persist Quiz Result to Firestore
    saveQuizResultToFirestore({
      ...historyItem,
      mistakes,
    }).catch((e) => console.warn('Quiz result firestore save notice:', e));

    // 4. Update topic performance metrics & persist to Firestore
    setTopicsPerformance((prev) => {
      const normalizedTopic = topicName.trim();
      const existingIndex = prev.findIndex(
        (t) =>
          t.topic.toLowerCase() === normalizedTopic.toLowerCase() ||
          normalizedTopic.toLowerCase().includes(t.topic.toLowerCase()) ||
          t.topic.toLowerCase().includes(normalizedTopic.toLowerCase())
      );

      const incorrectCount = totalQuestions - correctCount;

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const newAttempts = existing.quizAttempts + 1;
        const newTotalQ = existing.quizTotalQuestions + totalQuestions;
        const newCorrectQ = existing.quizCorrectAnswers + correctCount;
        const newIncorrectQ = existing.quizIncorrectAnswers + incorrectCount;
        const newAvgScore = Math.round((newCorrectQ / newTotalQ) * 100);

        const prevScore = existing.averageQuizScore;
        const improvement = prevScore !== null ? newAvgScore - prevScore : 0;

        const newPriority = calculateTopicPriority(newAvgScore, existing.flashcardMasteryPercent);
        const newReason = generateTopicReason(
          existing.topic,
          newAttempts,
          newTotalQ,
          newIncorrectQ,
          newAvgScore,
          existing.flashcardsReviewed,
          existing.flashcardsNeedingReview,
          existing.flashcardMasteryPercent
        );
        const newAction = getRecommendedAction(newPriority);

        let newStatus: TopicStudyPerformance['status'] = existing.status;
        if (newPriority === 'LOW' && newAvgScore >= 75) {
          newStatus = 'Mastered';
        } else if (newPriority === 'MEDIUM' || newAttempts >= 2) {
          newStatus = 'Practicing';
        } else {
          newStatus = 'Needs Review';
        }

        const updatedTopic: TopicStudyPerformance = {
          ...existing,
          quizAttempts: newAttempts,
          quizTotalQuestions: newTotalQ,
          quizCorrectAnswers: newCorrectQ,
          quizIncorrectAnswers: newIncorrectQ,
          averageQuizScore: newAvgScore,
          previousScorePercent: prevScore,
          priority: newPriority,
          reason: newReason,
          recommendedAction: newAction,
          status: newStatus,
          lastPracticed: 'Just now',
          improvementDelta: improvement,
          mistakeExamples: mistakes.length > 0 ? mistakes : existing.mistakeExamples,
        };

        // Persist updated topic to Firestore
        saveTopicPerformanceToFirestore(updatedTopic).catch((e) =>
          console.warn('Topic performance firestore save notice:', e)
        );

        const updatedList = [...prev];
        updatedList[existingIndex] = updatedTopic;
        return updatedList;
      } else {
        // Create new entry
        const priority = calculateTopicPriority(attemptScore, null);
        const reason = generateTopicReason(
          normalizedTopic,
          1,
          totalQuestions,
          incorrectCount,
          attemptScore,
          0,
          0,
          null
        );
        const action = getRecommendedAction(priority);

        const newEntry: TopicStudyPerformance = {
          id: `perf-new-${Date.now()}`,
          topic: normalizedTopic,
          subtopic: 'Diagnostic Quiz Session',
          subjectCode: cleanSubj,
          subjectName: subjName,
          quizAttempts: 1,
          quizTotalQuestions: totalQuestions,
          quizCorrectAnswers: correctCount,
          quizIncorrectAnswers: incorrectCount,
          averageQuizScore: attemptScore,
          previousScorePercent: null,
          flashcardsReviewed: 0,
          flashcardsNeedingReview: 0,
          flashcardsMastered: 0,
          flashcardMasteryPercent: null,
          priority,
          reason,
          recommendedAction: action,
          status: priority === 'HIGH' ? 'Needs Review' : priority === 'MEDIUM' ? 'Practicing' : 'Mastered',
          lastPracticed: 'Just now',
          mistakeExamples: mistakes,
        };

        // Persist new topic to Firestore
        saveTopicPerformanceToFirestore(newEntry).catch((e) =>
          console.warn('Topic performance firestore save notice:', e)
        );

        return [newEntry, ...prev];
      }
    });
  };

  // Record Flashcard Session & Persist to Firestore
  const recordFlashcardReview = async (
    subjectCode: string,
    topicName: string,
    knownCount: number,
    reviewCount: number,
    deckTitle?: string
  ) => {
    const totalReviewed = knownCount + reviewCount;
    if (totalReviewed === 0) return;

    const cleanSubj = subjectCode || 'ADV-JAVA';
    const subjName = getSubjectName(cleanSubj);
    const sessionMastery = Math.round((knownCount / totalReviewed) * 100);
    const title = deckTitle || `${cleanSubj}: ${topicName} Flashcards`;

    // 1. Log to Flashcard History
    const historyItem: FlashcardHistoryItem = {
      id: `flash-hist-${Date.now()}`,
      deckTitle: title,
      subjectCode: cleanSubj,
      subjectName: subjName,
      topicName,
      masteredCount: knownCount,
      reviewCount,
      totalReviewed,
      masteryPercent: sessionMastery,
      timestamp: 'Just now',
    };
    setFlashcardHistory((prev) => [historyItem, ...prev]);

    // 2. Increment session count & add activity
    setStudySessionsCount((prev) => prev + 1);
    addActivity({
      type: 'flashcard',
      title: `Reviewed ${title}`,
      subjectCode: cleanSubj,
      timestamp: 'Just now',
      scoreOrCount: `${knownCount}/${totalReviewed} mastered (${sessionMastery}%)`,
    });

    // 3. Persist Flashcard Session to Firestore
    saveFlashcardSessionToFirestore(historyItem).catch((e) =>
      console.warn('Flashcard session firestore save notice:', e)
    );

    // 4. Update topic performance metrics & persist to Firestore
    setTopicsPerformance((prev) => {
      const normalizedTopic = topicName.trim();
      const existingIndex = prev.findIndex(
        (t) =>
          t.topic.toLowerCase() === normalizedTopic.toLowerCase() ||
          normalizedTopic.toLowerCase().includes(t.topic.toLowerCase()) ||
          t.topic.toLowerCase().includes(normalizedTopic.toLowerCase())
      );

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const newReviewed = existing.flashcardsReviewed + totalReviewed;
        const newMastered = existing.flashcardsMastered + knownCount;
        const newNeedReview = existing.flashcardsNeedingReview + reviewCount;
        const newMasteryPercent = Math.round((newMastered / newReviewed) * 100);

        const newPriority = calculateTopicPriority(existing.averageQuizScore, newMasteryPercent);
        const newReason = generateTopicReason(
          existing.topic,
          existing.quizAttempts,
          existing.quizTotalQuestions,
          existing.quizIncorrectAnswers,
          existing.averageQuizScore,
          newReviewed,
          newNeedReview,
          newMasteryPercent
        );
        const newAction = getRecommendedAction(newPriority);

        const updated: TopicStudyPerformance = {
          ...existing,
          flashcardsReviewed: newReviewed,
          flashcardsMastered: newMastered,
          flashcardsNeedingReview: newNeedReview,
          flashcardMasteryPercent: newMasteryPercent,
          priority: newPriority,
          reason: newReason,
          recommendedAction: newAction,
          lastPracticed: 'Just now',
        };

        saveTopicPerformanceToFirestore(updated).catch((e) =>
          console.warn('Topic performance firestore save notice:', e)
        );

        const updatedList = [...prev];
        updatedList[existingIndex] = updated;
        return updatedList;
      } else {
        const priority = calculateTopicPriority(null, sessionMastery);
        const reason = generateTopicReason(
          normalizedTopic,
          0,
          0,
          0,
          null,
          totalReviewed,
          reviewCount,
          sessionMastery
        );
        const action = getRecommendedAction(priority);

        const newEntry: TopicStudyPerformance = {
          id: `perf-flash-${Date.now()}`,
          topic: normalizedTopic,
          subtopic: 'Flashcard Recall Session',
          subjectCode: cleanSubj,
          subjectName: subjName,
          quizAttempts: 0,
          quizTotalQuestions: 0,
          quizCorrectAnswers: 0,
          quizIncorrectAnswers: 0,
          averageQuizScore: null,
          previousScorePercent: null,
          flashcardsReviewed: totalReviewed,
          flashcardsNeedingReview: reviewCount,
          flashcardsMastered: knownCount,
          flashcardMasteryPercent: sessionMastery,
          priority,
          reason,
          recommendedAction: action,
          status: priority === 'HIGH' ? 'Needs Review' : 'Practicing',
          lastPracticed: 'Just now',
        };

        saveTopicPerformanceToFirestore(newEntry).catch((e) =>
          console.warn('Topic performance firestore save notice:', e)
        );

        return [newEntry, ...prev];
      }
    });
  };

  const getTopicPerformance = (topicName: string, subjectCode?: string) => {
    return topicsPerformance.find(
      (t) =>
        t.topic.toLowerCase() === topicName.toLowerCase() &&
        (!subjectCode || subjectCode === 'ALL' || t.subjectCode === subjectCode)
    );
  };

  const resetToInitialData = () => {
    setTopicsPerformance(baselineTopicsData);
    setQuizHistory([]);
    setFlashcardHistory([]);
    setActivities([]);
    setStudySessionsCount(0);
    fetchAiRecommendation('ALL');
  };

  const clearAllDataForTestingEmptyState = () => {
    setTopicsPerformance([]);
    setQuizHistory([]);
    setFlashcardHistory([]);
    setActivities([]);
    setStudySessionsCount(0);
    setAiRecommendation(null);
  };

  return (
    <PerformanceContext.Provider
      value={{
        topicsPerformance,
        quizHistory,
        flashcardHistory,
        activities,
        studySessionsCount,
        isLoadingFirestore,
        firestoreError,
        recordQuizAttempt,
        recordFlashcardReview,
        recordTutorInteraction,
        recordNotesGenerated,
        recordMaterialAdded,
        addActivity,
        getTopicPerformance,
        aiRecommendation,
        isLoadingRecommendation,
        fetchAiRecommendation,
        resetToInitialData,
        clearAllDataForTestingEmptyState,
        refreshFromFirestore,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const useStudyPerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('useStudyPerformance must be used within a PerformanceProvider');
  }
  return context;
};
