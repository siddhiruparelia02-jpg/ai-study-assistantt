import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  Bot,
  HelpCircle,
  Layers,
  FileText,
  FolderArchive,
  Check,
  Calendar,
  Flame,
  Zap,
  Coffee,
  Info,
  Loader2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  PageId,
  StudyPlan,
  PlannerPreferences,
  PlannerTask,
  PlannerDayPlan,
  Subject,
  StudyMaterial,
  PrioritySubjectInfo,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useStudyPerformance } from '../context/PerformanceContext';
import {
  savePlannerPreferencesToFirestore,
  loadPlannerPreferencesFromFirestore,
  saveStudyPlanToFirestore,
  loadCurrentStudyPlanFromFirestore,
  updatePlannerTaskStatusInFirestore,
  isFirestoreReady,
} from '../lib/firebase';

interface StudyPlannerProps {
  onNavigate: (page: PageId) => void;
  onOpenTutor?: (subjectCode: string, topic?: string) => void;
  onOpenQuiz?: (subjectCode: string, topic?: string) => void;
  onOpenFlashcards?: (subjectCode: string) => void;
  onOpenNotes?: (subjectCode: string) => void;
  onOpenMaterials?: (subjectCode: string) => void;
  materials?: StudyMaterial[];
  subjects?: Subject[];
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  onNavigate,
  onOpenTutor,
  onOpenQuiz,
  onOpenFlashcards,
  onOpenNotes,
  onOpenMaterials,
  materials = [],
  subjects: propSubjects,
}) => {
  const { user } = useAuth();
  const { subjects: contextSubjects, profile } = useSettings();
  const {
    topicsPerformance,
    quizHistory,
    flashcardHistory,
    activities,
    addActivity,
  } = useStudyPerformance();

  const subjectsList = useMemo(() => {
    if (propSubjects && propSubjects.length > 0) return propSubjects;
    if (contextSubjects && contextSubjects.length > 0) return contextSubjects;
    return [];
  }, [propSubjects, contextSubjects]);

  // Default initial preferences aligned with student settings
  const defaultPreferences: PlannerPreferences = useMemo(() => {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    return {
      dailyStudyMinutes: profile?.studyPreferences?.dailyStudyMinutes || 120,
      sessionLengthMinutes: profile?.studyPreferences?.sessionLengthMinutes || 45,
      studyDays: profile?.studyPreferences?.studyDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      startDate: today.toISOString().split('T')[0],
      endDate: twoWeeksLater.toISOString().split('T')[0],
      targetSubject: 'ALL',
    };
  }, [profile]);

  const [preferences, setPreferences] = useState<PlannerPreferences>(defaultPreferences);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  // Load preferences and active plan from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user?.uid || !isFirestoreReady()) {
        setIsLoadingPlan(false);
        return;
      }

      try {
        setIsLoadingPlan(true);
        const [savedPrefs, savedPlan] = await Promise.all([
          loadPlannerPreferencesFromFirestore(user.uid),
          loadCurrentStudyPlanFromFirestore(user.uid),
        ]);

        if (isMounted) {
          if (savedPrefs) {
            setPreferences(savedPrefs);
          }
          if (savedPlan) {
            setCurrentPlan(savedPlan);
            if (savedPlan.days && savedPlan.days.length > 0) {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayDay = savedPlan.days.find((d) => d.date === todayStr);
              setSelectedDayTab(todayDay ? todayDay.date : savedPlan.days[0].date);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading planner data from Firestore:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPlan(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Handle Preference Change and auto-save to Firestore
  const handlePreferenceChange = (updated: Partial<PlannerPreferences>) => {
    const newPrefs = { ...preferences, ...updated };
    setPreferences(newPrefs);
    if (user?.uid && isFirestoreReady()) {
      savePlannerPreferencesToFirestore(newPrefs, user.uid).catch((err) =>
        console.warn('Error saving planner preferences:', err)
      );
    }
  };

  const toggleStudyDay = (dayAbbr: string) => {
    const currentDays = preferences.studyDays || [];
    let updatedDays: string[];
    if (currentDays.includes(dayAbbr)) {
      if (currentDays.length === 1) return; // Keep at least 1 day
      updatedDays = currentDays.filter((d) => d !== dayAbbr);
    } else {
      updatedDays = [...currentDays, dayAbbr];
    }
    handlePreferenceChange({ studyDays: updatedDays });
  };

  // Generate / Regenerate Plan via backend API
  const handleGeneratePlan = async (isRegen = false) => {
    if (isRegen) {
      setIsRegenerating(true);
    } else {
      setIsGenerating(true);
    }
    setErrorNotice(null);

    try {
      // Gather real performance and academic context
      const payload = {
        preferences,
        subjects: subjectsList.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          examDate: s.examDate,
          progressPercent: s.progressPercent,
          totalChapters: s.totalChapters,
          completedChapters: s.completedChapters,
          topics: s.topics,
        })),
        weakTopics: topicsPerformance.map((w) => ({
          id: w.id,
          topic: w.topic,
          subtopic: w.subtopic,
          subjectCode: w.subjectCode,
          subjectName: w.subjectName,
          quizAttempts: w.quizAttempts,
          averageQuizScore: w.averageQuizScore,
          flashcardMasteryPercent: w.flashcardMasteryPercent,
          priority: w.priority,
          reason: w.reason,
        })),
        quizHistory: quizHistory.map((q) => ({
          quizTitle: q.quizTitle,
          subjectCode: q.subjectCode,
          topicName: q.topicName,
          scorePercent: q.scorePercent,
          date: q.date,
        })),
        flashcardMastery: flashcardHistory.map((f) => ({
          deckTitle: f.deckTitle,
          subjectCode: f.subjectCode,
          topicName: f.topicName,
          masteryPercent: f.masteryPercent,
        })),
        recentActivity: activities.slice(0, 10),
        userMaterials: materials.map((m) => ({
          title: m.title,
          subjectCode: m.subjectCode,
          topic: m.topic,
        })),
        userId: user?.uid || 'user',
      };

      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate study plan');
      }

      const newPlan: StudyPlan = result.data;
      setCurrentPlan(newPlan);

      if (newPlan.days && newPlan.days.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDay = newPlan.days.find((d) => d.date === todayStr);
        setSelectedDayTab(todayDay ? todayDay.date : newPlan.days[0].date);
      }

      // Persist to Firestore
      if (user?.uid && isFirestoreReady()) {
        await saveStudyPlanToFirestore(newPlan, user.uid);
      }

      // Add recent activity item
      addActivity({
        type: 'material',
        title: isRegen ? 'Study Plan Regenerated & Adapted' : 'New Study Plan Generated',
        subjectCode: 'PLANNER',
        scoreOrCount: `${newPlan.days.length} Days`,
      });
    } catch (err: any) {
      console.error('Error generating study plan:', err);
      setErrorNotice('Could not generate plan. Please verify your connection and try again.');
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!currentPlan) return;

    const newCompleted = !currentCompleted;

    // Optimistically update local state
    let targetTask: PlannerTask | undefined;
    const updatedDays = currentPlan.days.map((day) => {
      return {
        ...day,
        tasks: day.tasks.map((task) => {
          if (task.id === taskId) {
            targetTask = { ...task, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : undefined };
            return targetTask;
          }
          return task;
        }),
      };
    });

    let completedCount = 0;
    let totalCount = 0;
    updatedDays.forEach((day) => {
      day.tasks.forEach((t) => {
        if (!t.isBreak) {
          totalCount++;
          if (t.completed) completedCount++;
        }
      });
    });

    const updatedPlan: StudyPlan = {
      ...currentPlan,
      days: updatedDays,
      completedTasksCount: completedCount,
      totalTasksCount: totalCount > 0 ? totalCount : currentPlan.totalTasksCount,
    };

    setCurrentPlan(updatedPlan);

    // Save to Firestore
    if (user?.uid && isFirestoreReady()) {
      await updatePlannerTaskStatusInFirestore(currentPlan, taskId, newCompleted, user.uid);
    }

    // Add activity record if completed
    if (newCompleted && targetTask && !targetTask.isBreak) {
      addActivity({
        type: 'material',
        title: `Completed Study Task: ${targetTask.topic}`,
        subjectCode: targetTask.subjectCode,
        scoreOrCount: `${targetTask.durationMinutes}m`,
      });
    }
  };

  // Start Task Action -> Route to existing feature
  const handleStartTask = (task: PlannerTask) => {
    if (task.isBreak) return;

    const action = task.targetAction || 'tutor';
    switch (action) {
      case 'tutor':
        if (onOpenTutor) {
          onOpenTutor(task.subjectCode, task.topic);
        } else {
          onNavigate('tutor');
        }
        break;
      case 'quiz':
        if (onOpenQuiz) {
          onOpenQuiz(task.subjectCode, task.topic);
        } else {
          onNavigate('quiz');
        }
        break;
      case 'flashcards':
        if (onOpenFlashcards) {
          onOpenFlashcards(task.subjectCode);
        } else {
          onNavigate('flashcards');
        }
        break;
      case 'notes':
        if (onOpenNotes) {
          onOpenNotes(task.subjectCode);
        } else {
          onNavigate('notes');
        }
        break;
      case 'materials':
        if (onOpenMaterials) {
          onOpenMaterials(task.subjectCode);
        } else {
          onNavigate('materials');
        }
        break;
      default:
        onNavigate('tutor');
        break;
    }
  };

  // Calculate Today's Tasks
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPlan = useMemo(() => {
    if (!currentPlan || !currentPlan.days) return null;
    return currentPlan.days.find((d) => d.date === todayStr) || currentPlan.days[0] || null;
  }, [currentPlan, todayStr]);

  const activeDayPlan = useMemo(() => {
    if (!currentPlan || !currentPlan.days) return null;
    if (!selectedDayTab) return todayPlan || currentPlan.days[0];
    return currentPlan.days.find((d) => d.date === selectedDayTab) || todayPlan || currentPlan.days[0];
  }, [currentPlan, selectedDayTab, todayPlan]);

  // Overall Plan Progress Stats
  const planProgressPercent = useMemo(() => {
    if (!currentPlan || currentPlan.totalTasksCount === 0) return 0;
    return Math.round((currentPlan.completedTasksCount / currentPlan.totalTasksCount) * 100);
  }, [currentPlan]);

  // Study Streak calculation from real activities
  const currentStreakDays = useMemo(() => {
    if (!activities || activities.length === 0) return 1;
    // Calculate distinct dates active
    const distinctDates = new Set(
      activities
        .map((a) => a.timestamp?.split('T')[0])
        .filter(Boolean)
    );
    return Math.max(1, distinctDates.size);
  }, [activities]);

  // Activity type icon and color helper
  const getActivityMeta = (type: string, isBreak?: boolean) => {
    if (isBreak || type === 'Break') {
      return {
        icon: Coffee,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        badge: 'Break',
      };
    }
    switch (type) {
      case 'AI Tutor':
        return {
          icon: Bot,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badge: 'AI Tutor',
        };
      case 'Practice Quiz':
      case 'Mock Test':
        return {
          icon: HelpCircle,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badge: 'Practice Quiz',
        };
      case 'Flashcards':
        return {
          icon: Layers,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badge: 'Flashcards',
        };
      case 'Notes':
        return {
          icon: FileText,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badge: 'AI Notes',
        };
      case 'Study Material Review':
      case 'Learn':
      case 'Review':
      default:
        return {
          icon: BookOpen,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          badge: 'Study Material',
        };
    }
  };

  const allStudyDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Adaptive Study Planner
            </span>
            {currentPlan && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {currentPlan.completedTasksCount}/{currentPlan.totalTasksCount} Tasks Completed ({planProgressPercent}%)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Your Study Plan
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            An adaptive plan built around your exams, performance, and weak topics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Preferences</span>
            {showConfig ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {currentPlan ? (
            <button
              onClick={() => handleGeneratePlan(true)}
              disabled={isRegenerating || isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adapting Plan...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Regenerate Plan
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleGeneratePlan(false)}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate My Study Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            className="text-xs font-semibold text-rose-700 underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Preferences / Setup Configurator Card */}
      {showConfig && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Study Constraints & Time Budget</h3>
            </div>
            <span className="text-xs text-slate-500">Auto-saved to your account</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Study Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Daily Study Time
              </label>
              <select
                value={preferences.dailyStudyMinutes}
                onChange={(e) => handlePreferenceChange({ dailyStudyMinutes: Number(e.target.value) })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={45}>45 minutes / day</option>
                <option value={60}>1 hour / day</option>
                <option value={90}>1.5 hours / day</option>
                <option value={120}>2 hours / day (Default)</option>
                <option value={180}>3 hours / day</option>
                <option value={240}>4 hours / day</option>
              </select>
            </div>

            {/* Session Length */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-slate-500" />
                Session Focus Length
              </label>
              <select
                value={preferences.sessionLengthMinutes}
                onChange={(e) => handlePreferenceChange({ sessionLengthMinutes: Number(e.target.value) })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={25}>25 min (Pomodoro)</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min (Recommended)</option>
                <option value={60}>60 min</option>
              </select>
            </div>

            {/* Planning Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Start Date
              </label>
              <input
                type="date"
                value={preferences.startDate}
                onChange={(e) => handlePreferenceChange({ startDate: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Planning End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                End Date
              </label>
              <input
                type="date"
                value={preferences.endDate}
                onChange={(e) => handlePreferenceChange({ endDate: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Preferred Study Days */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Preferred Study Days</label>
            <div className="flex flex-wrap gap-2">
              {allStudyDays.map((day) => {
                const isSelected = preferences.studyDays?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleStudyDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Study Streak</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{currentStreakDays} Days</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Active consistency</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Target Exam</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {subjectsList[0]?.daysUntilExam ? `${subjectsList[0].daysUntilExam}d` : 'Jan 3'}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{subjectsList[0]?.name || 'Advance Java'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Priority Topics</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {topicsPerformance.filter((t) => t.priority === 'HIGH').length || 4}
          </p>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">High exam impact</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Plan Completion</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{planProgressPercent}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {currentPlan?.completedTasksCount || 0} of {currentPlan?.totalTasksCount || 0} tasks done
          </p>
        </div>
      </div>

      {/* TODAY'S PLAN VIEW (Prominently featured at the top) */}
      {currentPlan && todayPlan && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  Today's Recommended Tasks
                </span>
                <span className="text-xs text-indigo-200/80 font-medium">
                  {todayPlan.dayName} • {todayPlan.totalMinutes} min planned
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Today's Focus
              </h2>
              {todayPlan.summary && (
                <p className="text-xs text-indigo-100/70 mt-0.5">{todayPlan.summary}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-indigo-200">
                {todayPlan.tasks.filter((t) => t.completed && !t.isBreak).length} of{' '}
                {todayPlan.tasks.filter((t) => !t.isBreak).length} Completed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayPlan.tasks.map((task) => {
              const meta = getActivityMeta(task.activityType, task.isBreak);
              const Icon = meta.icon;

              if (task.isBreak) {
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-indigo-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-amber-200">{task.topic}</span>
                        <p className="text-[11px] text-indigo-200/70">{task.reason}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-amber-300/90 font-semibold shrink-0">
                      {task.durationMinutes}m
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    task.completed
                      ? 'bg-white/5 border-emerald-500/30 opacity-75'
                      : 'bg-white/10 border-white/15 hover:bg-white/[0.13]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                          {task.subjectCode}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-200/90">
                          <Icon className="w-3 h-3 text-indigo-300" />
                          {task.activityType}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-white/5 px-2 py-0.5 rounded">
                        {task.durationMinutes}m
                      </span>
                    </div>

                    <h4
                      className={`font-semibold text-sm leading-snug ${
                        task.completed ? 'line-through text-slate-300' : 'text-white'
                      }`}
                    >
                      {task.topic}
                    </h4>

                    <p className="text-xs text-indigo-100/70 line-clamp-2">{task.reason}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        task.completed
                          ? 'text-emerald-300 bg-emerald-900/40 border border-emerald-500/30'
                          : 'text-indigo-200 hover:text-white bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {task.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-indigo-300" />
                          Mark Complete
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleStartTask(task)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg shadow-xs transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Start
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adaptive Insights & Exam Priority Breakdown */}
      {currentPlan && currentPlan.prioritySubjects && currentPlan.prioritySubjects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority Subjects List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Exam Priority Ranking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked using closest exam proximity, weak topic counts, and quiz performance.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {currentPlan.prioritySubjects.map((ps: PrioritySubjectInfo) => {
                const isUrgent = ps.priorityLevel === 'Urgent';
                const isHigh = ps.priorityLevel === 'High';

                return (
                  <div
                    key={ps.subjectCode}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isUrgent
                        ? 'bg-rose-50/50 border-rose-200'
                        : isHigh
                        ? 'bg-indigo-50/40 border-indigo-100'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isUrgent
                              ? 'bg-rose-600 text-white'
                              : isHigh
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{ps.priorityRank}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{ps.subjectName}</span>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              {ps.subjectCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{ps.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs shrink-0 font-medium">
                        {ps.isExamPassed ? (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Exam Passed</span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-800'
                                : isHigh
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Exam in {ps.daysUntilExam}d ({ps.examDate})
                          </span>
                        )}
                        {ps.avgQuizAccuracy !== null && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md">
                            Quiz: {ps.avgQuizAccuracy}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adaptation Insights */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Adaptive AI Insights
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How this schedule dynamically adjusted to your performance.
              </p>
            </div>

            <div className="space-y-2.5">
              {currentPlan.adaptationInsights && currentPlan.adaptationInsights.length > 0 ? (
                currentPlan.adaptationInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 leading-relaxed flex items-start gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                  Plan adapts automatically as you complete quizzes, flashcard sessions, and study materials.
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-800">Adaptive Feedback Loop:</span>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Higher quiz scores automatically de-escalate basic review priority.</li>
                <li>Upcoming exams (&lt;14 days) trigger mock tests &amp; spaced recall.</li>
                <li>Weak topics receive targeted AI Tutor breakdowns.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FULL CALENDAR / DAY-BY-DAY SCHEDULE */}
      {currentPlan && currentPlan.days && currentPlan.days.length > 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Study Calendar &amp; Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a day to inspect recommended sessions, topics, and duration.
              </p>
            </div>

            {/* Subject Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter Subject:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} ({s.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days Tabs Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {currentPlan.days.map((day) => {
              const isSelected = selectedDayTab === day.date;
              const isToday = day.date === todayStr;
              const completedInDay = day.tasks.filter((t) => t.completed && !t.isBreak).length;
              const totalInDay = day.tasks.filter((t) => !t.isBreak).length;

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDayTab(day.date)}
                  className={`px-3.5 py-2.5 rounded-xl border text-left shrink-0 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{day.dayName.split(',')[0]}</span>
                    {isToday && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {day.date.slice(5)} • {completedInDay}/{totalInDay} Done
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Selected Day Content */}
          {activeDayPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-sm">{activeDayPlan.dayName}</span>
                  <span className="text-xs text-slate-500 font-medium">({activeDayPlan.totalMinutes} min total)</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Priority: {activeDayPlan.priority}
                </span>
              </div>

              <div className="space-y-3">
                {activeDayPlan.tasks
                  .filter((task) => selectedSubjectFilter === 'ALL' || task.subjectCode === selectedSubjectFilter || task.isBreak)
                  .map((task) => {
                    const meta = getActivityMeta(task.activityType, task.isBreak);
                    const Icon = meta.icon;

                    if (task.isBreak) {
                      return (
                        <div
                          key={task.id}
                          className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900"
                        >
                          <div className="flex items-center gap-2.5">
                            <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                            <div>
                              <span className="font-bold">{task.topic}</span>
                              <span className="text-amber-700/80 ml-2">{task.reason}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-amber-700">{task.durationMinutes}m</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all ${
                          task.completed
                            ? 'bg-slate-50/80 border-slate-200 opacity-70'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {task.subjectCode}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${meta.color}`}>
                                <Icon className="w-3 h-3" />
                                {task.activityType}
                              </span>
                              <span className="font-mono text-xs font-semibold text-slate-500">
                                {task.durationMinutes} min
                              </span>
                            </div>

                            <h4 className={`font-semibold text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {task.topic}
                            </h4>

                            <p className="text-xs text-slate-600">{task.reason}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleToggleTask(task.id, task.completed)}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                task.completed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              {task.completed ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                                  Mark Complete
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleStartTask(task)}
                              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              Start
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : !isLoadingPlan ? (
        /* Empty State */
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-2xl mx-auto space-y-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <CalendarDays className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Let's build your first study plan.</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We'll generate an adaptive study schedule using your actual subjects, upcoming exam dates, and daily study availability. As you take quizzes and study flashcards, the planner will automatically recalibrate around your weak topics.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Your planner will calibrate from:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>{subjectsList.length} Active Subjects</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Exam: Jan 3, 2027</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>{preferences.dailyStudyMinutes / 60}h Daily Study Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>{topicsPerformance.filter((t) => t.priority === 'HIGH').length} High Priority Topics</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleGeneratePlan(false)}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Your Adaptive Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate My Study Plan
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Loading your study plan...</span>
        </div>
      )}
    </div>
  );
};
