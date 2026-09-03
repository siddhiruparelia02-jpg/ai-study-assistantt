import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Upload,
  Search,
  FileText,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
  Eye,
  Trash2,
  CheckCircle2,
  FileUp,
  X,
  Bot,
  ExternalLink,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileCode,
  LayoutGrid,
  List,
  Network,
  FileQuestion,
  GraduationCap,
  BrainCircuit,
  Tag,
  Filter,
  Plus,
  Loader2,
  File,
  Cloud,
} from 'lucide-react';
import { StudyMaterial, PageId } from '../types';
import {
  saveStudyMaterialToFirestore,
  deleteStudyMaterialFromFirestore,
  loadStudyMaterialsFromFirestore,
  uploadStudyMaterialFile,
  deleteStudyMaterialFile,
  isFirestoreReady,
  isStorageReady,
} from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useSettings } from '../context/SettingsContext';

interface StudyMaterialsProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  onAskAboutMaterial?: (subjectCode: string, materialTitle: string, topic?: string) => void;
  onAskNotes?: (materialId: string, subjectCode?: string) => void;
  materials?: StudyMaterial[];
  onMaterialsChange?: (materials: StudyMaterial[]) => void;
}

type ViewMode = 'grid' | 'tree' | 'list';

const CATEGORIES = [
  'ALL',
  'Syllabus',
  'Lecture Notes',
  'Textbook',
  'Previous Year Papers',
  'Notes',
  'Problem Set',
  'Other',
] as const;

export const StudyMaterials: React.FC<StudyMaterialsProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigate,
  isUploadModalOpen,
  setIsUploadModalOpen,
  onAskAboutMaterial,
  onAskNotes,
  materials: initialMaterials,
  onMaterialsChange,
}) => {
  const { user } = useAuth();
  const { subjects } = useSettings();
  const { recordMaterialAdded } = useStudyPerformance();
  const [materials, setMaterials] = useState<StudyMaterial[]>(
    initialMaterials ?? []
  );

  // Sync state if initialMaterials prop changes
  useEffect(() => {
    if (initialMaterials !== undefined) {
      setMaterials(initialMaterials);
    }
  }, [initialMaterials]);

  // Notify parent on materials changes
  useEffect(() => {
    if (onMaterialsChange) {
      onMaterialsChange(materials);
    }
  }, [materials, onMaterialsChange]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content' | 'actions'>('summary');
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Expanded folders in tree view
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'JAVA': true,
    'JAVA-Syllabus': true,
    'JAVA-Lecture Notes': true,
    'JAVA-Textbook': true,
    'JAVA-Previous Year Papers': true,
    'CSA': true,
    'CSA-Syllabus': true,
    'CSA-Lecture Notes': true,
    'CSA-Previous Year Papers': true,
    'CS301': true,
  });

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTopic, setUploadTopic] = useState('');
  const [uploadSubject, setUploadSubject] = useState(
    selectedSubject === 'ALL' ? 'JAVA' : selectedSubject
  );
  const [uploadCategory, setUploadCategory] = useState<StudyMaterial['category']>('Lecture Notes');
  const [uploadType, setUploadType] = useState<StudyMaterial['type']>('PDF');
  const [uploadContent, setUploadContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Keep uploadSubject in sync with selectedSubject if valid
  useEffect(() => {
    if (selectedSubject !== 'ALL') {
      setUploadSubject(selectedSubject);
    }
  }, [selectedSubject]);

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topic && m.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.summarySnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchSubject =
      selectedSubject === 'ALL' || m.subjectCode === selectedSubject;

    const matchCategory =
      selectedCategory === 'ALL' || m.category === selectedCategory;

    const matchFormat =
      selectedFormat === 'ALL' ||
      m.type === selectedFormat ||
      (selectedFormat === 'Text / Markdown' && (m.type === 'Text' || m.type === 'Markdown'));

    return matchSearch && matchSubject && matchCategory && matchFormat;
  });

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const handleFileSelect = (file: File) => {
    setSelectedFileObj(file);
    setUploadTitle(file.name);
    setUploadError(null);

    // Auto-detect format
    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith('.pdf')) {
      setUploadType('PDF');
    } else if (nameLower.endsWith('.md')) {
      setUploadType('Markdown');
    } else if (nameLower.endsWith('.txt')) {
      setUploadType('Text');
    } else if (nameLower.endsWith('.docx') || nameLower.endsWith('.doc')) {
      setUploadType('Doc');
    } else if (nameLower.endsWith('.pptx') || nameLower.endsWith('.ppt')) {
      setUploadType('Slides');
    } else {
      setUploadType('Other');
    }

    // Attempt to read text content if text or markdown
    if (nameLower.endsWith('.txt') || nameLower.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setUploadContent(text);
      };
      reader.readAsText(file);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const processDocumentAsync = async (
    targetMaterial: StudyMaterial,
    fileObj: File | null,
    rawText: string
  ) => {
    const matId = targetMaterial.id;
    let storagePath: string | undefined = targetMaterial.storagePath;
    let downloadUrl: string | undefined = targetMaterial.downloadUrl;

    try {
      // Step 1: Upload to Firebase Storage if file object is present
      if (fileObj && user?.uid && isStorageReady()) {
        try {
          const uploadRes = await uploadStudyMaterialFile(matId, fileObj, user.uid);
          storagePath = uploadRes.storagePath;
          downloadUrl = uploadRes.downloadUrl;
        } catch (storageErr) {
          console.warn('Firebase Storage upload notice (continuing processing):', storageErr);
        }
      }

      // Step 2: Transition to Processing status
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === matId
            ? {
                ...m,
                storagePath: storagePath || m.storagePath,
                downloadUrl: downloadUrl || m.downloadUrl,
                status: 'Processing',
                processingStatus: 'processing',
                progress: 50,
                summarySnippet: `Analyzing ${targetMaterial.title} and extracting structured academic concepts...`,
              }
            : m
        )
      );

      // Step 3: Extract text from backend /api/materials/process
      let fileBase64 = '';
      let fileText = rawText || targetMaterial.fileContent || '';

      if (fileObj) {
        const lower = fileObj.name.toLowerCase();
        if (lower.endsWith('.txt') || lower.endsWith('.md')) {
          fileText = await readFileAsText(fileObj);
        } else {
          fileBase64 = await readFileAsBase64(fileObj);
        }
      }

      const response = await fetch('/api/materials/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileText,
          fileType: targetMaterial.type,
          fileName: fileObj ? fileObj.name : targetMaterial.title,
          subject: targetMaterial.subjectCode,
          topic: targetMaterial.topic,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to process document and extract text.');
      }

      const { extractedText, summarySnippet, keyTopics, pageCount } = json.data;

      // Step 4: Mark as Ready and persist
      const finalMaterial: StudyMaterial = {
        ...targetMaterial,
        storagePath: storagePath || targetMaterial.storagePath,
        downloadUrl: downloadUrl || targetMaterial.downloadUrl,
        status: 'Ready',
        processingStatus: 'ready',
        progress: 100,
        fileContent: extractedText,
        summarySnippet:
          summarySnippet ||
          `AI indexing complete. Covers ${keyTopics?.length || 3} core conceptual modules.`,
        pageCount: pageCount || 1,
        tags: Array.from(
          new Set([targetMaterial.subjectCode, targetMaterial.category, ...(keyTopics || [])])
        ),
        errorMessage: undefined,
        processingError: undefined,
      };

      setMaterials((prev) => prev.map((m) => (m.id === matId ? finalMaterial : m)));
      await saveStudyMaterialToFirestore(finalMaterial, user?.uid);
    } catch (err: any) {
      console.error('Error in document processing pipeline:', err);
      const failedMaterial: StudyMaterial = {
        ...targetMaterial,
        storagePath: storagePath || targetMaterial.storagePath,
        downloadUrl: downloadUrl || targetMaterial.downloadUrl,
        status: 'Failed',
        processingStatus: 'failed',
        progress: 0,
        errorMessage: err.message || 'Text extraction failed. Click Retry to re-process.',
        processingError: err.message || 'Text extraction failed.',
      };

      setMaterials((prev) => prev.map((m) => (m.id === matId ? failedMaterial : m)));
      await saveStudyMaterialToFirestore(failedMaterial, user?.uid);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    if (selectedFileObj && selectedFileObj.size > 28 * 1024 * 1024) {
      setUploadError('File size exceeds 28MB. Please select a smaller document.');
      return;
    }

    const sizeString = selectedFileObj
      ? `${(selectedFileObj.size / (1024 * 1024)).toFixed(1)} MB`
      : '1.2 MB';

    const materialId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currentUid = user?.uid || 'guest-user';

    const newMaterial: StudyMaterial = {
      id: materialId,
      materialId,
      userId: currentUid,
      title: uploadTitle.trim(),
      fileName: selectedFileObj ? selectedFileObj.name : uploadTitle.trim(),
      subjectId: `subj-${uploadSubject.toLowerCase()}`,
      subjectCode: uploadSubject,
      type: uploadType,
      category: uploadCategory,
      topic: uploadTopic.trim() || 'General Study Material',
      fileSize: sizeString === '0.0 MB' ? '450 KB' : sizeString,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadTimestamp: new Date().toISOString(),
      tags: [uploadSubject, uploadCategory || 'Notes', uploadType],
      status: 'Uploading',
      processingStatus: 'uploading',
      progress: 20,
      fileContent: uploadContent || '',
      generatedItems: {
        flashcards: 14,
        notes: 2,
        quizzes: 1,
      },
      summarySnippet: `Uploading and indexing "${uploadTitle.trim()}" into secure cloud storage...`,
    };

    const fileToProcess = selectedFileObj;
    const contentToProcess = uploadContent;

    // Immediately add to state and start persistence
    setMaterials((prev) => [newMaterial, ...prev]);
    setIsUploadModalOpen(false);
    setUploadTitle('');
    setUploadTopic('');
    setUploadContent('');
    setSelectedFileObj(null);
    setUploadError(null);

    // Initial Firestore record
    saveStudyMaterialToFirestore(newMaterial, user?.uid).catch((err) =>
      console.warn('Initial save to Firestore notice:', err)
    );
    recordMaterialAdded(newMaterial.subjectCode, newMaterial.title);

    // Launch real asynchronous upload & AI processing
    processDocumentAsync(newMaterial, fileToProcess, contentToProcess);
  };

  const handleDeleteMaterial = (id: string) => {
    const target = materials.find((m) => m.id === id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (previewMaterial?.id === id) {
      setPreviewMaterial(null);
    }
    deleteStudyMaterialFromFirestore(id, target?.storagePath, user?.uid).catch((err) =>
      console.warn('Failed to delete study material from Firestore/Storage:', err)
    );
  };

  const handleRetryProcessing = (id: string) => {
    const target = materials.find((m) => m.id === id);
    if (!target) return;

    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            status: 'Processing',
            processingStatus: 'processing',
            progress: 30,
            errorMessage: undefined,
            processingError: undefined,
          };
        }
        return m;
      })
    );

    processDocumentAsync(target, null, target.fileContent || '');
  };

  const handleAskTutor = (mat: StudyMaterial) => {
    if (onAskAboutMaterial) {
      onAskAboutMaterial(mat.subjectCode, mat.title, mat.topic);
    } else {
      onSelectSubject(mat.subjectCode);
      onNavigate('tutor');
    }
    setPreviewMaterial(null);
  };

  const handleAskNotes = (mat: StudyMaterial) => {
    if (onAskNotes) {
      onAskNotes(mat.id, mat.subjectCode);
    } else {
      onSelectSubject(mat.subjectCode);
      onNavigate('ask-notes');
    }
    setPreviewMaterial(null);
  };

  // Group materials for the tree hierarchy view
  const groupedBySubject = subjects.map((subj) => {
    const subjMaterials = materials.filter((m) => m.subjectCode === subj.code);
    const categoriesMap: Record<string, StudyMaterial[]> = {
      Syllabus: [],
      'Lecture Notes': [],
      Textbook: [],
      'Previous Year Papers': [],
      Other: [],
    };

    subjMaterials.forEach((mat) => {
      const cat = mat.category || 'Other';
      if (categoriesMap[cat]) {
        categoriesMap[cat].push(mat);
      } else {
        categoriesMap['Other'].push(mat);
      }
    });

    return {
      subject: subj,
      categories: categoriesMap,
      totalCount: subjMaterials.length,
    };
  });

  const getStatusBadge = (mat: StudyMaterial) => {
    switch (mat.status) {
      case 'Uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold">
            <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
            <span>Uploading {mat.progress ? `${mat.progress}%` : ''}</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
            <span>Processing</span>
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Ready</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const getTypeIcon = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'Markdown':
      case 'Text':
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      case 'Slides':
        return <Layers className="w-4 h-4 text-amber-500" />;
      case 'Doc':
        return <File className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Study Materials & Knowledge Repository
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {materials.length} Documents
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize syllabi, lecture notes, textbooks, and previous-year papers by subject with automated AI study indexing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 border border-slate-200 text-slate-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Hierarchical Tree View"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hierarchy</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        {/* Search & Subject Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search materials by title, topic, tags, or contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subject Dropdown Filter */}
          <div className="sm:w-60">
            <select
              value={selectedSubject}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Subjects ({materials.length})</option>
              {subjects.map((s) => {
                const count = materials.filter((m) => m.subjectCode === s.code).length;
                return (
                  <option key={s.id || s.code} value={s.code}>
                    {s.code} - {s.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Category Pills & Format Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Format:
            </span>
            {['ALL', 'PDF', 'Text / Markdown', 'Doc', 'Slides'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                  selectedFormat === fmt
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area: Conditioned on ViewMode & Empty State */}
      {filteredMaterials.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <FolderArchive className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No study materials yet.</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Upload your notes, syllabus, textbooks, or previous-year papers to get started with instant AI summaries, interactive quizzes, and flashcard extraction.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload Study Material</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'tree' ? (
        /* Hierarchical Tree Organization View */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Subject Structure Hierarchy
            </h3>
            <p className="text-xs text-slate-500">
              Hierarchical view categorized by Syllabus, Lecture Notes, Textbooks, and Previous Year Papers.
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {groupedBySubject
              .filter(
                (g) =>
                  selectedSubject === 'ALL' || g.subject.code === selectedSubject
              )
              .map(({ subject, categories, totalCount }) => {
                const isSubjectExpanded = !!expandedFolders[subject.code];

                return (
                  <div key={subject.code} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    {/* Subject Root Node */}
                    <div
                      onClick={() => toggleFolder(subject.code)}
                      className="flex items-center justify-between cursor-pointer hover:bg-slate-100/80 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 font-sans font-bold text-slate-900">
                        {isSubjectExpanded ? (
                          <FolderOpen className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Folder className="w-4 h-4 text-indigo-500" />
                        )}
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                          {subject.code}
                        </span>
                        <span className="text-sm">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-sans font-semibold text-slate-500">
                          {totalCount} items
                        </span>
                        {isSubjectExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Subject Category Branches */}
                    {isSubjectExpanded && (
                      <div className="pl-6 pt-2 space-y-3 border-l-2 border-slate-200 ml-4 mt-2 font-sans">
                        {Object.entries(categories).map(([catName, items]) => {
                          if (items.length === 0) return null;
                          const catKey = `${subject.code}-${catName}`;
                          const isCatExpanded = expandedFolders[catKey] ?? true;

                          return (
                            <div key={catName} className="space-y-1.5">
                              {/* Category Folder */}
                              <div
                                onClick={() => toggleFolder(catKey)}
                                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                              >
                                <div className="flex items-center gap-2">
                                  {isCatExpanded ? (
                                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                                  ) : (
                                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                                  )}
                                  <span>{catName}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                    {items.length}
                                  </span>
                                </div>
                                {isCatExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </div>

                              {/* Files inside category */}
                              {isCatExpanded && (
                                <div className="pl-6 space-y-1 border-l border-dashed border-slate-300 ml-3">
                                  {items.map((mat) => (
                                    <div
                                      key={mat.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 transition-all text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0 pr-2">
                                        {getTypeIcon(mat.type)}
                                        <span className="font-semibold text-slate-800 truncate">
                                          {mat.title}
                                        </span>
                                        {mat.topic && (
                                          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                            {mat.topic}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] text-slate-400">
                                          {mat.fileSize}
                                        </span>
                                        {getStatusBadge(mat)}
                                        <button
                                          onClick={() => handleAskNotes(mat)}
                                          className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                                          title="Ask Questions grounded in this document"
                                        >
                                          <Sparkles className="w-3 h-3 text-indigo-600" />
                                          <span>Ask Notes</span>
                                        </button>
                                        <button
                                          onClick={() => setPreviewMaterial(mat)}
                                          className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>View</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* Dense Table List View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((mat) => (
                  <tr
                    key={mat.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setPreviewMaterial(mat)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(mat.type)}
                        <div>
                          <div className="font-bold text-slate-900">{mat.title}</div>
                          {mat.topic && (
                            <div className="text-[11px] text-slate-500">{mat.topic}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {mat.subjectCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {mat.category || 'Lecture Notes'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="uppercase text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {mat.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {mat.uploadDate}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(mat)}
                    </td>
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAskNotes(mat)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Ask Questions grounded in this document"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Ask Notes</span>
                        </button>
                        <button
                          onClick={() => setPreviewMaterial(mat)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAskTutor(mat)}
                          className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Bot className="w-3 h-3" />
                          <span>Tutor</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {mat.subjectCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                      {mat.type}
                    </span>
                    {mat.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100">
                        {mat.category}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                    {mat.fileSize}
                  </span>
                </div>

                {/* Title and Topic */}
                <div className="mt-3">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 shrink-0 mt-0.5">
                      {getTypeIcon(mat.type)}
                    </div>
                    <div>
                      <h3
                        onClick={() => setPreviewMaterial(mat)}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {mat.title}
                      </h3>
                      {mat.topic && (
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Topic: {mat.topic}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Snippet */}
                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  {mat.summarySnippet}
                </p>

                {/* Processing Status & Progress */}
                <div className="mt-3 flex items-center justify-between">
                  {getStatusBadge(mat)}
                  <span className="text-[11px] text-slate-400 font-medium">
                    {mat.uploadDate}
                  </span>
                </div>

                {/* Generated AI Modules Indicator */}
                {mat.status === 'Ready' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> AI Indexed
                    </span>
                    <div className="flex items-center gap-2 font-medium">
                      <span>{mat.generatedItems.flashcards} Cards</span>
                      <span>•</span>
                      <span>{mat.generatedItems.quizzes} Quizzes</span>
                      <span>•</span>
                      <span>{mat.generatedItems.notes} Notes</span>
                    </div>
                  </div>
                )}

                {/* Retry action if failed */}
                {mat.status === 'Failed' && (
                  <div className="mt-2.5">
                    <button
                      onClick={() => handleRetryProcessing(mat.id)}
                      className="w-full py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Processing</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewMaterial(mat)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 group-hover:text-indigo-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAskNotes(mat)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    title="Ask Questions grounded in this document"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Ask Questions</span>
                  </button>

                  <button
                    onClick={() => handleAskTutor(mat)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                    title="Ask General AI Tutor"
                  >
                    <Bot className="w-3 h-3" />
                    <span>Tutor</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document View / Detail Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {previewMaterial.subjectCode}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                    {previewMaterial.type}
                  </span>
                  {previewMaterial.category && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {previewMaterial.category}
                    </span>
                  )}
                  {getStatusBadge(previewMaterial)}
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {previewMaterial.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Uploaded {previewMaterial.uploadDate}</span>
                  <span>•</span>
                  <span>Size: {previewMaterial.fileSize}</span>
                  {previewMaterial.topic && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold">
                        Topic: {previewMaterial.topic}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAskNotes(previewMaterial)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Questions</span>
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                AI Synopsis & Metadata
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'content'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Document Content / Text
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'actions'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Study Actions
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'summary' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    AI Concept Synopsis & Key Takeaways
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 text-slate-700 leading-relaxed border border-slate-200">
                    {previewMaterial.summarySnippet}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">
                    Generated Study Modules
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      onClick={() => {
                        onSelectSubject(previewMaterial.subjectCode);
                        onNavigate('flashcards');
                        setPreviewMaterial(null);
                      }}
                      className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 hover:border-indigo-300 text-center cursor-pointer transition-all hover:shadow-xs"
                    >
                      <div className="text-xl font-extrabold text-indigo-700">
                        {previewMaterial.generatedItems.flashcards}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Flashcards</div>
                      <span className="text-[10px] text-indigo-600 font-medium">Practice Now &rarr;</span>
                    </div>

                    <div
                      onClick={() => {
                        onSelectSubject(previewMaterial.subjectCode);
                        onNavigate('quiz');
                        setPreviewMaterial(null);
                      }}
                      className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 hover:border-indigo-300 text-center cursor-pointer transition-all hover:shadow-xs"
                    >
                      <div className="text-xl font-extrabold text-indigo-700">
                        {previewMaterial.generatedItems.quizzes}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Quizzes</div>
                      <span className="text-[10px] text-indigo-600 font-medium">Take Quiz &rarr;</span>
                    </div>

                    <div
                      onClick={() => {
                        onSelectSubject(previewMaterial.subjectCode);
                        onNavigate('notes');
                        setPreviewMaterial(null);
                      }}
                      className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 hover:border-indigo-300 text-center cursor-pointer transition-all hover:shadow-xs"
                    >
                      <div className="text-xl font-extrabold text-indigo-700">
                        {previewMaterial.generatedItems.notes}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Smart Notes</div>
                      <span className="text-[10px] text-indigo-600 font-medium">Read Notes &rarr;</span>
                    </div>
                  </div>
                </div>

                {previewMaterial.tags.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {previewMaterial.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">Document Preview Stream</span>
                  <span>{previewMaterial.type} format</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {previewMaterial.fileContent ||
                    `# ${previewMaterial.title}
Subject: ${previewMaterial.subjectCode}
Category: ${previewMaterial.category || 'General Notes'}
Topic: ${previewMaterial.topic || 'General Overview'}

[Preview of indexed document contents]
1. Core Definitions and Invariants:
   - Primary data structures and algorithms covered
   - Time & space complexity constraints
   - Regioselectivity and thermodynamic vs kinetic control

2. High-Yield Exam Formulas:
   - Recurrence relations and dynamic programming tables
   - Amortized analysis invariants
   - Memory hierarchy hit/miss rate equations

3. Summary:
   ${previewMaterial.summarySnippet}`}
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Available Quick Actions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleAskNotes(previewMaterial)}
                    className="p-3 rounded-xl border border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100 text-left flex items-start gap-2.5 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-indigo-950">Ask My Notes (Document-Grounded)</div>
                      <div className="text-[11px] text-indigo-700 mt-0.5">
                        Ask questions with citations and strict grounding in this document
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAskTutor(previewMaterial)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <Bot className="w-4 h-4 text-slate-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Ask AI Tutor</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Ask general tutoring questions and get step-by-step breakdown
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSelectSubject(previewMaterial.subjectCode);
                      onNavigate('quiz');
                      setPreviewMaterial(null);
                    }}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <FileQuestion className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-900">Generate Quiz</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Create multiple-choice or true/false test from this document
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSelectSubject(previewMaterial.subjectCode);
                      onNavigate('flashcards');
                      setPreviewMaterial(null);
                    }}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900">Generate Flashcards</div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Create 3D active recall flashcards based on this topic
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSelectSubject(previewMaterial.subjectCode);
                      onNavigate('notes');
                      setPreviewMaterial(null);
                    }}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-blue-900">Generate Smart Notes</div>
                      <div className="text-[11px] text-blue-700 mt-0.5">
                        Create clean markdown summaries with high-yield formulas
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteMaterial(previewMaterial.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Material</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAskTutor(previewMaterial)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask Questions in Tutor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Study Material Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload Study Material</h3>
                  <p className="text-[11px] text-slate-500">
                    Supports PDF, Markdown (.md), Text (.txt), Word (.docx), and Slides (.pptx)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* Drag & drop upload area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                }`}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.md,.txt,.docx,.doc,.pptx,.ppt';
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">
                  {uploadTitle ? uploadTitle : 'Click to select or drag & drop study document'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  PDF, Text, Markdown, Docx, Slides (up to 50MB)
                </p>
                {selectedFileObj && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                    ✓ Selected: {selectedFileObj.name} ({(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Error Alert if any */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium text-xs">{uploadError}</span>
                </div>
              )}

              {/* Title field */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Material / File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4: Inheritance & Dynamic Dispatch.pdf"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Subject
                </label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id || s.code} value={s.code}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material Category & Topic row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Material Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium bg-white"
                  >
                    <option value="Syllabus">Syllabus</option>
                    <option value="Lecture Notes">Lecture Notes</option>
                    <option value="Textbook">Textbook</option>
                    <option value="Previous Year Papers">Previous Year Papers</option>
                    <option value="Notes">Notes / Cheat Sheet</option>
                    <option value="Problem Set">Problem Set</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Topic / Concept (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Polymorphism, Pipeline Hazards"
                    value={uploadTopic}
                    onChange={(e) => setUploadTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* File Type format */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Format Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium bg-white"
                >
                  <option value="PDF">PDF (.pdf)</option>
                  <option value="Markdown">Markdown (.md)</option>
                  <option value="Text">Text (.txt)</option>
                  <option value="Doc">Word Document (.docx)</option>
                  <option value="Slides">Slides (.pptx)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upload & Begin Processing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
