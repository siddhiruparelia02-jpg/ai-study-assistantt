import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  Plus,
  Play,
  X,
  Loader2,
  GraduationCap,
  Layers,
  Check,
  RefreshCw,
  Sliders,
  FileQuestion,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { Quiz, QuizQuestion, PageId } from '../types';
import { mockQuizzes } from '../data/mockData';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useSettings } from '../context/SettingsContext';

interface QuizProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  onStudyWeakTopic?: (subjectCode: string, topicName: string) => void;
  initialTopic?: string;
  onClearInitialTopic?: () => void;
}

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';
export type QuizQuestionType = 'Multiple Choice' | 'True/False' | 'Mixed';

interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  percentage: number;
  priority: 'High' | 'Medium' | 'Low';
}

export const QuizPage: React.FC<QuizProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigate,
  onStudyWeakTopic,
  initialTopic,
  onClearInitialTopic,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [qIndex: number]: number }>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(900); // 15 min default
  const [isGenerateQuizModalOpen, setIsGenerateQuizModalOpen] = useState(false);

  // Performance recording context
  const { recordQuizAttempt } = useStudyPerformance();
  const { subjects } = useSettings();
  const recordedSessionKeyRef = useRef<string | null>(null);

  // AI Quiz Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Form fields
  const [genSubject, setGenSubject] = useState(
    selectedSubject === 'ALL' ? 'Java Programming' : selectedSubject
  );
  const [genTopic, setGenTopic] = useState('Core Fundamentals & Syntax');
  const [genDifficulty, setGenDifficulty] = useState<QuizDifficulty>('Medium');
  const [genCount, setGenCount] = useState<number>(5);
  const [genType, setGenType] = useState<QuizQuestionType>('Multiple Choice');

  // Filtered hub quizzes
  const filteredQuizzes = quizzes.filter(
    (q) => selectedSubject === 'ALL' || q.subjectCode === selectedSubject
  );

  const reviewSectionRef = useRef<HTMLDivElement>(null);

  // Update genSubject when selectedSubject prop changes
  useEffect(() => {
    if (selectedSubject !== 'ALL') {
      const found = subjects.find((s) => s.code === selectedSubject);
      setGenSubject(found ? `${found.code} - ${found.name}` : selectedSubject);
    }
  }, [selectedSubject, subjects]);

  // Handle incoming topic from AI Notes or Study Materials
  useEffect(() => {
    if (initialTopic) {
      setGenTopic(initialTopic);
      setIsGenerateQuizModalOpen(true);
      if (onClearInitialTopic) {
        onClearInitialTopic();
      }
    }
  }, [initialTopic, onClearInitialTopic]);

  // Loading animation step timer
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev + 1) % 3);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Timer countdown for active quiz
  useEffect(() => {
    if (!activeQuiz || isQuizCompleted) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, isQuizCompleted]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setIsQuizCompleted(false);
    setTimeLeftSeconds((quiz.questions.length || 5) * 120); // 2 minutes per question
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitQuestionAnswer = () => {
    if (selectedOption === null) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: selectedOption }));
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const prevAnswer = userAnswers[nextIdx];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      setIsAnswerSubmitted(prevAnswer !== undefined);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      const prevAnswer = userAnswers[prevIdx];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      setIsAnswerSubmitted(prevAnswer !== undefined);
    }
  };

  const handleFinishQuiz = () => {
    setIsQuizCompleted(true);
  };

  const handleRetryCurrentQuiz = () => {
    if (!activeQuiz) return;
    handleStartQuiz(activeQuiz);
  };

  // Generate Quiz via Gemini Server-Side API
  const handleGenerateAiQuiz = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: genSubject,
          topic: genTopic,
          difficulty: genDifficulty,
          questionCount: genCount,
          questionType: genType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const resData = await response.json();
      const generatedQuizData = resData.data;

      if (!generatedQuizData || !Array.isArray(generatedQuizData.questions) || generatedQuizData.questions.length === 0) {
        throw new Error('Received empty question set from Gemini API');
      }

      const newQuiz: Quiz = {
        id: `ai-quiz-${Date.now()}`,
        title: generatedQuizData.title || `${genSubject}: ${genTopic} (${genDifficulty})`,
        subjectId: 'ai-gen',
        subjectCode: genSubject.includes(' - ') ? genSubject.split(' - ')[0] : genSubject.slice(0, 8).toUpperCase(),
        durationMinutes: genCount * 2,
        questionsCount: generatedQuizData.questions.length,
        difficulty:
          genDifficulty === 'Hard'
            ? 'Exam Standard'
            : genDifficulty === 'Medium'
            ? 'Intermediate'
            : 'Beginner',
        timesTaken: 0,
        questions: generatedQuizData.questions.map((q: any, idx: number) => ({
          id: q.id || `gen-q-${idx + 1}`,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: q.correctAnswerIndex ?? 0,
          explanation: q.explanation || 'Detailed academic explanation for this concept.',
          topic: q.topic || genTopic,
          subjectCode: genSubject,
          difficulty: genDifficulty,
        })),
      };

      setQuizzes([newQuiz, ...quizzes]);
      setIsGenerateQuizModalOpen(false);
      handleStartQuiz(newQuiz);
    } catch (err: any) {
      console.error('Failed to generate quiz:', err);
      setGenerateError(
        err.message || 'Unable to generate quiz. Please check server configuration and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Comprehensive Results & Topic Performance Calculation
  const calculateResults = () => {
    if (!activeQuiz) {
      return {
        correctCount: 0,
        incorrectCount: 0,
        total: 0,
        percentage: 0,
        topicPerformance: [] as TopicPerformance[],
        wrongQuestions: [] as { question: QuizQuestion; userAnswerIndex: number | undefined; questionNumber: number }[],
        weakestTopic: null as TopicPerformance | null,
      };
    }

    let correct = 0;
    let incorrect = 0;
    const topicMap: { [topic: string]: { total: number; correct: number } } = {};
    const wrongQuestions: { question: QuizQuestion; userAnswerIndex: number | undefined; questionNumber: number }[] = [];

    activeQuiz.questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const topicName = q.topic || 'General Topic';

      if (!topicMap[topicName]) {
        topicMap[topicName] = { total: 0, correct: 0 };
      }
      topicMap[topicName].total += 1;

      if (userAns === q.correctAnswerIndex) {
        correct++;
        topicMap[topicName].correct += 1;
      } else {
        incorrect++;
        wrongQuestions.push({
          question: q,
          userAnswerIndex: userAns,
          questionNumber: idx + 1,
        });
      }
    });

    const total = activeQuiz.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Build Topic Performance with Priority thresholds:
    // Below 50% = High Priority
    // 50–70% = Medium Priority
    // Above 70% = Low Priority
    const topicPerformance: TopicPerformance[] = Object.keys(topicMap).map((topic) => {
      const item = topicMap[topic];
      const topicPct = Math.round((item.correct / item.total) * 100);
      let priority: 'High' | 'Medium' | 'Low' = 'Low';
      if (topicPct < 50) {
        priority = 'High';
      } else if (topicPct <= 70) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      return {
        topic,
        total: item.total,
        correct: item.correct,
        percentage: topicPct,
        priority,
      };
    });

    // Sort: High Priority first, then Medium, then Low
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    topicPerformance.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || a.percentage - b.percentage);

    const weakestTopic = topicPerformance.find((t) => t.priority === 'High' || t.priority === 'Medium') || topicPerformance[0] || null;

    return {
      correctCount: correct,
      incorrectCount: incorrect,
      total,
      percentage,
      topicPerformance,
      wrongQuestions,
      weakestTopic,
    };
  };

  // Record completed quiz results to the Weak Topics / Performance Context
  useEffect(() => {
    if (isQuizCompleted && activeQuiz) {
      const sessionKey = `${activeQuiz.id}-${Object.keys(userAnswers).length}-${Date.now()}`;
      if (recordedSessionKeyRef.current !== sessionKey) {
        recordedSessionKeyRef.current = sessionKey;
        const res = calculateResults();
        res.topicPerformance.forEach((tp) => {
          const mistakes = res.wrongQuestions
            .filter((w) => w.question.topic === tp.topic)
            .map((w) => w.question.question);

          recordQuizAttempt(
            activeQuiz.subjectCode || selectedSubject || 'JAVA',
            tp.topic,
            tp.correct,
            tp.total,
            mistakes,
            activeQuiz.title
          );
        });
      }
    }
  }, [isQuizCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStudyWeakTopicAction = (topicName?: string) => {
    if (!activeQuiz) return;
    const targetTopic = topicName || calculateResults().weakestTopic?.topic || 'Core Concepts';
    const subj = activeQuiz.subjectCode || selectedSubject;

    if (onStudyWeakTopic) {
      onStudyWeakTopic(subj, targetTopic);
    } else {
      onSelectSubject(subj);
      onNavigate('tutor');
    }
  };

  const currentQ: QuizQuestion | undefined = activeQuiz?.questions[currentQuestionIndex];
  const loadingSteps = [
    'Analyzing academic syllabus & topic parameters...',
    'Consulting Gemini AI to author challenging test items & distractors...',
    'Validating answer keys & pedagogical explanations...',
  ];

  const suggestedTopicsBySubject: { [key: string]: string[] } = {
    'Java Programming': [
      'OOP, Inheritance & Polymorphism',
      'Collections Framework (ArrayList, HashMap)',
      'Exception Handling & Custom Exceptions',
      'Multithreading & Concurrency',
      'Garbage Collection & Memory Model',
    ],
    'CS301': [
      'AVL Trees & Balance Factors',
      'Dijkstra & Bellman-Ford Algorithms',
      'Dynamic Programming & Recurrences',
      'Hash Tables & Collision Resolution',
    ],
    'CHEM202': [
      'Reaction Kinetics & Rate Laws',
      'Thermodynamic vs Kinetic Control',
      'Electrophilic Aromatic Substitution',
      'NMR & IR Spectroscopy',
    ],
    'ECON101': [
      'Slutsky Equation & Income Effects',
      'Monopoly Price Discrimination',
      'Nash Equilibrium & Game Theory',
    ],
    'MATH240': [
      'Taylor Series & Lagrange Error Bound',
      'Matrix Diagonalization & Eigenvalues',
      'Vector Calculus & Stokes Theorem',
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      {!activeQuiz ? (
        /* Quiz Hub View */
        <>
          {/* Top Banner with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI-Powered Adaptive Testing</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Practice & Diagnostic Quizzes
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate custom quizzes on any topic, simulate real college exams, and pinpoint weak topics instantly with Gemini AI.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-2.5 items-center">
              <button
                onClick={() => {
                  setGenSubject('Java Programming');
                  setGenTopic('OOP, Inheritance & Polymorphism');
                  setGenDifficulty('Medium');
                  setGenCount(5);
                  setGenType('Multiple Choice');
                  setIsGenerateQuizModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-indigo-900 text-xs font-extrabold shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Create New AI Quiz</span>
              </button>
            </div>

            {/* Subtle background glow */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Quick Topics Presets */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <span>Quick Diagnostic Generator</span>
              </div>
              <span className="text-[11px] text-slate-400">1-click generator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  subject: 'Java Programming',
                  topic: 'OOP, Polymorphism & Collections',
                  count: 5,
                  diff: 'Medium' as QuizDifficulty,
                  badge: 'Popular',
                },
                {
                  subject: 'CS301 - Data Structures',
                  topic: 'AVL Trees & Graph Traversal',
                  count: 5,
                  diff: 'Hard' as QuizDifficulty,
                  badge: 'Exam Prep',
                },
                {
                  subject: 'CHEM202 - Organic Chemistry',
                  topic: 'Reaction Kinetics & Mechanisms',
                  count: 5,
                  diff: 'Medium' as QuizDifficulty,
                  badge: 'Concept Check',
                },
              ].map((preset, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-300 transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => {
                    setGenSubject(preset.subject);
                    setGenTopic(preset.topic);
                    setGenDifficulty(preset.diff);
                    setGenCount(preset.count);
                    setGenType('Multiple Choice');
                    setIsGenerateQuizModalOpen(true);
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {preset.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{preset.diff}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {preset.subject}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{preset.topic}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                    <span>Generate 5 Questions</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quizzes List Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Available Practice Tests & Quizzes</h3>
              <span className="text-xs text-slate-400">{filteredQuizzes.length} tests</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {quiz.subjectCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          quiz.difficulty === 'Exam Standard'
                            ? 'bg-rose-100 text-rose-700'
                            : quiz.difficulty === 'Intermediate'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-2.5 leading-snug">
                      {quiz.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.questionsCount} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.durationMinutes} Minutes
                      </span>
                      {quiz.highScore !== undefined && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Award className="w-3.5 h-3.5" />
                          Best: {quiz.highScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Taken {quiz.timesTaken} times
                    </span>

                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Practice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : !isQuizCompleted ? (
        /* Active Quiz Screen */
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                {activeQuiz.subjectCode}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {activeQuiz.title}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Progress Bar & Jump Bubbles */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className="font-semibold text-indigo-600">
                {Math.round(((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100)}% Completed
              </span>
            </div>

            {/* Smooth Top Progress Track */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Navigation Bubbles */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
              {activeQuiz.questions.map((q, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                const isCorrect = isAnswered && userAnswers[idx] === q.correctAnswerIndex;

                let bubbleStyle = 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50';
                if (isCurrent) {
                  bubbleStyle = 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20';
                } else if (isAnswered) {
                  bubbleStyle = isCorrect
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                    : 'bg-rose-50 text-rose-700 border border-rose-300 font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      const saved = userAnswers[idx];
                      setSelectedOption(saved !== undefined ? saved : null);
                      setIsAnswerSubmitted(saved !== undefined);
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${bubbleStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          {currentQ && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Concept: {currentQ.topic}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQ.question}
                </h3>

                {currentQ.formulaSnippet && (
                  <div className="font-mono text-xs p-3 rounded-xl bg-slate-900 text-amber-300 inline-block">
                    {currentQ.formulaSnippet}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctAnswerIndex;
                  let optionStyle =
                    'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-400';
                    } else {
                      optionStyle = 'border-slate-200 bg-slate-50/60 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle =
                      'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${optionStyle}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                          isAnswerSubmitted && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isAnswerSubmitted && isSelected && !isCorrect
                            ? 'bg-rose-500 text-white'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xs sm:text-sm flex-1 pt-1 leading-relaxed">{option}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Rationale Explanation Box */}
              {isAnswerSubmitted && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    selectedOption === currentQ.correctAnswerIndex
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {selectedOption === currentQ.correctAnswerIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-800">Correct! Explanation:</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span className="text-rose-800">
                          Incorrect. The correct answer is Option {String.fromCharCode(65 + currentQ.correctAnswerIndex)}:
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitQuestionAnswer}
                    disabled={selectedOption === null}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex === activeQuiz.questions.length - 1
                        ? 'Finish & View Results'
                        : 'Next Question'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results & Analysis Screen */
        <div className="max-w-3xl mx-auto space-y-6">
          {(() => {
            const res = calculateResults();
            const isPassing = res.percentage >= 70;

            return (
              <>
                {/* Score Summary Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-6">
                  <div
                    className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-inner ${
                      isPassing ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <Award className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {isPassing ? 'Diagnostic Completed Successfully!' : 'Diagnostic Review Completed'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {activeQuiz.title} • {activeQuiz.subjectCode}
                    </p>
                  </div>

                  {/* 4 Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="text-2xl font-extrabold text-indigo-600">{res.percentage}%</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                        Score
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="text-2xl font-extrabold text-slate-900">{res.total}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                        Total Questions
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-2xl font-extrabold text-emerald-700">{res.correctCount}</div>
                      <div className="text-[11px] font-bold text-emerald-600 uppercase mt-0.5">
                        Correct
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                      <div className="text-2xl font-extrabold text-rose-700">{res.incorrectCount}</div>
                      <div className="text-[11px] font-bold text-rose-600 uppercase mt-0.5">
                        Incorrect
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                    <button
                      onClick={handleRetryCurrentQuiz}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>Retry Quiz</span>
                    </button>

                    <button
                      onClick={() => setIsGenerateQuizModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate New Quiz</span>
                    </button>

                    {res.wrongQuestions.length > 0 && (
                      <button
                        onClick={() => {
                          reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <FileQuestion className="w-4 h-4" />
                        <span>Review Mistakes ({res.wrongQuestions.length})</span>
                      </button>
                    )}

                    {res.weakestTopic && (
                      <button
                        onClick={() => handleStudyWeakTopicAction(res.weakestTopic?.topic)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Study Weak Topics with AI</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Topic-Wise Performance Breakdown */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-slate-900">Topic-Wise Performance & Priority</h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Based on accuracy thresholds (&lt;50% High, 50-70% Medium)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {res.topicPerformance.map((tp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{tp.topic}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                tp.priority === 'High'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : tp.priority === 'Medium'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {tp.priority} Priority
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tp.correct} / {tp.total} questions correct ({tp.percentage}%)
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-28 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tp.priority === 'High'
                                  ? 'bg-rose-500'
                                  : tp.priority === 'Medium'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${tp.percentage}%` }}
                            />
                          </div>

                          <button
                            onClick={() => handleStudyWeakTopicAction(tp.topic)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Study Topic</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions Student Got Wrong (Review Mistakes) */}
                <div ref={reviewSectionRef} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Detailed Review: Incorrect & Missed Questions ({res.wrongQuestions.length})
                      </h4>
                    </div>
                  </div>

                  {res.wrongQuestions.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        Flawless run! You answered every question correctly.
                      </p>
                      <p className="text-xs text-slate-400">
                        Try an Exam Standard or Hard quiz to test yourself on edge cases.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {res.wrongQuestions.map(({ question, userAnswerIndex, questionNumber }) => (
                        <div
                          key={question.id}
                          className="p-4 sm:p-5 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                              Question #{questionNumber}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Topic: {question.topic}
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                            {question.question}
                          </h5>

                          {/* Options comparison */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                              <span className="font-bold block text-[11px] text-rose-700 mb-0.5">
                                Your Answer:
                              </span>
                              {userAnswerIndex !== undefined
                                ? `${String.fromCharCode(65 + userAnswerIndex)}: ${question.options[userAnswerIndex]}`
                                : 'No answer submitted'}
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                              <span className="font-bold block text-[11px] text-emerald-700 mb-0.5">
                                Correct Answer:
                              </span>
                              {String.fromCharCode(65 + question.correctAnswerIndex)}: {question.options[question.correctAnswerIndex]}
                            </div>
                          </div>

                          {/* AI Explanation for the mistake */}
                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1 shadow-2xs">
                            <span className="font-bold text-indigo-700 flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3 h-3" /> Explanation & Concept:
                            </span>
                            <p className="leading-relaxed text-slate-700">{question.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      {isGenerateQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Quiz Generator</h3>
                  <p className="text-[11px] text-slate-500">
                    Author tailored exam items using Gemini 3.7 Flash
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isGenerating && setIsGenerateQuizModalOpen(false)}
                disabled={isGenerating}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generateError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="flex-1">{generateError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateAiQuiz} className="space-y-4 text-xs">
              {/* 1. Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Subject / Discipline</span>
                </label>
                <input
                  type="text"
                  value={genSubject}
                  disabled={isGenerating}
                  onChange={(e) => setGenSubject(e.target.value)}
                  placeholder="e.g. Java Programming, CS301, Organic Chemistry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* 2. Topic */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Topic / Concept to Test</span>
                </label>
                <input
                  type="text"
                  value={genTopic}
                  disabled={isGenerating}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. OOP & Inheritance, AVL Trees, Reaction Kinetics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                {/* Suggested topic chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(suggestedTopicsBySubject[genSubject] || [
                    'OOP, Polymorphism & Collections',
                    'Exception Handling & Concurrency',
                    'Memory & Garbage Collection',
                  ]).map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setGenTopic(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        genTopic === t
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Difficulty */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Difficulty</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as QuizDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setGenDifficulty(diff)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                        genDifficulty === diff
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Question Count & 5. Question Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Questions</span>
                  </label>
                  <select
                    value={genCount}
                    disabled={isGenerating}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value={5}>5 Questions (~10m)</option>
                    <option value={10}>10 Questions (~20m)</option>
                    <option value={15}>15 Questions (~30m)</option>
                    <option value={20}>20 Questions (~40m)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Question Type</span>
                  </label>
                  <select
                    value={genType}
                    disabled={isGenerating}
                    onChange={(e) => setGenType(e.target.value as QuizQuestionType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Multiple Choice">Multiple Choice (4 Options)</option>
                    <option value="True/False">True / False</option>
                    <option value="Mixed">Mixed (MCQs & T/F)</option>
                  </select>
                </div>
              </div>

              {/* Submit / Loading Button */}
              <div className="pt-3 border-t border-slate-100 flex gap-2.5 justify-end">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setIsGenerateQuizModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !genSubject.trim() || !genTopic.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authoring Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Start Quiz</span>
                    </>
                  )}
                </button>
              </div>

              {isGenerating && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-950 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{loadingSteps[generationStep]}</span>
                  </div>
                  <div className="h-1.5 bg-indigo-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
