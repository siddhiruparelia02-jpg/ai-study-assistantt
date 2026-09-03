import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Trash2,
  Layers,
  GraduationCap,
  Globe,
  Code2,
  AlertCircle,
  MessageSquarePlus,
  Loader2,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { TutorMessage, TutorSession, PageId, TutorDifficulty } from '../types';
import { mockTutorSessions } from '../data/mockData';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useSettings } from '../context/SettingsContext';

interface AiTutorProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AiTutor: React.FC<AiTutorProps> = ({
  selectedSubject,
  onSelectSubject,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { recordTutorInteraction } = useStudyPerformance();
  const [sessions, setSessions] = useState<TutorSession[]>(mockTutorSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(mockTutorSessions[0].id);
  const [inputText, setInputText] = useState('');
  const [difficulty, setDifficulty] = useState<TutorDifficulty>('Beginner');
  const [activeMode, setActiveMode] = useState<
    'Concept Breakdown' | 'Socratic Practice' | 'Step-by-Step Solver' | 'Exam Tips'
  >('Concept Breakdown');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const { subjects } = useSettings();

  // Subject options
  const subjectList = [
    { code: 'ALL', name: 'All Subjects (Multi-disciplinary)' },
    ...subjects.map((s) => ({ code: s.code, name: `${s.code} - ${s.name}` })),
  ];

  const suggestedPrompts = [
    {
      label: 'JDBC Type 1 vs Type 4',
      prompt: 'Explain the architectural differences between Type 1 and Type 4 JDBC Drivers and why Type 4 is preferred for enterprise apps.',
      subject: 'ADV-JAVA',
    },
    {
      label: 'Servlet Lifecycle & doGet/doPost',
      prompt: 'Explain the complete lifecycle of a Java Servlet (init, service, destroy) and how doGet/doPost are handled.',
      subject: 'ADV-JAVA',
    },
    {
      label: 'Linux Inodes & Hard vs Soft Links',
      prompt: 'What is an inode in Linux? Explain the difference between hard links and symbolic links with examples.',
      subject: 'LINUX',
    },
    {
      label: 'Payment Gateway Authorization Cycle',
      prompt: 'Walk me through the step-by-step authorization flow of an Electronic Payment Gateway during online checkout.',
      subject: 'ECOM',
    },
    {
      label: 'Karl Pearson Correlation & LPP',
      prompt: 'Explain the properties of Karl Pearson’s coefficient of correlation (r) and how to formulate a Linear Programming Problem.',
      subject: 'QUANTS',
    },
  ];

  // Rotate loading steps for pleasant feedback
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  // Handle incoming initialPrompt from Study Weak Topics
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string, overrideDifficulty?: TutorDifficulty) => {
    const questionText = textToSend || inputText;
    if (!questionText.trim() || isLoading) return;

    const chosenDifficulty = overrideDifficulty || difficulty;
    setErrorMessage(null);
    setLastFailedPrompt(null);

    const userMsg: TutorMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: questionText,
      difficulty: chosenDifficulty,
      subjectCode: selectedSubject,
    };

    // Add user message immediately
    const updatedMessagesWithUser = [...activeSession.messages, userMsg];
    const updatedSessionsWithUser = sessions.map((s) =>
      s.id === activeSession.id
        ? {
            ...s,
            messages: updatedMessagesWithUser,
            title: s.messages.length <= 1 ? questionText.slice(0, 36) + (questionText.length > 36 ? '...' : '') : s.title,
            lastActive: 'Just now',
          }
        : s
    );

    setSessions(updatedSessionsWithUser);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history to send to Gemini API
      const historyContext = activeSession.messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          subject: selectedSubject === 'ALL' ? (activeSession.subjectCode || 'General') : selectedSubject,
          difficulty: chosenDifficulty,
          history: historyContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const resData = await response.json();
      const structuredData = resData.data;

      if (!structuredData) {
        throw new Error('Invalid response structure received from AI Tutor');
      }

      const tutorReply: TutorMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: structuredData.simpleExplanation,
        difficulty: chosenDifficulty,
        structuredResponse: {
          simpleExplanation: structuredData.simpleExplanation,
          stepByStepExplanation: structuredData.stepByStepExplanation || [],
          analogy: structuredData.analogy || '',
          example: structuredData.example || '',
          keyTakeaways: structuredData.keyTakeaways || [],
          followUpQuestion: structuredData.followUpQuestion || '',
          isAmbiguous: structuredData.isAmbiguous || false,
          clarificationQuestion: structuredData.clarificationQuestion || '',
        },
        keyPoints: structuredData.keyTakeaways || [],
        suggestedFollowUps: structuredData.followUpQuestion ? [structuredData.followUpQuestion] : [],
      };

      const finalMessages = [...updatedMessagesWithUser, tutorReply];
      const finalSessions = sessions.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: finalMessages,
              lastActive: 'Just now',
            }
          : s
      );

      setSessions(finalSessions);
      recordTutorInteraction(
        selectedSubject === 'ALL' ? (activeSession.subjectCode || 'JAVA') : selectedSubject,
        questionText
      );
    } catch (err: any) {
      console.error('AI Tutor request failed:', err);
      setErrorMessage(
        err.message || 'Unable to connect to the AI Tutor. Please verify your connection or try again.'
      );
      setLastFailedPrompt(questionText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateNewSession = () => {
    const currentSubj = selectedSubject === 'ALL' ? 'CS301' : selectedSubject;
    const newSess: TutorSession = {
      id: `session-${Date.now()}`,
      title: `Study Session (${currentSubj})`,
      subjectCode: currentSubj,
      mode: activeMode,
      lastActive: 'Just now',
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          sender: 'tutor',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Hello! I am your **StudyAI College Tutor** for **${currentSubj}**. What concept, theorem, or problem set would you like to master today? Ask anything and I'll break it down step-by-step with real-world analogies!`,
          suggestedFollowUps: [
            'Explain foundational concepts with simple everyday analogies',
            'Break down an exam practice problem step-by-step',
            'Quiz me with high-yield college exam questions',
          ],
        },
      ],
    };

    setSessions([newSess, ...sessions]);
    setActiveSessionId(newSess.id);
    setErrorMessage(null);
  };

  const handleClearCurrentSession = () => {
    const currentSubj = activeSession.subjectCode || (selectedSubject === 'ALL' ? 'CS301' : selectedSubject);
    const clearedMessages: TutorMessage[] = [
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'tutor',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Conversation cleared. What would you like to explore next in **${currentSubj}**?`,
        suggestedFollowUps: [
          'Explain key principles with simple analogies',
          'Break down a complex problem step-by-step',
        ],
      },
    ];

    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, messages: clearedMessages, lastActive: 'Just now' } : s
    );

    setSessions(updatedSessions);
    setShowClearConfirm(false);
    setErrorMessage(null);
  };

  const loadingMessages = [
    'Analyzing syllabus context & concepts...',
    'Drafting intuitive analogies & step-by-step breakdown...',
    'Synthesizing concrete examples & exam takeaways...',
  ];

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col md:flex-row gap-4 pb-4">
      {/* Sidebar: Conversation history & study controls */}
      <div className="w-full md:w-68 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-4">
          <button
            onClick={handleCreateNewSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Chat</span>
          </button>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-600" />
              <span>Subject / Course</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {subjectList.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Difficulty Level</span>
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
              {(['Beginner', 'Intermediate', 'Advanced'] as TutorDifficulty[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${
                    difficulty === lvl
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 px-1">
              {difficulty === 'Beginner' && '• Plain language & intuitive analogies'}
              {difficulty === 'Intermediate' && '• Standard college course depth'}
              {difficulty === 'Advanced' && '• Rigorous proofs, edge cases & traps'}
            </p>
          </div>

          {/* Tutoring Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Tutoring Mode</span>
            </label>
            <div className="space-y-1">
              {(
                [
                  'Concept Breakdown',
                  'Socratic Practice',
                  'Step-by-Step Solver',
                  'Exam Tips',
                ] as const
              ).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeMode === mode
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Session History List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Recent Topics
              </label>
              <span className="text-[10px] text-slate-400">{sessions.length} chats</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setErrorMessage(null);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                    activeSessionId === sess.id
                      ? 'bg-slate-100 text-slate-900 font-bold border-l-3 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate font-semibold">{sess.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                    <span className="font-medium text-indigo-600">{sess.subjectCode}</span>
                    <span>{sess.lastActive}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-indigo-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tutor Tip</span>
          </div>
          <p className="text-[11px] text-indigo-900/80 leading-snug">
            Need a simpler explanation? Just ask "explain like I'm a freshman" or click the follow-up suggestions.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 truncate">{activeSession.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                  {selectedSubject === 'ALL' ? activeSession.subjectCode : selectedSubject}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                  {difficulty}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mode: <span className="font-semibold text-slate-700">{activeMode}</span> • Powered by Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear current conversation"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tutor Ready
            </span>
          </div>
        </div>

        {/* Clear Confirmation Modal / Banner */}
        {showClearConfirm && (
          <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-medium text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Are you sure you want to clear this conversation?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearCurrentSession}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {lastFailedPrompt && (
              <button
                onClick={() => handleSendMessage(lastFailedPrompt)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeSession.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const structured = msg.structuredResponse;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                      : 'bg-slate-50/90 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {/* Ambiguity Alert if flagged by AI */}
                  {structured?.isAmbiguous && structured.clarificationQuestion && (
                    <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Clarification Needed:</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-snug">
                        {structured.clarificationQuestion}
                      </p>
                    </div>
                  )}

                  {/* 1. Simple Explanation */}
                  <div className="space-y-2">
                    <div className="whitespace-pre-line text-slate-800">
                      {structured ? structured.simpleExplanation : msg.text}
                    </div>
                  </div>

                  {/* 2. Step-by-Step Explanation */}
                  {structured?.stepByStepExplanation && structured.stepByStepExplanation.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2.5 shadow-2xs">
                      <div className="font-bold text-xs text-indigo-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Step-by-Step Breakdown:</span>
                      </div>
                      <div className="space-y-2">
                        {structured.stepByStepExplanation.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px] border border-indigo-200/60 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed flex-1">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Real-World Analogy */}
                  {structured?.analogy && (
                    <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-br from-amber-50/90 to-amber-50/40 border border-amber-200/80 text-amber-950 space-y-1.5 shadow-2xs">
                      <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-600" />
                        <span>Real-World Analogy:</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed font-normal">
                        {structured.analogy}
                      </p>
                    </div>
                  )}

                  {/* 4. Concrete Example / Code / Formula */}
                  {structured?.example && (
                    <div className="mt-3.5 rounded-xl bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs shadow-inner">
                      <div className="px-3 py-1.5 bg-slate-800 flex justify-between items-center text-[10px] text-slate-300">
                        <span className="flex items-center gap-1 font-sans font-semibold">
                          <Code2 className="w-3 h-3 text-indigo-400" /> Concrete Example & Solution
                        </span>
                        <button
                          onClick={() => handleCopyCode(structured.example, msg.id)}
                          className="hover:text-white flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-700/60"
                        >
                          {copiedCodeId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto text-slate-200 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
                        <code>{structured.example}</code>
                      </pre>
                    </div>
                  )}

                  {/* Legacy Code Snippet fallback */}
                  {!structured && msg.codeSnippet && (
                    <div className="mt-3.5 rounded-xl bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs shadow-inner">
                      <div className="px-3 py-1.5 bg-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                        <span>{msg.codeSnippet.language}</span>
                        <button
                          onClick={() => handleCopyCode(msg.codeSnippet!.code, msg.id)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedCodeId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 overflow-x-auto">
                        <code>{msg.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* 5. Key Takeaways for Exams */}
                  {((structured?.keyTakeaways && structured.keyTakeaways.length > 0) ||
                    (msg.keyPoints && msg.keyPoints.length > 0)) && (
                    <div className="mt-3.5 p-3.5 rounded-xl bg-white border border-emerald-200/80 text-slate-800 space-y-1.5 shadow-2xs">
                      <div className="font-bold text-xs text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Key Takeaways for Exam:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                        {(structured?.keyTakeaways || msg.keyPoints || []).map((point, idx) => (
                          <li key={idx} className="leading-snug">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 6. One Follow-Up Question & Quick Action Prompts */}
                  {!isUser && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                      {structured?.followUpQuestion && (
                        <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
                          <div className="font-bold text-[11px] text-indigo-700 flex items-center gap-1 mb-1">
                            <HelpCircle className="w-3 h-3" />
                            <span>Tutor's Follow-up Question for You:</span>
                          </div>
                          <p className="text-slate-800 font-medium mb-2">{structured.followUpQuestion}</p>
                          <button
                            onClick={() => handleSendMessage(structured.followUpQuestion)}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Explore this question</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Quick Tutoring Actions */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() =>
                            handleSendMessage(
                              `I'm having trouble understanding this concept. Could you explain it in even simpler terms with a completely different analogy?`
                            )
                          }
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          <span>Explain simpler</span>
                        </button>
                        <button
                          onClick={() =>
                            handleSendMessage(`Can you provide another worked example or practice problem on this topic?`)
                          }
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1"
                        >
                          <Code2 className="w-3 h-3 text-indigo-500" />
                          <span>Another example</span>
                        </button>
                        <button
                          onClick={() =>
                            handleSendMessage(`Quiz me on this concept with a high-yield college exam multiple-choice question!`)
                          }
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1"
                        >
                          <GraduationCap className="w-3 h-3 text-emerald-600" />
                          <span>Quiz me on this</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2.5 text-right ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 text-xs font-bold shadow-xs">
                    AR
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading State Animation */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-2xl rounded-2xl p-4 bg-slate-50 border border-indigo-100 rounded-bl-xs shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>{loadingMessages[loadingStep]}</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200/80 rounded-full w-4/5 animate-pulse" />
                  <div className="h-3 bg-slate-200/80 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-slate-200/80 rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starter Chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Sample topics:</span>
          </span>
          {suggestedPrompts
            .filter((sp) => selectedSubject === 'ALL' || sp.subject === selectedSubject)
            .map((sp, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(sp.prompt)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-700 font-medium whitespace-nowrap shrink-0 transition-colors shadow-2xs disabled:opacity-50"
              >
                {sp.label}
              </button>
            ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Ask your AI Tutor about ${selectedSubject === 'ALL' ? 'any academic topic' : selectedSubject}... (e.g. derivations, proofs, analogies)`}
                value={inputText}
                disabled={isLoading}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask Tutor</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
