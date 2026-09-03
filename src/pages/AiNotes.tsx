import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Sparkles,
  Bookmark,
  Clock,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Minimize2,
  Maximize2,
  Layers,
  HelpCircle,
  Pin,
  X,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Code2,
  FileQuestion,
  GraduationCap,
  Sliders,
  Filter,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  Tag,
  Zap,
} from 'lucide-react';
import { NoteItem, NoteStyle, NoteLength, PageId, StudyMaterial } from '../types';
import { mockNotes } from '../data/mockData';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useSettings } from '../context/SettingsContext';
import {
  saveNoteToFirestore,
  deleteNoteFromFirestore,
  loadNotesFromFirestore,
  isFirestoreReady,
} from '../lib/firebase';

interface AiNotesProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  onCreateFlashcards?: (subjectCode: string, topic: string) => void;
  onCreateQuiz?: (subjectCode: string, topic: string) => void;
  materials?: StudyMaterial[];
}

interface ParsedNoteSection {
  title: string;
  type:
    | 'simple_explanation'
    | 'key_concepts'
    | 'important_definitions'
    | 'examples'
    | 'important_points'
    | 'exam_tips'
    | 'common_mistakes'
    | 'quick_revision'
    | 'other';
  content: string;
}

export const AiNotes: React.FC<AiNotesProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigate,
  onCreateFlashcards,
  onCreateQuiz,
  materials,
}) => {
  const { recordNotesGenerated } = useStudyPerformance();
  const { subjects } = useSettings();
  // Master notes state
  const [notes, setNotes] = useState<NoteItem[]>(mockNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(mockNotes[0]?.id || 'note-java-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(false);

  const allMaterials = materials || [];

  // Load custom persisted notes from Firestore
  useEffect(() => {
    async function fetchFirestoreNotes() {
      if (!isFirestoreReady()) return;
      setIsLoadingFirestore(true);
      try {
        const firestoreNotes = await loadNotesFromFirestore();
        if (firestoreNotes && firestoreNotes.length > 0) {
          setNotes((prev) => {
            const merged = [...firestoreNotes];
            prev.forEach((pn) => {
              if (!merged.some((n) => n.id === pn.id)) {
                merged.push(pn);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn('Error loading notes from Firestore:', err);
      } finally {
        setIsLoadingFirestore(false);
      }
    }
    fetchFirestoreNotes();
  }, []);

  // Generator Modal & Form State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genSubject, setGenSubject] = useState<string>(
    selectedSubject === 'ALL' ? 'JAVA' : selectedSubject
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('mat-java-2');
  const [genTopic, setGenTopic] = useState<string>('Inheritance & Dynamic Dispatch');
  const [genStyle, setGenStyle] = useState<NoteStyle>('Quick Revision');
  const [genLength, setGenLength] = useState<NoteLength>('Medium');

  // Generation / Refinement in-progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAction, setGeneratingAction] = useState<'generate' | 'shorter' | 'detailed' | 'regenerate'>('generate');
  const [generationStep, setGenerationStep] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // UI state
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: number]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  // Available study materials filtered or all
  const availableMaterials = allMaterials.filter(
    (m) => genSubject === 'ALL' || m.subjectCode === genSubject
  );

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync selectedSubject prop
  useEffect(() => {
    if (selectedSubject !== 'ALL') {
      setGenSubject(selectedSubject);
      // Pick first material matching subject if available
      const mat = allMaterials.find((m) => m.subjectCode === selectedSubject);
      if (mat) {
        setSelectedMaterialId(mat.id);
        if (mat.topic) {
          setGenTopic(mat.topic);
        }
      }
    }
  }, [selectedSubject, allMaterials]);

  // When selected material changes in generator, update default topic
  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const found = allMaterials.find((m) => m.id === matId);
    if (found) {
      setGenSubject(found.subjectCode);
      if (found.topic) {
        setGenTopic(found.topic);
      }
    }
  };

  // Generation step timer animation
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev + 1) % 4);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Filter notes by search, subject, and style
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubject === 'ALL' || n.subjectCode === selectedSubject;
    const matchesStyle = selectedStyleFilter === 'ALL' || n.style === selectedStyleFilter;

    return matchesSearch && matchesSubject && matchesStyle;
  });

  // Pin / Unpin note
  const handleTogglePin = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Copy full note
  const handleCopyNote = () => {
    if (!activeNote) return;
    const fullText = activeNote.contentMarkdown || `# ${activeNote.title}\n\n${activeNote.summary}`;
    navigator.clipboard.writeText(fullText);
    setCopiedNote(true);
    showToast('Copied full note Markdown to clipboard');
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Copy single section
  const handleCopySection = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionIndex(index);
    showToast('Section copied to clipboard');
    setTimeout(() => setCopiedSectionIndex(null), 2000);
  };

  // Toggle single section collapse
  const toggleSectionCollapse = (index: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Toggle all sections
  const toggleAllSections = (collapse: boolean) => {
    const parsed = parseMarkdownSections(activeNote?.contentMarkdown || '');
    const newMap: { [key: number]: boolean } = {};
    parsed.forEach((_, idx) => {
      newMap[idx] = collapse;
    });
    setCollapsedSections(newMap);
  };

  // Parse markdown into structured visual sections
  function parseMarkdownSections(markdown: string): ParsedNoteSection[] {
    if (!markdown) return [];

    const lines = markdown.split('\n');
    const sections: ParsedNoteSection[] = [];
    let currentTitle = 'Overview';
    let currentLines: string[] = [];

    const pushCurrent = () => {
      if (currentLines.length > 0 || currentTitle !== 'Overview') {
        const rawContent = currentLines.join('\n').trim();
        const lower = currentTitle.toLowerCase();
        let type: ParsedNoteSection['type'] = 'other';

        if (lower.includes('simple explanation') || lower.includes('explanation') || lower.includes('intuition')) {
          type = 'simple_explanation';
        } else if (lower.includes('key concepts') || lower.includes('core concepts') || lower.includes('principles')) {
          type = 'key_concepts';
        } else if (lower.includes('definitions') || lower.includes('important definitions') || lower.includes('terminology')) {
          type = 'important_definitions';
        } else if (lower.includes('examples') || lower.includes('example') || lower.includes('code') || lower.includes('walkthrough')) {
          type = 'examples';
        } else if (lower.includes('important points') || lower.includes('invariants') || lower.includes('rules')) {
          type = 'important_points';
        } else if (lower.includes('exam tips') || lower.includes('exam advice') || lower.includes('scoring')) {
          type = 'exam_tips';
        } else if (lower.includes('common mistakes') || lower.includes('pitfalls') || lower.includes('traps') || lower.includes('misconceptions')) {
          type = 'common_mistakes';
        } else if (lower.includes('quick revision') || lower.includes('checklist') || lower.includes('summary')) {
          type = 'quick_revision';
        }

        sections.push({
          title: currentTitle,
          type,
          content: rawContent,
        });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        pushCurrent();
        currentTitle = line.replace('## ', '').trim();
        currentLines = [];
      } else if (line.startsWith('# ') && sections.length === 0 && currentLines.length === 0) {
        // Main topic header - skip to avoid duplication with top header
        continue;
      } else {
        currentLines.push(line);
      }
    }
    pushCurrent();

    return sections;
  }

  // Handle note generation via backend API
  const handleGenerateNote = async (
    action: 'generate' | 'shorter' | 'detailed' | 'regenerate' = 'generate'
  ) => {
    setIsGenerating(true);
    setGeneratingAction(action);
    setGenerateError(null);
    setGenerationStep(0);

    const targetMaterial = allMaterials.find((m) => m.id === selectedMaterialId);
    const targetTopic = action === 'regenerate' || action === 'shorter' || action === 'detailed'
      ? (activeNote?.topic || genTopic)
      : (genTopic.trim() || 'Inheritance & Polymorphism');

    const targetSubject = action === 'regenerate' || action === 'shorter' || action === 'detailed'
      ? (activeNote?.subjectCode || genSubject)
      : genSubject;

    const targetStyle: NoteStyle = action === 'shorter'
      ? 'Quick Revision'
      : (activeNote?.style || genStyle);

    const targetLength: NoteLength = action === 'shorter'
      ? 'Short'
      : action === 'detailed'
      ? 'Detailed'
      : (activeNote?.length || genLength);

    try {
      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: targetSubject,
          topic: targetTopic,
          style: targetStyle,
          length: targetLength,
          materialTitle: targetMaterial?.title || activeNote?.sourceMaterialTitle || 'Lecture Notes',
          materialCategory: targetMaterial?.category || 'Lecture Notes',
          materialContent: targetMaterial?.fileContent || targetMaterial?.summarySnippet || '',
          action,
          currentMarkdown: activeNote?.contentMarkdown || '',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('Invalid response structure returned by AI note generator');
      }

      const genData = result.data;
      const newNoteId = action === 'regenerate' || action === 'shorter' || action === 'detailed'
        ? (activeNote?.id || `note-${Date.now()}`)
        : `note-${Date.now()}`;

      const newNoteItem: NoteItem = {
        id: newNoteId,
        subjectId: targetMaterial?.subjectId || 'subj-custom',
        subjectCode: targetSubject,
        title: genData.title || `${targetTopic} (${targetStyle})`,
        topic: genData.topic || targetTopic,
        category: targetStyle === 'Quick Revision' ? 'Cheat Sheet' : targetStyle === 'Exam Notes' ? 'High-Yield' : 'Summary',
        style: targetStyle,
        length: targetLength,
        sourceMaterialId: targetMaterial?.id,
        sourceMaterialTitle: targetMaterial?.title,
        dateModified: new Date().toISOString().split('T')[0],
        readTimeMin: genData.readTimeMin || (targetLength === 'Short' ? 3 : targetLength === 'Detailed' ? 10 : 6),
        tags: genData.tags || [targetSubject, targetTopic.split(' ')[0], targetStyle.replace(' ', '')],
        summary: genData.summary || `Synthesized study notes for ${targetTopic} in ${targetSubject}.`,
        keyTakeaways: genData.keyTakeaways || [],
        keyFormulas: genData.keyFormulas || [],
        contentMarkdown: genData.contentMarkdown || '',
        isPinned: activeNote?.isPinned || false,
      };

      if (action === 'shorter' || action === 'detailed' || action === 'regenerate') {
        // Replace existing note
        setNotes((prev) => prev.map((n) => (n.id === newNoteId ? newNoteItem : n)));
        setSelectedNoteId(newNoteId);
        saveNoteToFirestore(newNoteItem).catch((err) =>
          console.warn('Failed to save updated note to Firestore:', err)
        );
        showToast(
          action === 'shorter'
            ? 'Note condensed into high-density Quick Revision!'
            : action === 'detailed'
            ? 'Note expanded with detailed proofs and mechanisms!'
            : 'Note successfully regenerated!'
        );
      } else {
        // Prepend new note
        setNotes([newNoteItem, ...notes]);
        setSelectedNoteId(newNoteItem.id);
        setIsGenerateModalOpen(false);
        saveNoteToFirestore(newNoteItem).catch((err) =>
          console.warn('Failed to save new note to Firestore:', err)
        );
        recordNotesGenerated(targetSubject, newNoteItem.title);
        showToast('New AI Smart Note created successfully!');
      }
    } catch (err: any) {
      console.error('Error generating notes:', err);
      setGenerateError(err.message || 'Failed to synthesize note. Please check server logs and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Flashcard creation with topic
  const handleCreateFlashcards = () => {
    if (!activeNote) return;
    if (onCreateFlashcards) {
      onCreateFlashcards(activeNote.subjectCode, activeNote.topic);
    } else {
      onSelectSubject(activeNote.subjectCode);
      onNavigate('flashcards');
    }
  };

  // Trigger Quiz creation with topic
  const handleCreateQuiz = () => {
    if (!activeNote) return;
    if (onCreateQuiz) {
      onCreateQuiz(activeNote.subjectCode, activeNote.topic);
    } else {
      onSelectSubject(activeNote.subjectCode);
      onNavigate('quiz');
    }
  };

  const parsedSections = parseMarkdownSections(activeNote?.contentMarkdown || '');

  // Helper for section styling icons and colors
  const getSectionMetadata = (type: ParsedNoteSection['type']) => {
    switch (type) {
      case 'simple_explanation':
        return {
          icon: Lightbulb,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badge: 'Intuition & Overview',
          headerBg: 'bg-amber-50/50',
        };
      case 'key_concepts':
        return {
          icon: Layers,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badge: 'Core Mechanisms',
          headerBg: 'bg-indigo-50/40',
        };
      case 'important_definitions':
        return {
          icon: Bookmark,
          color: 'text-sky-600 bg-sky-50 border-sky-200',
          badge: 'Glossary & Invariants',
          headerBg: 'bg-sky-50/40',
        };
      case 'examples':
        return {
          icon: Code2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badge: 'Code & Worked Problems',
          headerBg: 'bg-emerald-50/40',
        };
      case 'important_points':
        return {
          icon: CheckCircle2,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          badge: 'High-Yield Rules',
          headerBg: 'bg-purple-50/40',
        };
      case 'exam_tips':
        return {
          icon: GraduationCap,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badge: 'Exam Scorer Advice',
          headerBg: 'bg-rose-50/40',
        };
      case 'common_mistakes':
        return {
          icon: AlertTriangle,
          color: 'text-amber-700 bg-amber-100/70 border-amber-300',
          badge: 'Pitfalls & Traps',
          headerBg: 'bg-amber-100/30',
        };
      case 'quick_revision':
        return {
          icon: Zap,
          color: 'text-teal-600 bg-teal-50 border-teal-200',
          badge: 'Pre-Exam Active Recall',
          headerBg: 'bg-teal-50/40',
        };
      default:
        return {
          icon: FileText,
          color: 'text-slate-600 bg-slate-50 border-slate-200',
          badge: 'Topic Breakdown',
          headerBg: 'bg-slate-50/40',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Smart Notes & Cheat Sheets</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Gemini Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transform course study materials into structured, high-yield, exam-ready revision notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes, topics, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Notes</span>
          </button>
        </div>
      </div>

      {/* Style & Subject Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Style:
          </span>
          {['ALL', 'Quick Revision', 'Detailed Notes', 'Exam Notes', 'Beginner Friendly'].map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyleFilter(style)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedStyleFilter === style
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {style === 'ALL' ? 'All Styles' : style}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Subject Filter:</span>
          <select
            value={selectedSubject}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id || s.code} value={s.code}>
                {s.code} ({s.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Note Explorer & Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Note List (4.5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notes Directory ({filteredNotes.length})
            </span>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New Note</span>
            </button>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">No notes match criteria</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Try clearing your search filters or generate a fresh note from your study material.
                </p>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate New Note</span>
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/60 border-indigo-400/80 shadow-xs ring-1 ring-indigo-400/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {note.subjectCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {note.style || note.category}
                      </span>
                      {note.length && (
                        <span className="text-[10px] font-medium text-slate-500">
                          • {note.length}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button
                        onClick={(e) => handleTogglePin(note.id, e)}
                        className="hover:text-amber-500 transition-colors p-0.5"
                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                      >
                        <Pin
                          className={`w-3.5 h-3.5 ${
                            note.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] flex items-center gap-0.5 text-slate-500">
                        <Clock className="w-3 h-3" /> {note.readTimeMin}m
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                    {note.title}
                  </h4>

                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {note.summary}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex flex-wrap gap-1 max-w-[70%]">
                      {note.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">{note.dateModified}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Note Reader & Interactive Sections (7.5 cols) */}
        {activeNote ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Note Reader Top Header */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-600 text-white">
                    {activeNote.subjectCode}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {activeNote.style || 'Quick Revision'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {activeNote.readTimeMin} min read
                  </span>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setViewMode('structured')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'structured' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Structured View
                  </button>
                  <button
                    onClick={() => setViewMode('markdown')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      viewMode === 'markdown' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Raw Markdown
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                  {activeNote.title}
                </h3>
                {activeNote.sourceMaterialTitle && (
                  <p className="text-xs text-indigo-700 font-medium mt-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>Synthesized from: {activeNote.sourceMaterialTitle}</span>
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {activeNote.summary}
                </p>
              </div>

              {/* Action Toolbar: Copy, Regenerate, Shorter, More Detailed, Flashcards, Quiz */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {/* 1. Copy */}
                <button
                  onClick={handleCopyNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                >
                  {copiedNote ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{copiedNote ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* 2. Regenerate */}
                <button
                  onClick={() => handleGenerateNote('regenerate')}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  title="Re-run note generation with current parameters"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isGenerating && generatingAction === 'regenerate' ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                {/* 3. Make Shorter */}
                <button
                  onClick={() => handleGenerateNote('shorter')}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  title="Condense this note into high-density revision bullet points"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Make Shorter</span>
                </button>

                {/* 4. Make More Detailed */}
                <button
                  onClick={() => handleGenerateNote('detailed')}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  title="Expand on mechanisms, subtle edge cases, and worked proofs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Make More Detailed</span>
                </button>

                {/* 5. Create Flashcards */}
                <button
                  onClick={handleCreateFlashcards}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors shadow-2xs border border-indigo-100"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Create Flashcards</span>
                </button>

                {/* 6. Create Quiz */}
                <button
                  onClick={handleCreateQuiz}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Create Quiz</span>
                </button>
              </div>
            </div>

            {/* In-progress refinement loading banner */}
            {isGenerating && (
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200/80 space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>
                      {generatingAction === 'shorter'
                        ? 'Distilling into ultra-dense Quick Revision...'
                        : generatingAction === 'detailed'
                        ? 'Expanding deep-dive architectural mechanisms & proofs...'
                        : 'Synthesizing structured notes with Gemini...'}
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-600">
                    Step {generationStep + 1} of 4
                  </span>
                </div>
                <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(generationStep + 1) * 25}%` }}
                  />
                </div>
                <p className="text-[11px] text-indigo-700">
                  {generationStep === 0 && 'Analyzing selected study material content...'}
                  {generationStep === 1 && 'Extracting core invariants and terminology...'}
                  {generationStep === 2 && 'Structuring exam tips and dynamic code examples...'}
                  {generationStep === 3 && 'Finalizing active recall summary and checklists...'}
                </p>
              </div>
            )}

            {/* Generation error alert */}
            {generateError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Note Generation Error</span>
                </div>
                <p className="text-[11px] text-rose-700">{generateError}</p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => handleGenerateNote('regenerate')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Generation</span>
                  </button>
                </div>
              </div>
            )}

            {/* High-Yield Exam Takeaways Highlight Box */}
            {activeNote.keyTakeaways && activeNote.keyTakeaways.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Bookmark className="w-4 h-4 text-amber-600" />
                    <span>High-Yield Takeaways (Must Know for Exam)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/60 text-amber-800">
                    {activeNote.keyTakeaways.length} Key Points
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-950">
                  {activeNote.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Mathematical / Invariant Formulas Box (if available) */}
            {activeNote.keyFormulas && activeNote.keyFormulas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Important Mathematical Invariants & Rules</span>
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {activeNote.keyFormulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-1.5 shadow-xs"
                    >
                      <div className="text-[11px] font-semibold text-indigo-300">
                        {f.name}
                      </div>
                      <div className="font-mono text-xs bg-slate-800/80 p-2.5 rounded-lg text-emerald-300 overflow-x-auto">
                        {f.formula}
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed">{f.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note Content Display Modes */}
            {viewMode === 'markdown' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Raw Markdown Document</span>
                  <button
                    onClick={handleCopyNote}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Markdown</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                  {activeNote.contentMarkdown}
                </div>
              </div>
            ) : (
              /* Structured Interactive Sections View */
              <div className="space-y-4">
                {/* Global Expand/Collapse controls */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Structured Note Sections ({parsedSections.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAllSections(false)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Expand All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => toggleAllSections(true)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                {/* Render Each Section as an Elegant Card */}
                {parsedSections.map((section, idx) => {
                  const meta = getSectionMetadata(section.type);
                  const IconComponent = meta.icon;
                  const isCollapsed = collapsedSections[idx];

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs transition-all hover:border-slate-300"
                    >
                      {/* Section Card Header */}
                      <div
                        onClick={() => toggleSectionCollapse(idx)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer select-none transition-colors ${meta.headerBg} hover:bg-slate-100/70`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border ${meta.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {section.title}
                            </h4>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              {meta.badge}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySection(idx, section.content);
                            }}
                            className="p-1 rounded-md hover:text-slate-700 hover:bg-white/80 transition-colors"
                            title="Copy this section"
                          >
                            {copiedSectionIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Section Body */}
                      {!isCollapsed && (
                        <div className="p-4 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100 bg-white">
                          {/* Code block formatted rendering if contains ``` */}
                          {section.content.includes('```') ? (
                            <div className="space-y-2">
                              {section.content.split('```').map((part, pIdx) => {
                                if (pIdx % 2 === 1) {
                                  // Code block
                                  const [lang, ...codeLines] = part.split('\n');
                                  return (
                                    <div
                                      key={pIdx}
                                      className="my-2 rounded-xl bg-slate-900 text-slate-100 p-3 font-mono text-xs overflow-x-auto shadow-xs"
                                    >
                                      {lang.trim() && (
                                        <div className="text-[10px] font-bold text-indigo-400 mb-1 uppercase">
                                          {lang.trim()}
                                        </div>
                                      )}
                                      <pre className="text-emerald-300 leading-relaxed whitespace-pre-wrap">
                                        {codeLines.join('\n').trim()}
                                      </pre>
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    key={pIdx}
                                    className="whitespace-pre-line text-slate-700 leading-relaxed"
                                  >
                                    {part.trim()}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                              {section.content}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Cross-Feature Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2.5 justify-between items-center bg-slate-50/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl">
              <div className="text-xs text-slate-500 font-medium">
                Topic: <span className="font-bold text-slate-800">{activeNote.topic}</span> in {activeNote.subjectCode}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateFlashcards}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Practice as Flashcards</span>
                </button>

                <button
                  onClick={handleCreateQuiz}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Generate Quiz from Note</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-800">No Note Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select an existing note from the directory or generate a new structured note from your study documents.
              </p>
            </div>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Notes from Material</span>
            </button>
          </div>
        )}
      </div>

      {/* Generate AI Note Modal (Full Workflow) */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generate AI Smart Note</h3>
                  <p className="text-xs text-slate-500">Transform study material into structured revision notes</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateNote('generate');
              }}
              className="space-y-4 text-xs"
            >
              {/* Step 1: Select Subject & Material */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span>Select Study Material</span>
                  </label>
                  <select
                    value={genSubject}
                    onChange={(e) => {
                      setGenSubject(e.target.value);
                      const firstMat = allMaterials.find((m) => m.subjectCode === e.target.value);
                      if (firstMat) {
                        setSelectedMaterialId(firstMat.id);
                        if (firstMat.topic) setGenTopic(firstMat.topic);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    {subjects.map((s) => (
                      <option key={s.id || s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Source Document / Handout
                  </label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {availableMaterials.length > 0 ? (
                      availableMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.subjectCode}] {m.title} ({m.category || m.type})
                        </option>
                      ))
                    ) : (
                      <option value="custom">General Course Material & Syllabus</option>
                    )}
                  </select>

                  {/* Material Context Preview Snippet */}
                  {selectedMaterialId && (
                    <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/70 italic line-clamp-2">
                      {allMaterials.find((m) => m.id === selectedMaterialId)?.summarySnippet ||
                        'Source material excerpt indexed and ready for Gemini note synthesis.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Select Topic / Chapter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span>Topic or Chapter Focus</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inheritance & Dynamic Dispatch, AVL Balance Rotations, Enolate Additions"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Step 3: Choose Note Style */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  <span>Choose Note Style</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'Quick Revision',
                      desc: 'High-density recall bullet points, fast checklist',
                      icon: Zap,
                    },
                    {
                      id: 'Detailed Notes',
                      desc: 'Comprehensive theory, mechanisms, and deep dive',
                      icon: BookOpen,
                    },
                    {
                      id: 'Exam Notes',
                      desc: 'Focus on high-scoring answers & frequent exam traps',
                      icon: GraduationCap,
                    },
                    {
                      id: 'Beginner Friendly',
                      desc: 'Plain English, simple analogies, zero jargon',
                      icon: Lightbulb,
                    },
                  ].map((styleOption) => {
                    const isSelected = genStyle === styleOption.id;
                    const Icon = styleOption.icon;
                    return (
                      <div
                        key={styleOption.id}
                        onClick={() => setGenStyle(styleOption.id as NoteStyle)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-500 shadow-2xs ring-1 ring-indigo-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`font-bold text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {styleOption.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          {styleOption.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Choose Length */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  <span>Choose Length</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Short', label: 'Short (~3 min read)', desc: '1-2 page summary' },
                    { id: 'Medium', label: 'Medium (~6 min read)', desc: 'Standard balanced' },
                    { id: 'Detailed', label: 'Detailed (~12 min read)', desc: 'Full deep dive' },
                  ].map((len) => {
                    const isSelected = genLength === len.id;
                    return (
                      <button
                        type="button"
                        key={len.id}
                        onClick={() => setGenLength(len.id as NoteLength)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs">{len.id}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {len.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end items-center">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !genTopic.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Notes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
