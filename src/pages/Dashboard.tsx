import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  HelpCircle,
  FolderUp,
  Flame,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Circle,
  Play,
  ArrowUpRight,
  TrendingUp,
  Brain,
  BookOpen,
  Cloud,
  CalendarDays,
  Settings as SettingsIcon,
} from 'lucide-react';
import { PageId, Subject } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  onSelectSubject: (subjectCode: string) => void;
  onOpenUploadModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onSelectSubject,
  onOpenUploadModal,
}) => {
  const { user } = useAuth();
  const { profile, subjects, upcomingExams, targetExamDays, targetExamSubject } = useSettings();
  const {
    topicsPerformance,
    quizHistory,
    flashcardHistory,
    activities,
    studySessionsCount,
    isLoadingFirestore,
  } = useStudyPerformance();

  const [completedTasks, setCompletedTasks] = useState<string[]>(['task-1']);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Authenticated user greeting from SettingsContext (Single Source of Truth)
  const userGreetingName = profile?.displayName || user?.displayName || 'Student';
  const collegeInfo = profile?.college || 'K. P. B. Hinduja College of Commerce (YCMOU)';
  const semesterInfo = profile?.semester || 'SYBCA • Semester 4';
  const degreeInfo = profile?.academic?.degree || 'BCA (Bachelor of Computer Applications)';

  // Compute live real metrics from Firestore performance context
  const totalQuizzes = quizHistory.length;
  const avgQuizScore =
    totalQuizzes > 0
      ? Math.round(quizHistory.reduce((acc, q) => acc + q.scorePercent, 0) / totalQuizzes)
      : null;
  const totalCardsMastered = flashcardHistory.reduce((acc, f) => acc + f.masteredCount, 0);
  const totalCardsReviewed = flashcardHistory.reduce((acc, f) => acc + f.totalReviewed, 0);
  const calculatedStudyHours = Math.max(
    0,
    +(studySessionsCount * 0.4 + (quizHistory.length * 0.2) + (flashcardHistory.length * 0.15)).toFixed(1)
  );

  const activeWeakTopics = topicsPerformance.filter(
    (t) => (t.priority === 'HIGH' || t.priority === 'MEDIUM') && (t.quizAttempts > 0 || t.flashcardsReviewed > 0)
  );

  const firstSubjectCode = subjects[0]?.code || 'ADV-JAVA';

  const todayTasks = [
    {
      id: 'task-1',
      title: `Review flashcards on ${subjects[0]?.name || 'Core Architecture'}`,
      type: 'flashcard',
      page: 'flashcards' as PageId,
      timeEst: '10 min',
      subject: firstSubjectCode,
    },
    {
      id: 'task-2',
      title: `Practice diagnostic questions on ${subjects[1]?.name || 'System Fundamentals'}`,
      type: 'quiz',
      page: 'quiz' as PageId,
      timeEst: '15 min',
      subject: subjects[1]?.code || 'LINUX',
    },
    {
      id: 'task-3',
      title: `Ask AI Tutor to clarify key exam topics in ${firstSubjectCode}`,
      type: 'tutor',
      page: 'tutor' as PageId,
      timeEst: '12 min',
      subject: firstSubjectCode,
    },
    {
      id: 'task-4',
      title: `Read AI Summary Note: ${subjects[2]?.name || 'E-Commerce Infrastructure'}`,
      type: 'notes',
      page: 'notes' as PageId,
      timeEst: '8 min',
      subject: subjects[2]?.code || 'ECOM',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {userGreetingName}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Firestore Sync Active
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            {semesterInfo} • {degreeInfo} • {collegeInfo}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('settings')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            title="Manage Academic Settings"
          >
            <SettingsIcon className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={() => {
              onSelectSubject(firstSubjectCode);
              onNavigate('quiz');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer hover:translate-y-[-1px] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Study Session</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">Study Hours</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 text-slate-900">
            {calculatedStudyHours}{' '}
            <span className="text-sm font-normal text-slate-400">/ 30 hrs goal</span>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((calculatedStudyHours / 30) * 100))}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">Cards Mastered</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 text-slate-900">
            {totalCardsMastered}{' '}
            <span className="text-sm font-normal text-slate-400">
              cards ({totalCardsReviewed} reviewed)
            </span>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{
                width: `${
                  totalCardsReviewed > 0
                    ? Math.round((totalCardsMastered / totalCardsReviewed) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">Avg. Quiz Score</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 text-slate-900 flex items-baseline gap-2">
            {avgQuizScore === null ? (
              <span className="text-lg font-semibold text-slate-600">No quiz data yet</span>
            ) : (
              <>
                <span>{avgQuizScore}%</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {totalQuizzes} {totalQuizzes === 1 ? 'quiz' : 'quizzes'}
                </span>
              </>
            )}
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${avgQuizScore ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Current Subjects & Smart Study Plan */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Subjects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Current Subjects</h2>
              <button
                onClick={() => onNavigate('subjects')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subj) => (
                <div
                  key={subj.id || subj.code}
                  onClick={() => {
                    onSelectSubject(subj.code);
                    onNavigate('subjects');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-sm">
                      {subj.code.slice(0, 3)}
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {subj.daysUntilExam ?? 30}d to Exam
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors truncate">
                    {subj.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {subj.materialsCount ?? 2} materials • {subj.weakTopicsCount ?? 1} weak topics
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${subj.progressPercent ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {subj.progressPercent ?? 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Smart Study Plan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Today's Smart Study Plan</h3>
                  <p className="text-xs text-slate-500">Adaptive priorities based on upcoming exam dates</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {completedTasks.length} / {todayTasks.length} Done
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {todayTasks.map((task) => {
                const isDone = completedTasks.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className={`py-3.5 flex items-center justify-between gap-3 transition-opacity ${
                      isDone ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none shrink-0 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-600">{task.subject}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.timeEst}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectSubject(task.subject);
                        onNavigate(task.page);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isDone ? 'Review' : 'Start'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need an exam-calibrated schedule?</span>
              <button
                onClick={() => onNavigate('planner')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Open Full Adaptive Planner</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Weak Topics Card & Quick AI Actions */}
        <div className="space-y-6">
          {/* Weak Topics Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span>Weak Topics</span>
                {activeWeakTopics.length > 0 ? (
                  <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md ml-2 font-medium">
                    Needs Attention
                  </span>
                ) : (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md ml-2 font-medium">
                    All Clear
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('weak-topics')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                All
              </button>
            </h2>

            <div className="space-y-4">
              {activeWeakTopics.slice(0, 3).map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-3 text-sm pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        topic.priority === 'HIGH'
                          ? 'bg-rose-500'
                          : topic.priority === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{topic.topic}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {topic.subjectCode} • {topic.averageQuizScore !== null ? `${topic.averageQuizScore}% Accuracy` : 'No quiz attempts'} • Status: {topic.status}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectSubject(topic.subjectCode);
                      onNavigate('weak-topics');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 cursor-pointer"
                  >
                    Revise
                  </button>
                </div>
              ))}
              {activeWeakTopics.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  No weak topics identified yet. Complete quizzes to identify areas for improvement.
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('weak-topics')}
              className="w-full mt-5 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
            >
              + Generate Revision Plan
            </button>
          </div>

          {/* Quick AI Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Quick AI Actions</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigate('ask-notes')}
                className="p-3 bg-white hover:bg-indigo-600 hover:text-white text-left rounded-xl border border-indigo-100/80 shadow-2xs group transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-white/20 text-indigo-600 group-hover:text-white flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-white">
                  Ask My Notes
                </div>
                <div className="text-[10px] text-slate-500 group-hover:text-indigo-100 mt-0.5">
                  Grounded Q&A
                </div>
              </button>

              <button
                onClick={() => onNavigate('tutor')}
                className="p-3 bg-white hover:bg-indigo-600 hover:text-white text-left rounded-xl border border-indigo-100/80 shadow-2xs group transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-white/20 text-indigo-600 group-hover:text-white flex items-center justify-center mb-2">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-white">
                  Ask AI Tutor
                </div>
                <div className="text-[10px] text-slate-500 group-hover:text-indigo-100 mt-0.5">
                  Concept help
                </div>
              </button>

              <button
                onClick={() => onNavigate('quiz')}
                className="p-3 bg-white hover:bg-indigo-600 hover:text-white text-left rounded-xl border border-indigo-100/80 shadow-2xs group transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 group-hover:bg-white/20 text-emerald-600 group-hover:text-white flex items-center justify-center mb-2">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-white">
                  Quick Quiz
                </div>
                <div className="text-[10px] text-slate-500 group-hover:text-indigo-100 mt-0.5">
                  Diagnostic test
                </div>
              </button>

              <button
                onClick={() => onNavigate('flashcards')}
                className="p-3 bg-white hover:bg-indigo-600 hover:text-white text-left rounded-xl border border-indigo-100/80 shadow-2xs group transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 group-hover:bg-white/20 text-amber-600 group-hover:text-white flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-white">
                  Flashcards
                </div>
                <div className="text-[10px] text-slate-500 group-hover:text-indigo-100 mt-0.5">
                  Spaced recall
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
