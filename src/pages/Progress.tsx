import React from 'react';
import {
  TrendingUp,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Target,
  BrainCircuit,
  AlertTriangle,
  FileText,
  Bot,
  RotateCcw,
  Zap,
  CheckCircle,
  Binary,
  Terminal,
  Sigma,
  BookMarked,
  BarChart3,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';
import { PageId, TopicStudyPerformance } from '../types';
import { useStudyPerformance, QuizAttemptHistoryItem, FlashcardHistoryItem } from '../context/PerformanceContext';

interface ProgressProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  onStudyTopic?: (subjectCode: string, topicName: string) => void;
  onPracticeQuiz?: (subjectCode: string, topicName: string) => void;
  onReviewFlashcards?: (subjectCode: string, topicName: string) => void;
}

// 4 Core Academic Subjects and their specified Exam Dates
interface ExamSubjectConfig {
  code: string;
  name: string;
  aliases: string[];
  examDateStr: string;
  examDateIso: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXAM_SUBJECTS: ExamSubjectConfig[] = [
  {
    code: 'JAVA',
    name: 'Java',
    aliases: ['JAVA', 'ADV-JAVA', 'JAVA PROGRAMMING', 'ADVANCE JAVA'],
    examDateStr: '3 June 2026',
    examDateIso: '2026-06-03',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderAccent: 'border-indigo-200',
    icon: Binary,
  },
  {
    code: 'SE',
    name: 'Software Engineering',
    aliases: ['SE', 'CS302', 'SOFTWARE ENGINEERING', 'LINUX', 'LINUX ADMINSTRATION'],
    examDateStr: '1 June 2026',
    examDateIso: '2026-06-01',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderAccent: 'border-emerald-200',
    icon: Terminal,
  },
  {
    code: 'CSA',
    name: 'Computer System Architecture',
    aliases: ['CSA', 'CS301', 'COMPUTER SYSTEM ARCHITECTURE', 'CSA ARCHITECTURE'],
    examDateStr: '30 May 2026',
    examDateIso: '2026-05-30',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderAccent: 'border-amber-200',
    icon: Layers,
  },
  {
    code: 'FS',
    name: 'Financial Studies',
    aliases: ['FS', 'FIN', 'FINANCIAL STUDIES', 'ECOM', 'QUANTS', 'E-COMMERCE'],
    examDateStr: '7 June 2026',
    examDateIso: '2026-06-07',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderAccent: 'border-rose-200',
    icon: Sigma,
  },
];

// Helper to calculate exam countdown safely (if passed, return 'Completed' without negative numbers)
function getExamCountdown(examDateIso: string): { isCompleted: boolean; label: string } {
  const target = new Date(examDateIso);
  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { isCompleted: true, label: 'Completed' };
  }
  return { isCompleted: false, label: `${diffDays} days left` };
}

// Subject matching helper
function matchesSubject(subjectCode: string, targetConfig: ExamSubjectConfig): boolean {
  const clean = (subjectCode || '').trim().toUpperCase();
  return targetConfig.aliases.some((alias) => alias.toUpperCase() === clean);
}

export const Progress: React.FC<ProgressProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigate,
  onStudyTopic,
  onPracticeQuiz,
  onReviewFlashcards,
}) => {
  const {
    topicsPerformance,
    quizHistory,
    flashcardHistory,
    activities,
    studySessionsCount,
    aiRecommendation,
  } = useStudyPerformance();

  // 1. Overall Progress Calculations
  const totalQuizzesCompleted = quizHistory.length;
  const totalFlashcardsReviewed = flashcardHistory.reduce(
    (sum, item) => sum + item.totalReviewed,
    0
  );
  const totalCardsMastered = flashcardHistory.reduce(
    (sum, item) => sum + item.masteredCount,
    0
  );
  const totalCardsNeedingReview = flashcardHistory.reduce(
    (sum, item) => sum + item.reviewCount,
    0
  );

  // Overall flashcard mastery percent
  const overallFlashcardMastery =
    totalFlashcardsReviewed > 0
      ? Math.round((totalCardsMastered / totalFlashcardsReviewed) * 100)
      : 0;

  // Average quiz score
  const averageQuizScore =
    totalQuizzesCompleted > 0
      ? Math.round(
          quizHistory.reduce((sum, item) => sum + item.scorePercent, 0) /
            totalQuizzesCompleted
        )
      : null;

  // Best quiz score
  const bestQuizScore =
    totalQuizzesCompleted > 0
      ? Math.max(...quizHistory.map((q) => q.scorePercent))
      : null;

  // Streak
  const currentStreak = studySessionsCount > 0 ? 1 : 0;

  // Overall Learning Progress (derived across subjects)
  const calculateOverallProgress = (): number => {
    if (studySessionsCount === 0 && totalQuizzesCompleted === 0 && totalFlashcardsReviewed === 0) {
      return 0;
    }
    const topicScores = topicsPerformance
      .map((t) => t.averageQuizScore ?? t.flashcardMasteryPercent)
      .filter((s): s is number => s !== null);

    if (topicScores.length === 0) return 0;
    const avg = topicScores.reduce((a, b) => a + b, 0) / topicScores.length;
    return Math.min(100, Math.max(0, Math.round(avg)));
  };

  const overallLearningProgress = calculateOverallProgress();

  // 2. Subject Progress Breakdown Calculations
  const subjectProgressList = EXAM_SUBJECTS.map((subj) => {
    const relatedTopics = topicsPerformance.filter((t) =>
      matchesSubject(t.subjectCode, subj)
    );

    const relatedQuizzes = quizHistory.filter((q) =>
      matchesSubject(q.subjectCode, subj)
    );

    const relatedFlashcards = flashcardHistory.filter((f) =>
      matchesSubject(f.subjectCode, subj)
    );

    const subjQuizAttempts = relatedQuizzes.length;
    const subjAvgQuizScore =
      subjQuizAttempts > 0
        ? Math.round(
            relatedQuizzes.reduce((sum, q) => sum + q.scorePercent, 0) /
              subjQuizAttempts
          )
        : null;

    const subjCardsReviewed = relatedFlashcards.reduce(
      (sum, f) => sum + f.totalReviewed,
      0
    );
    const subjCardsMastered = relatedFlashcards.reduce(
      (sum, f) => sum + f.masteredCount,
      0
    );
    const subjFlashcardMastery =
      subjCardsReviewed > 0
        ? Math.round((subjCardsMastered / subjCardsReviewed) * 100)
        : null;

    const weakTopics = relatedTopics.filter(
      (t) => t.priority === 'HIGH' || t.priority === 'MEDIUM'
    );

    const masteredTopics = relatedTopics.filter(
      (t) => t.status === 'Mastered' || (t.averageQuizScore !== null && t.averageQuizScore >= 75)
    );

    // Subject Progress Percentage
    let progressPct = 0;
    if (subjQuizAttempts > 0 || subjCardsReviewed > 0 || masteredTopics.length > 0) {
      const quizPart = (subjAvgQuizScore ?? 0) * 0.5;
      const flashPart = (subjFlashcardMastery ?? 0) * 0.3;
      const topicsPart =
        relatedTopics.length > 0
          ? (masteredTopics.length / relatedTopics.length) * 20
          : 0;
      progressPct = Math.min(100, Math.round(quizPart + flashPart + topicsPart));
    }

    const countdown = getExamCountdown(subj.examDateIso);

    return {
      ...subj,
      progressPercent: progressPct,
      quizAttempts: subjQuizAttempts,
      averageQuizScore: subjAvgQuizScore,
      flashcardsReviewed: subjCardsReviewed,
      flashcardMastery: subjFlashcardMastery,
      topicsCount: relatedTopics.length || 1,
      topicsCompletedCount: masteredTopics.length,
      weakTopicsCount: weakTopics.length,
      weakTopics,
      examCountdown: countdown,
    };
  });

  // 3. Improvement Metric Calculation
  // If >= 2 quizzes exist in history, compare older vs newer attempts
  let improvementData: {
    hasHistory: boolean;
    previousAvg: number;
    currentAvg: number;
    delta: number;
  } = {
    hasHistory: false,
    previousAvg: 0,
    currentAvg: 0,
    delta: 0,
  };

  if (quizHistory.length >= 2) {
    const half = Math.floor(quizHistory.length / 2);
    // Recent are at the start of quizHistory (descending by timestamp)
    const recentScores = quizHistory.slice(0, half).map((q) => q.scorePercent);
    const olderScores = quizHistory.slice(half).map((q) => q.scorePercent);

    const recentAvg = Math.round(
      recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    );
    const olderAvg = Math.round(
      olderScores.reduce((a, b) => a + b, 0) / olderScores.length
    );
    const delta = recentAvg - olderAvg;

    improvementData = {
      hasHistory: true,
      previousAvg: olderAvg,
      currentAvg: recentAvg,
      delta,
    };
  }

  // 4. Weak Topics List (sorted: HIGH priority first, then MEDIUM)
  const activeWeakTopics = [...topicsPerformance].sort((a, b) => {
    const pWeight = { HIGH: 3, MEDIUM: 2, LOW: 1, INSUFFICIENT_DATA: 0 };
    return (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
  });

  // 5. Subject Priority ("Recommended Focus")
  const highestPriorityTopic =
    topicsPerformance.find((t) => t.priority === 'HIGH') ||
    topicsPerformance.find((t) => t.priority === 'MEDIUM') ||
    topicsPerformance[0];

  // Action handlers connecting to existing app features
  const handleStudyAction = (subjectCode: string, topic: string) => {
    if (onStudyTopic) {
      onStudyTopic(subjectCode, topic);
    } else {
      onSelectSubject(subjectCode);
      onNavigate('tutor');
    }
  };

  const handleQuizAction = (subjectCode: string, topic: string) => {
    if (onPracticeQuiz) {
      onPracticeQuiz(subjectCode, topic);
    } else {
      onSelectSubject(subjectCode);
      onNavigate('quiz');
    }
  };

  const handleFlashcardAction = (subjectCode: string, topic: string) => {
    if (onReviewFlashcards) {
      onReviewFlashcards(subjectCode, topic);
    } else {
      onSelectSubject(subjectCode);
      onNavigate('flashcards');
    }
  };

  return (
    <div className="space-y-8 pb-16" id="progress-dashboard-root">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight" id="progress-header-title">
              Progress Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Student: Siddhi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized study analytics, subject mastery metrics, and exam readiness tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('quiz')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
            id="btn-progress-start-quiz"
          >
            <Zap className="w-3.5 h-3.5" />
            Practice Quiz
          </button>
          <button
            onClick={() => onNavigate('flashcards')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            id="btn-progress-review-flashcards"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Review Flashcards
          </button>
        </div>
      </div>

      {/* 1. Overall Progress Section */}
      <section aria-labelledby="section-overall-progress" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 id="section-overall-progress" className="text-base font-bold text-slate-900">
              Overall Progress
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Real-time Performance Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Metric 1: Overall Learning Progress */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            id="card-overall-progress"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-600">Overall Progress</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {overallLearningProgress}%
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {overallLearningProgress === 0 ? 'Starting baseline' : 'Across all subjects'}
            </p>
          </div>

          {/* Metric 2: Total Study Sessions */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            id="card-total-sessions"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-600">Study Sessions</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {studySessionsCount}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {studySessionsCount === 0 ? '0 study sessions' : 'Total completed'}
            </p>
          </div>

          {/* Metric 3: Total Quizzes Completed */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            id="card-quizzes-completed"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-600">Quizzes Taken</span>
              <HelpCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalQuizzesCompleted}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {totalQuizzesCompleted === 0 ? '0 quizzes' : 'Quizzes completed'}
            </p>
          </div>

          {/* Metric 4: Total Flashcards Reviewed */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            id="card-flashcards-reviewed"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-600">Cards Reviewed</span>
              <Layers className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalFlashcardsReviewed}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {totalFlashcardsReviewed === 0 ? '0 cards reviewed' : `${totalCardsMastered} mastered`}
            </p>
          </div>

          {/* Metric 5: Average Quiz Score */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            id="card-average-quiz-score"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-600">Avg Quiz Score</span>
              <TrendingUp className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {averageQuizScore !== null ? `${averageQuizScore}%` : '0%'}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              {averageQuizScore !== null ? `Best: ${bestQuizScore}%` : 'No quiz data yet'}
            </p>
          </div>

          {/* Metric 6: Current Study Streak */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            id="card-study-streak"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-600">Study Streak</span>
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {currentStreak === 0 ? 'Start studying to build streak' : 'Active consistency'}
            </p>
          </div>
        </div>
      </section>

      {/* 8. Subject Priority ("Recommended Focus") & 7. Improvement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended Focus (7 cols) */}
        <div
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between"
          id="card-recommended-focus"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-700" />
                  Recommended Focus
                </span>
                <span className="text-xs text-slate-400 font-medium">Highest Priority Topic</span>
              </div>

              {highestPriorityTopic && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    highestPriorityTopic.priority === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {highestPriorityTopic.priority} Priority
                </span>
              )}
            </div>

            {highestPriorityTopic ? (
              <div className="space-y-2 mt-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {highestPriorityTopic.topic}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Subject: {highestPriorityTopic.subjectName} ({highestPriorityTopic.subjectCode})
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {highestPriorityTopic.reason ||
                    aiRecommendation?.whyDifficult ||
                    'Focus on this high-priority topic to build foundational mastery before taking diagnostic quizzes.'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">No weak topics identified yet. Keep practicing!</p>
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Targeted concept breakdown with interactive AI Tutor
            </span>
            {highestPriorityTopic && (
              <button
                onClick={() =>
                  handleStudyAction(highestPriorityTopic.subjectCode, highestPriorityTopic.topic)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                id="btn-study-now-recommended"
              >
                <Bot className="w-3.5 h-3.5" />
                Study Now
              </button>
            )}
          </div>
        </div>

        {/* 7. Improvement Metric Card (5 cols) */}
        <div
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between"
          id="card-improvement-metrics"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Score Improvement</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Trajectory</span>
            </div>

            {improvementData.hasHistory ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Previous Quiz Average
                    </span>
                    <span className="text-xl font-bold text-slate-800">
                      {improvementData.previousAvg}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Current Quiz Average
                    </span>
                    <span className="text-xl font-bold text-indigo-700">
                      {improvementData.currentAvg}%
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    improvementData.delta >= 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span>Overall Improvement:</span>
                  <span className="text-sm font-extrabold">
                    {improvementData.delta >= 0 ? `+${improvementData.delta}%` : `${improvementData.delta}%`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center my-auto space-y-2">
                <AlertTriangle className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Complete more study sessions to see your improvement.
                </p>
                <p className="text-[11px] text-slate-400">
                  Take at least 2 quizzes to calculate baseline vs. current diagnostic trajectory.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Diagnostic sessions taken: {totalQuizzesCompleted}</span>
            <button
              onClick={() => onNavigate('quiz')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Take a Quiz <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Subject Progress Section */}
      <section aria-labelledby="section-subject-progress" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 id="section-subject-progress" className="text-base font-bold text-slate-900">
              Subject Progress
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            4 Core Subjects: Java, Software Engineering, CSA, Financial Studies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectProgressList.map((subject) => {
            const IconComponent = subject.icon;
            return (
              <div
                key={subject.code}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
                id={`card-subject-progress-${subject.code.toLowerCase()}`}
              >
                {/* Subject Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg ${subject.badgeBg} ${subject.badgeText} flex items-center justify-center font-bold`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {subject.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Code: {subject.code}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        subject.examCountdown.isCompleted
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {subject.examCountdown.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Subject Mastery</span>
                      <span className="font-extrabold text-indigo-600">
                        {subject.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${subject.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Details Grid */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  {/* Quiz Performance */}
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      Quiz Performance:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {subject.averageQuizScore !== null
                        ? `Avg ${subject.averageQuizScore}% (${subject.quizAttempts})`
                        : '0 quizzes'}
                    </span>
                  </div>

                  {/* Flashcard Mastery */}
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Flashcard Mastery:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {subject.flashcardMastery !== null
                        ? `${subject.flashcardMastery}% recall`
                        : '0 cards mastered'}
                    </span>
                  </div>

                  {/* Topics Completed */}
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      Topics Completed:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {subject.topicsCompletedCount} / {subject.topicsCount} completed
                    </span>
                  </div>

                  {/* Weak Topics Count */}
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Weak Topics:
                    </span>
                    <span
                      className={`font-semibold ${
                        subject.weakTopicsCount > 0 ? 'text-amber-700' : 'text-slate-500'
                      }`}
                    >
                      {subject.weakTopicsCount > 0
                        ? `${subject.weakTopicsCount} needing review`
                        : 'None'}
                    </span>
                  </div>
                </div>

                {/* Exam Date & Quick Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    Exam: <strong className="text-slate-600">{subject.examDateStr}</strong>
                  </div>
                  <button
                    onClick={() => {
                      onSelectSubject(subject.code);
                      onNavigate('subjects');
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Quiz Performance & 4. Flashcard Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3. Quiz Performance (7 cols) */}
        <div
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
          id="card-quiz-performance"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Quiz Performance</h3>
            </div>
            <button
              onClick={() => onNavigate('quiz')}
              className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              Take Quiz <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Metric sub-row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">
                Quizzes Completed
              </span>
              <span className="text-xl font-bold text-slate-900">
                {totalQuizzesCompleted}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Average Score</span>
              <span className="text-xl font-bold text-indigo-600">
                {averageQuizScore !== null ? `${averageQuizScore}%` : '0%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Best Score</span>
              <span className="text-xl font-bold text-emerald-600">
                {bestQuizScore !== null ? `${bestQuizScore}%` : '—'}
              </span>
            </div>
          </div>

          {/* Recent Quiz Scores */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recent Quiz Scores
            </h4>

            {quizHistory.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {quizHistory.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{q.quizTitle}</div>
                      <div className="text-[11px] text-slate-400">
                        {q.subjectName} • {q.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px]">
                        {q.correctCount}/{q.totalQuestions} correct
                      </span>
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded-md ${
                          q.scorePercent >= 75
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.scorePercent >= 50
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {q.scorePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                No quizzes taken yet. Complete a quiz to see diagnostic score records.
              </div>
            )}
          </div>
        </div>

        {/* 4. Flashcard Performance (5 cols) */}
        <div
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between"
          id="card-flashcard-performance"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Flashcard Performance</h3>
              </div>
              <button
                onClick={() => onNavigate('flashcards')}
                className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                Review Cards <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Flashcard Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Total Cards Reviewed
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {totalFlashcardsReviewed}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Cards Mastered
                </span>
                <span className="text-xl font-bold text-emerald-600">
                  {totalCardsMastered}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Cards Needing Review
                </span>
                <span className="text-xl font-bold text-amber-600">
                  {totalCardsNeedingReview}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Overall Mastery
                </span>
                <span className="text-xl font-bold text-indigo-600">
                  {overallFlashcardMastery}%
                </span>
              </div>
            </div>

            {/* Visual Mastery Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Mastery Ratio</span>
                <span className="font-bold text-slate-700">
                  {totalCardsMastered} of {totalFlashcardsReviewed} Cards
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overallFlashcardMastery}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Spaced repetition algorithm active</span>
            <button
              onClick={() => onNavigate('flashcards')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>

      {/* 5. Weak Topics Section with Action Buttons */}
      <section aria-labelledby="section-weak-topics" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 id="section-weak-topics" className="text-base font-bold text-slate-900">
              Weak Topics & Revision Targets
            </h2>
          </div>
          <button
            onClick={() => onNavigate('weak-topics')}
            className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
          >
            View Weak Topics Hub <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {activeWeakTopics.length > 0 ? (
            activeWeakTopics.map((item) => {
              const performanceLabel =
                item.averageQuizScore !== null
                  ? `${item.averageQuizScore}% Quiz Score`
                  : item.flashcardMasteryPercent !== null
                  ? `${item.flashcardMasteryPercent}% Recall`
                  : 'Not tested yet';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.subjectName} ({item.subjectCode})
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.priority} Priority
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        • Performance: <strong className="text-slate-700">{performanceLabel}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {item.topic}
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      {item.reason || item.recommendedAction}
                    </p>
                  </div>

                  {/* 3 Action Buttons directly connected to existing features */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleStudyAction(item.subjectCode, item.topic)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Study this topic with AI Tutor"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Study Topic
                    </button>

                    <button
                      onClick={() => handleQuizAction(item.subjectCode, item.topic)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Practice diagnostic questions on this topic"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Practice Quiz
                    </button>

                    <button
                      onClick={() => handleFlashcardAction(item.subjectCode, item.topic)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Review flashcards for this topic"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      Review Flashcards
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No weak topics recorded.</p>
              <p>Keep studying to benchmark diagnostic accuracy.</p>
            </div>
          )}
        </div>
      </section>

      {/* 9. Exam Preparation & 6. Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9. Exam Preparation (6 cols) */}
        <div
          className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
          id="card-exam-preparation"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Exam Preparation</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Target Schedule</span>
          </div>

          <div className="space-y-3">
            {EXAM_SUBJECTS.map((subj) => {
              const countdown = getExamCountdown(subj.examDateIso);
              const IconComp = subj.icon;
              return (
                <div
                  key={subj.code}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${subj.badgeBg} ${subj.badgeText} flex items-center justify-center font-bold`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{subj.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Exam Date: <strong className="text-slate-700">{subj.examDateStr}</strong>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-extrabold px-2.5 py-1 rounded-md text-xs ${
                      countdown.isCompleted
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {countdown.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Recent Activity (6 cols) */}
        <div
          className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
          id="card-recent-activity"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Session History</span>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activities.map((act) => {
                const getIcon = () => {
                  if (act.type === 'quiz') return <Zap className="w-3.5 h-3.5 text-emerald-600" />;
                  if (act.type === 'flashcard') return <Layers className="w-3.5 h-3.5 text-violet-600" />;
                  if (act.type === 'tutor') return <Bot className="w-3.5 h-3.5 text-indigo-600" />;
                  if (act.type === 'notes') return <FileText className="w-3.5 h-3.5 text-blue-600" />;
                  return <BookMarked className="w-3.5 h-3.5 text-amber-600" />;
                };

                return (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {getIcon()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{act.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {act.subjectCode} • {act.timestamp}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shrink-0 shadow-2xs">
                      {act.scoreOrCount}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center my-auto space-y-2">
              <Clock className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                No activity yet. Start studying to see your progress here.
              </p>
              <p className="text-[11px] text-slate-400">
                Complete quizzes, review flashcards, generate notes, or ask the AI Tutor to log learning sessions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
