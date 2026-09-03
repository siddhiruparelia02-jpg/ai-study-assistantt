import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Sparkles,
  Bot,
  HelpCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Filter,
  Check,
  RefreshCw,
  Layers,
  FileQuestion,
  Lightbulb,
  Award,
  ChevronRight,
  Zap,
  TrendingDown,
  Info,
  RotateCcw,
} from 'lucide-react';
import { PageId, TopicStudyPerformance, TopicPriority } from '../types';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useSettings } from '../context/SettingsContext';

interface WeakTopicsProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  onStudyTopic: (subjectCode: string, topicName: string) => void;
  onAskMyNotes: (subjectCode: string, topicName: string) => void;
  onPracticeQuiz: (subjectCode: string, topicName: string) => void;
  onReviewFlashcards: (subjectCode: string, topicName: string) => void;
}

export const WeakTopics: React.FC<WeakTopicsProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigate,
  onStudyTopic,
  onAskMyNotes,
  onPracticeQuiz,
  onReviewFlashcards,
}) => {
  const {
    topicsPerformance,
    aiRecommendation,
    isLoadingRecommendation,
    fetchAiRecommendation,
    recordQuizAttempt,
    resetToInitialData,
    clearAllDataForTestingEmptyState,
  } = useStudyPerformance();

  const { subjects } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TopicPriority>('ALL');
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Filter topics based on active subject, priority, and search text
  const filteredTopics = topicsPerformance.filter((t) => {
    const matchSearch =
      t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subtopic && t.subtopic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSubject = selectedSubject === 'ALL' || t.subjectCode === selectedSubject;
    const matchPriority =
      priorityFilter === 'ALL'
        ? t.priority === 'HIGH' || t.priority === 'MEDIUM' || t.priority === 'LOW'
        : t.priority === priorityFilter;

    return matchSearch && matchSubject && matchPriority;
  });

  // Calculate high, medium, low counts
  const highPriorityCount = topicsPerformance.filter(
    (t) => t.priority === 'HIGH' && (selectedSubject === 'ALL' || t.subjectCode === selectedSubject)
  ).length;

  const mediumPriorityCount = topicsPerformance.filter(
    (t) => t.priority === 'MEDIUM' && (selectedSubject === 'ALL' || t.subjectCode === selectedSubject)
  ).length;

  const lowPriorityCount = topicsPerformance.filter(
    (t) => t.priority === 'LOW' && (selectedSubject === 'ALL' || t.subjectCode === selectedSubject)
  ).length;

  // Render Priority Badge
  const renderPriorityBadge = (priority: TopicPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            MEDIUM PRIORITY
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            LOW PRIORITY
          </span>
        );
      case 'INSUFFICIENT_DATA':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Info className="w-3 h-3 text-slate-400" />
            Not enough data yet
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner Alert */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Weak Topics & Adaptive Recommendations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {highPriorityCount > 0
              ? `${highPriorityCount} High Priority Weak Topics Identified`
              : 'Target Practice & Knowledge Diagnostics'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Continuously calculated from your quiz scores, error patterns, and flashcard review
            markers to focus your study time on high-impact areas.
          </p>
        </div>

        {/* Quick Diagnostic Actions */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => onNavigate('quiz')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <FileQuestion className="w-4 h-4" />
            <span>Practice Diagnostic Quiz</span>
          </button>
          <button
            onClick={() => onNavigate('flashcards')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Active Recall Drill</span>
          </button>
        </div>
      </div>

      {/* AI RECOMMENDATION SECTION: "Recommended Next Step" */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-indigo-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  AI Adaptive Study Advisor
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  Live Diagnostics
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Recommended Next Step
              </h3>
            </div>
          </div>

          <button
            onClick={() => fetchAiRecommendation(selectedSubject)}
            disabled={isLoadingRecommendation}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-100 hover:text-white border border-indigo-400/30 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingRecommendation ? 'animate-spin' : ''}`}
            />
            <span>Regenerate Recommendation</span>
          </button>
        </div>

        {isLoadingRecommendation ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-indigo-200">
              Analyzing quiz mistake patterns and flashcard mastery with Gemini AI...
            </p>
          </div>
        ) : aiRecommendation ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Guidance & Performance Root Cause */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300/90 mb-1">
                  Identified Focus Area
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {aiRecommendation.title}
                </h4>
              </div>

              {/* 1. What the student is struggling with */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wide">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>1. What you are struggling with</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {aiRecommendation.strugglingWith}
                </p>
              </div>

              {/* 2. Why it may be difficult based on performance data */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Why this is difficult (Based on Your Performance Data)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {aiRecommendation.whyDifficult}
                </p>
              </div>

              {/* 3. What the student should do next */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. What you should do next</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {aiRecommendation.whatToDoNext}
                </p>
              </div>
            </div>

            {/* Recommended Activity Card with Direct Action */}
            <div className="lg:col-span-4 bg-indigo-950/80 border border-indigo-400/30 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                    4. Practice Activity
                  </span>
                  {aiRecommendation.estimatedTimeMinutes && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-indigo-300" />
                      ~{aiRecommendation.estimatedTimeMinutes} mins
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white leading-snug">
                  {aiRecommendation.recommendedActivity}
                </div>

                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Complete this targeted action now to lift topic accuracy above 70%.
                </p>
              </div>

              {/* Action Buttons for AI Recommendation */}
              <div className="space-y-2 pt-3 border-t border-indigo-800/60">
                <button
                  onClick={() =>
                    onStudyTopic(aiRecommendation.primarySubject, aiRecommendation.primaryTopic)
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Ask AI Tutor to Explain</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onPracticeQuiz(aiRecommendation.primarySubject, aiRecommendation.primaryTopic)
                    }
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileQuestion className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Practice Quiz</span>
                  </button>
                  <button
                    onClick={() =>
                      onAskMyNotes(aiRecommendation.primarySubject, aiRecommendation.primaryTopic)
                    }
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Ask Notes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-300 text-xs">
            Complete a quiz or flashcard session to generate your personalized AI recommendation.
          </div>
        )}
      </div>

      {/* Summary Stat Pills & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-rose-600">{highPriorityCount}</div>
            <div className="text-xs font-bold text-slate-600">High Priority (Below 50%)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-amber-600">{mediumPriorityCount}</div>
            <div className="text-xs font-bold text-slate-600">Medium Priority (50–70%)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-600">{lowPriorityCount}</div>
            <div className="text-xs font-bold text-slate-600">Low Priority / Mastered (&gt;70%)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Subject Filter Pills, Priority Tabs, Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Subject:
          </span>
          <button
            onClick={() => onSelectSubject('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedSubject === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id || s.code}
              onClick={() => onSelectSubject(s.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubject === s.code
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {s.code} ({s.name})
            </button>
          ))}
        </div>

        {/* Priority Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Priority:
            </span>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  priorityFilter === p
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'ALL' ? 'All Priorities' : `${p} Priority`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search weak topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Discreet Testing Toolbar Trigger */}
            <button
              onClick={() => setShowSimulateModal((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
              title="Test Controls (Reset / Simulate)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Demo/Testing Controls Drawer */}
        {showSimulateModal && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Testing & Verification Helpers:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Simulate answering Java Inheritance questions correctly (e.g. 5 of 5)
                  recordQuizAttempt('JAVA', 'Inheritance & Polymorphism', 5, 5);
                  fetchAiRecommendation('JAVA');
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
              >
                Simulate 100% Java Quiz (Verify Progress Loop)
              </button>
              <button
                onClick={() => {
                  // Simulate answering Java Inheritance questions with mistakes (e.g. 1 of 5)
                  recordQuizAttempt('JAVA', 'Inheritance & Polymorphism', 1, 5, [
                    'Dynamic method dispatch vtable lookup',
                    'Constructor chaining with super()',
                  ]);
                  fetchAiRecommendation('JAVA');
                }}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-500 transition-colors"
              >
                Simulate Poor Java Quiz (Trigger Weak Topic)
              </button>
              <button
                onClick={resetToInitialData}
                className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
              >
                Reset Demo Data
              </button>
              <button
                onClick={clearAllDataForTestingEmptyState}
                className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
              >
                Test Empty State
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WEAK TOPICS LIST / TOPIC CARDS */}
      {filteredTopics.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900">
              You&apos;re doing great!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Complete a few quizzes and flashcard sessions to identify topics that need more practice.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('quiz')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              <span>Start a Practice Quiz</span>
            </button>
            <button
              onClick={() => onNavigate('flashcards')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Study Flashcards</span>
            </button>
            <button
              onClick={resetToInitialData}
              className="px-4 py-2.5 rounded-xl text-indigo-600 font-semibold text-xs hover:bg-indigo-50 transition-colors"
            >
              Restore Initial Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic) => {
            const isHigh = topic.priority === 'HIGH';
            const isMedium = topic.priority === 'MEDIUM';
            const isLow = topic.priority === 'LOW';

            return (
              <div
                key={topic.id}
                className={`bg-white rounded-3xl border p-6 shadow-xs transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 hover:shadow-md ${
                  isHigh
                    ? 'border-rose-300/80 bg-gradient-to-r from-rose-50/20 via-white to-white'
                    : isMedium
                    ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/20 via-white to-white'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Topic Metadata & Diagnostic Breakdown */}
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {topic.subjectCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {topic.subjectName}
                    </span>
                    {renderPriorityBadge(topic.priority)}
                    {topic.lastPracticed && (
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Practiced {topic.lastPracticed}
                      </span>
                    )}
                  </div>

                  {/* Topic Title */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {topic.topic}
                    </h3>
                    {topic.subtopic && (
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {topic.subtopic}
                      </div>
                    )}
                  </div>

                  {/* Main Reason Identified as Weak */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Diagnostic Assessment
                      </div>
                      <div className="text-xs text-slate-800 font-semibold leading-relaxed">
                        {topic.reason}
                      </div>
                    </div>
                  </div>

                  {/* Adaptive Recommendation */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-indigo-600 shrink-0">
                      Adaptive Recommendation:
                    </span>
                    <span className="text-slate-700 font-medium">{topic.recommendedAction}</span>
                  </div>

                  {/* Improvement Loop Indicator (if previous score exists or delta) */}
                  {topic.previousScorePercent !== null &&
                    topic.previousScorePercent !== undefined &&
                    topic.averageQuizScore !== null && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Progress Loop: Before {topic.previousScorePercent}% &rarr; Now{' '}
                          {topic.averageQuizScore}%
                          {topic.improvementDelta !== undefined && (
                            <span className="ml-1 text-emerald-700">
                              ({topic.improvementDelta >= 0 ? '+' : ''}
                              {topic.improvementDelta}% change)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                </div>

                {/* Score Stats & 4 Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Score & Mastery Metrics */}
                  <div className="flex items-center gap-4 text-left sm:text-right">
                    {/* Average Quiz Score */}
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div
                        className={`text-base font-black ${
                          topic.averageQuizScore === null
                            ? 'text-slate-400'
                            : topic.averageQuizScore < 50
                            ? 'text-rose-600'
                            : topic.averageQuizScore <= 70
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {topic.averageQuizScore !== null
                          ? `${topic.averageQuizScore}%`
                          : 'No data'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Quiz Score ({topic.quizAttempts} tries)
                      </div>
                    </div>

                    {/* Flashcard Mastery */}
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div
                        className={`text-base font-black ${
                          topic.flashcardMasteryPercent === null
                            ? 'text-slate-400'
                            : topic.flashcardMasteryPercent < 50
                            ? 'text-rose-600'
                            : topic.flashcardMasteryPercent <= 70
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {topic.flashcardMasteryPercent !== null
                          ? `${topic.flashcardMasteryPercent}%`
                          : 'No data'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Flashcard Mastery
                      </div>
                    </div>
                  </div>

                  {/* 4 Action Buttons as requested */}
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    {/* 1. Study Topic */}
                    <button
                      onClick={() => onStudyTopic(topic.subjectCode, topic.topic)}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      title="Open AI Tutor with this topic"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Study Topic</span>
                    </button>

                    {/* 2. Ask My Notes */}
                    <button
                      onClick={() => onAskMyNotes(topic.subjectCode, topic.topic)}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      title="Ask grounded questions from uploaded documents"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ask My Notes</span>
                    </button>

                    {/* 3. Practice Quiz */}
                    <button
                      onClick={() => onPracticeQuiz(topic.subjectCode, topic.topic)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      title="Take a practice quiz on this topic"
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                      <span>Practice Quiz</span>
                    </button>

                    {/* 4. Review Flashcards */}
                    <button
                      onClick={() => onReviewFlashcards(topic.subjectCode, topic.topic)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      title="Review flashcards for this topic"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Review Cards</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
