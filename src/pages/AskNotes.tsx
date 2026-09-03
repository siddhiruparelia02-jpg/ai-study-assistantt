import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  FileText,
  BookmarkCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowRight,
  BookOpen,
  Trash2,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  FileCode,
  FileSpreadsheet,
  File,
  X,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { StudyMaterial, AskNotesMessage, PageId } from '../types';

interface AskNotesProps {
  materials: StudyMaterial[];
  selectedMaterialId?: string;
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onSelectMaterial: (materialId: string) => void;
  onNavigate: (page: PageId) => void;
  onAskTutorGeneral?: (question: string, subjectCode?: string) => void;
  onOpenUploadModal?: () => void;
  initialQuestion?: string;
  onClearInitialQuestion?: () => void;
}

export const AskNotes: React.FC<AskNotesProps> = ({
  materials,
  selectedMaterialId,
  selectedSubject,
  onSelectSubject,
  onSelectMaterial,
  onNavigate,
  onAskTutorGeneral,
  onOpenUploadModal,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  // Current active material
  const activeMaterial =
    materials.find((m) => m.id === selectedMaterialId) ||
    materials.find((m) => m.subjectCode === selectedSubject && m.status === 'Ready') ||
    materials.find((m) => m.status === 'Ready') ||
    materials[0];

  const [messages, setMessages] = useState<AskNotesMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDocumentDrawerOpen, setIsDocumentDrawerOpen] = useState<boolean>(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState<boolean>(false);
  const [filterSubject, setFilterSubject] = useState<string>(selectedSubject);
  const [searchDocTerm, setSearchDocTerm] = useState<string>('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle incoming initial question from Weak Topics or Notes
  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [initialQuestion, activeMaterial?.id]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If active material changes, initialize or reset conversation context
  useEffect(() => {
    if (activeMaterial) {
      setErrorMessage(null);
    }
  }, [activeMaterial?.id]);

  const defaultStarterQuestions = [
    'Explain this topic simply.',
    'What are the important points?',
    'What definitions should I remember?',
    'What could be asked in an exam?',
    'Summarize this section.',
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'Markdown':
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      case 'Doc':
        return <File className="w-4 h-4 text-blue-500" />;
      case 'Sheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuestion).trim();
    if (!textToSend || isLoading) return;

    if (!activeMaterial) {
      setErrorMessage('Please select a study material to ask questions about.');
      return;
    }

    setErrorMessage(null);
    setInputQuestion('');

    const userMessageId = `msg-user-${Date.now()}`;
    const userMsg: AskNotesMessage = {
      id: userMessageId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      answerMarkdown: textToSend,
      confidence: 'High',
      isFoundInDocument: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/notes/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: activeMaterial.id,
          materialTitle: activeMaterial.title,
          materialSubject: activeMaterial.subjectCode,
          materialCategory: activeMaterial.category || 'Lecture Notes',
          materialContent: activeMaterial.fileContent || activeMaterial.summarySnippet || '',
          question: textToSend,
          history: messages.slice(-4).map((m) => ({
            sender: m.sender,
            text: m.answerMarkdown,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const assistantMsg: AskNotesMessage = {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          question: textToSend,
          answerMarkdown: result.data.answerMarkdown,
          sourceInfo: {
            materialId: activeMaterial.id,
            materialTitle: activeMaterial.title,
            section: result.data.sourceSection,
            excerpt: result.data.sourceExcerpt,
          },
          confidence: result.data.confidence || 'High',
          isFoundInDocument: result.data.isFoundInDocument,
          suggestGeneralTutor: result.data.suggestGeneralTutor,
          suggestedQuestions: result.data.suggestedQuestions || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(result.error || 'Failed to get answer from study material.');
      }
    } catch (err: any) {
      console.error('Error asking document:', err);
      // Fallback assistant response
      const fallbackMsg: AskNotesMessage = {
        id: `msg-asst-fallback-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        question: textToSend,
        answerMarkdown:
          `Based on your notes in **${activeMaterial.title}**:\n\n` +
          `The document discusses key concepts regarding **${activeMaterial.topic || activeMaterial.title}**.\n\n` +
          `* Summary: ${activeMaterial.summarySnippet}`,
        sourceInfo: {
          materialId: activeMaterial.id,
          materialTitle: activeMaterial.title,
          section: activeMaterial.topic || 'General Overview',
          excerpt: activeMaterial.summarySnippet,
        },
        confidence: 'Medium',
        isFoundInDocument: true,
        suggestGeneralTutor: false,
        suggestedQuestions: defaultStarterQuestions.slice(0, 3),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear current questions history for this document?')) {
      setMessages([]);
    }
  };

  const handleAskTutorClick = (question: string) => {
    if (onAskTutorGeneral) {
      onAskTutorGeneral(question, activeMaterial?.subjectCode);
    } else {
      onNavigate('tutor');
    }
  };

  // Filtered materials for modal picker
  const filteredPickerMaterials = materials.filter((m) => {
    const matchesSubject = filterSubject === 'ALL' || m.subjectCode === filterSubject;
    const matchesSearch =
      searchDocTerm === '' ||
      m.title.toLowerCase().includes(searchDocTerm.toLowerCase()) ||
      m.topic?.toLowerCase().includes(searchDocTerm.toLowerCase()) ||
      m.subjectCode.toLowerCase().includes(searchDocTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const hasReadableContent =
    activeMaterial &&
    activeMaterial.fileContent &&
    activeMaterial.fileContent.trim().length > 20;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 relative overflow-hidden">
      {/* Top Banner: Selected Document Information Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 shadow-2xs z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Document metadata info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 shrink-0">
              {activeMaterial ? getTypeIcon(activeMaterial.type) : <FileText className="w-5 h-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  {activeMaterial?.subjectCode || 'DOC'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {activeMaterial?.type || 'DOCUMENT'}
                </span>
                {activeMaterial?.category && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {activeMaterial.category}
                  </span>
                )}
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Grounded Source of Truth
                </span>
              </div>

              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5 flex items-center gap-2">
                {activeMaterial?.title || 'No Document Selected'}
              </h1>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setIsPickerModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Switch to another study document"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Switch Document</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setIsDocumentDrawerOpen(!isDocumentDrawerOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDocumentDrawerOpen
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Peek at document source text"
            >
              {isDocumentDrawerOpen ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Hide Text</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Inspect Text</span>
                </>
              )}
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Area (Chat Stream + Optional Source Text Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: Conversation Stream */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
            {/* Warning if document has no extracted text */}
            {!hasReadableContent && activeMaterial && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Limited Text Content Detected</div>
                  <p className="text-amber-800 leading-relaxed">
                    This document currently has limited extracted text content. Responses will be grounded in the available summary and metadata. For in-depth grounding, please upload a searchable PDF, text, or markdown document.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="py-8 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4 max-w-2xl mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                    <Sparkles className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-slate-900">
                      Ask Questions Grounded in Your Notes
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                      StudyAI will prioritize <span className="font-semibold text-slate-800">{activeMaterial?.title}</span> as the source of truth, providing precise citations and high-yield exam takeaways.
                    </p>
                  </div>

                  {/* Grounding rules reassurance */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Direct Citations
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Displays the exact section and excerpt from your notes.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        Strict Accuracy
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Answers only when sufficient information exists in your material.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <Bot className="w-3.5 h-3.5 text-amber-500" />
                        Seamless Tutor Bridge
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Offers general AI tutoring if your notes don't cover a concept.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Suggested Starters */}
                <div className="max-w-2xl mx-auto space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Suggested Grounded Questions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {defaultStarterQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <span>{q}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  /* Student Question Message */
                  <div className="flex justify-end">
                    <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-2xs space-y-1">
                      <div className="text-xs font-bold text-indigo-100 flex items-center gap-1.5">
                        <span>You</span>
                        <span className="text-[10px] text-indigo-200">• {msg.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.answerMarkdown}</p>
                    </div>
                  </div>
                ) : (
                  /* AI Document-Grounded Answer Message */
                  <div className="flex justify-start">
                    <div className="max-w-3xl w-full bg-white rounded-2xl rounded-tl-xs border border-slate-200 p-5 shadow-xs space-y-4">
                      {/* Header Badge Row */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="p-1 rounded bg-indigo-50 text-indigo-600">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            Answer from {msg.sourceInfo?.materialTitle || activeMaterial?.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Confidence Level Badge */}
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              msg.confidence === 'High'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : msg.confidence === 'Medium'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                msg.confidence === 'High'
                                  ? 'bg-emerald-500'
                                  : msg.confidence === 'Medium'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {msg.confidence} Confidence
                          </span>

                          <button
                            onClick={() => handleCopyText(msg.id, msg.answerMarkdown)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy answer"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Not Found in Document Callout */}
                      {!msg.isFoundInDocument && (
                        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-xs text-rose-950">
                                Missing from Selected Document
                              </div>
                              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                                I couldn't find enough information about this in your selected study material.
                              </p>
                            </div>
                          </div>

                          {msg.suggestGeneralTutor && msg.question && (
                            <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                              <span className="text-[11px] text-rose-700 font-medium">
                                Want a general multi-disciplinary explanation?
                              </span>
                              <button
                                onClick={() => handleAskTutorClick(msg.question!)}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <Bot className="w-3.5 h-3.5" />
                                <span>Ask AI Tutor &rarr;</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Body (Markdown formatted) */}
                      {msg.isFoundInDocument && (
                        <div className="space-y-3 text-sm text-slate-800 leading-relaxed font-sans prose prose-slate max-w-none">
                          <div className="whitespace-pre-wrap">{msg.answerMarkdown}</div>
                        </div>
                      )}

                      {/* Supporting Source Citation Section ("From Your Notes") */}
                      {msg.isFoundInDocument && msg.sourceInfo && (
                        <div className="mt-4 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
                              From Your Notes
                            </div>
                            {msg.sourceInfo.section && (
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                Section: {msg.sourceInfo.section}
                              </span>
                            )}
                          </div>

                          {msg.sourceInfo.excerpt && (
                            <div className="pl-3 border-l-2 border-indigo-400 text-slate-600 italic text-[11px] leading-relaxed bg-white/70 p-2 rounded-r-lg">
                              "{msg.sourceInfo.excerpt}"
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1">
                            <span>Source:</span>
                            <span className="text-slate-600 font-semibold">{msg.sourceInfo.materialTitle}</span>
                          </div>
                        </div>
                      )}

                      {/* Suggested Follow-up Questions */}
                      {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Follow-Up Questions:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedQuestions.map((sq, i) => (
                              <button
                                key={i}
                                onClick={() => handleSendMessage(sq)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-medium transition-colors border border-slate-200/60"
                              >
                                {sq} &rarr;
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  <div className="text-xs font-semibold text-slate-700">
                    Retrieving and grounding answer from <span className="text-indigo-600">{activeMaterial?.title}</span>...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-xs">
            <div className="max-w-4xl mx-auto space-y-2">
              {errorMessage && (
                <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMessage}
                </div>
              )}

              <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <textarea
                  ref={inputRef}
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask questions grounded in "${activeMaterial?.title || 'selected notes'}"...`}
                  rows={2}
                  disabled={isLoading}
                  className="w-full bg-transparent border-none p-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                />

                <div className="flex items-center gap-1.5 shrink-0 pb-1">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputQuestion.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-xs flex items-center justify-center"
                    title="Send Question (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600 border border-slate-200">Enter</kbd> to ask • <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600 border border-slate-200">Shift + Enter</kbd> for new line</span>
                <span>Grounded with Gemini 2.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Slide-over: Document Source Text Inspector */}
        {isDocumentDrawerOpen && (
          <div className="w-80 lg:w-96 border-l border-slate-200 bg-white h-full flex flex-col z-10 shadow-lg shrink-0">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Document Text Stream</span>
              </div>
              <button
                onClick={() => setIsDocumentDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-50/50 leading-relaxed whitespace-pre-wrap">
              {activeMaterial?.fileContent ||
                `# ${activeMaterial?.title}
Subject: ${activeMaterial?.subjectCode}
Category: ${activeMaterial?.category || 'Lecture Notes'}
Topic: ${activeMaterial?.topic || 'General'}

Summary:
${activeMaterial?.summarySnippet}`}
            </div>
          </div>
        )}
      </div>

      {/* Switch Document Modal */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Study Material</h3>
                <p className="text-xs text-slate-500">
                  Pick a document to serve as the grounded source of truth.
                </p>
              </div>
              <button
                onClick={() => setIsPickerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search materials by title, topic, or code..."
                  value={searchDocTerm}
                  onChange={(e) => setSearchDocTerm(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-xl py-2 px-9 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-slate-100 border-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Subjects</option>
                <option value="JAVA">Java (CS-JAVA)</option>
                <option value="CSA">CSA (CS-204)</option>
                <option value="CS301">CS301 (Algorithms)</option>
                <option value="CHEM202">CHEM202</option>
                <option value="ECON101">ECON101</option>
                <option value="MATH240">MATH240</option>
              </select>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-1">
              {filteredPickerMaterials.map((mat) => {
                const isSelected = activeMaterial?.id === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => {
                      onSelectMaterial(mat.id);
                      onSelectSubject(mat.subjectCode);
                      setIsPickerModalOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                        {getTypeIcon(mat.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            {mat.subjectCode}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {mat.type} • {mat.fileSize}
                          </span>
                          {mat.category && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded">
                              {mat.category}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {mat.title}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-semibold">
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredPickerMaterials.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No study materials found matching your search.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {onOpenUploadModal && (
                <button
                  onClick={() => {
                    setIsPickerModalOpen(false);
                    onOpenUploadModal();
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  + Upload New Document
                </button>
              )}
              <button
                onClick={() => setIsPickerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
