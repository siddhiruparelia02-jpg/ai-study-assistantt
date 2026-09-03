import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Bell,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  Zap,
  ChevronRight,
  BookMarked,
  Brain,
  CalendarDays,
  Target,
  Sliders,
  Check,
  X,
  FileCode,
} from 'lucide-react';
import { PageId, Subject } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

interface SettingsProps {
  onNavigate: (page: PageId) => void;
  onSelectSubject?: (subjectCode: string) => void;
}

type SettingsTab = 'profile' | 'academic' | 'subjects' | 'schedule' | 'learning' | 'notifications';

export const Settings: React.FC<SettingsProps> = ({ onNavigate, onSelectSubject }) => {
  const { user } = useAuth();
  const {
    profile,
    subjects,
    isSaving,
    updateProfile,
    updateAcademicSettings,
    updateStudyPreferences,
    updateLearningPreferences,
    updateNotificationSettings,
    addSubject,
    updateSubject,
    deleteSubject,
    resetToDefaultSubjects,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');

  // Academic settings state
  const [degree, setDegree] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [targetGraduationYear, setTargetGraduationYear] = useState('');
  const [targetGPA, setTargetGPA] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [semesterExamStartDate, setSemesterExamStartDate] = useState('');
  const [primaryMajor, setPrimaryMajor] = useState('');

  // Study schedule state
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(120);
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(45);
  const [breakLengthMinutes, setBreakLengthMinutes] = useState(10);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(15);
  const [studyDays, setStudyDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [preferredStudySlot, setPreferredStudySlot] = useState<any>('Evening (5 PM - 9 PM)');

  // Learning preferences state
  const [tutorStyle, setTutorStyle] = useState<any>('Step-by-Step Problem Solver');
  const [defaultDifficulty, setDefaultDifficulty] = useState<any>('Intermediate');
  const [defaultNoteStyle, setDefaultNoteStyle] = useState<any>('Exam Notes');
  const [flashcardReviewPace, setFlashcardReviewPace] = useState<any>('Spaced Repetition (Standard)');
  const [includeRealWorldExamples, setIncludeRealWorldExamples] = useState(true);
  const [includeCodeSnippets, setIncludeCodeSnippets] = useState(true);

  // Notifications state
  const [dailyStudyReminders, setDailyStudyReminders] = useState(true);
  const [upcomingExamAlerts, setUpcomingExamAlerts] = useState(true);
  const [weakTopicAlerts, setWeakTopicAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  // Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjDept, setSubjDept] = useState('Computer Applications');
  const [subjSemester, setSubjSemester] = useState('Semester 4');
  const [subjExamDate, setSubjExamDate] = useState('');
  const [subjColor, setSubjColor] = useState('indigo');
  const [subjTargetScore, setSubjTargetScore] = useState(85);
  const [subjDescription, setSubjDescription] = useState('');
  const [subjTopicsInput, setSubjTopicsInput] = useState('');

  // Sync state from context when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setEmail(profile.email || '');
      setCollege(profile.college || '');
      setSemester(profile.semester || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');

      if (profile.academic) {
        setDegree(profile.academic.degree || '');
        setRollNumber(profile.academic.rollNumber || '');
        setTargetGraduationYear(profile.academic.targetGraduationYear || '');
        setTargetGPA(profile.academic.targetGPA || '');
        setExamBoard(profile.academic.examBoard || '');
        setSemesterExamStartDate(profile.academic.semesterExamStartDate || '');
        setPrimaryMajor(profile.academic.primaryMajor || '');
      }

      if (profile.studyPreferences) {
        setDailyStudyMinutes(profile.studyPreferences.dailyStudyMinutes ?? 120);
        setSessionLengthMinutes(profile.studyPreferences.sessionLengthMinutes ?? 45);
        setBreakLengthMinutes(profile.studyPreferences.breakLengthMinutes ?? 10);
        setWeeklyGoalHours(profile.studyPreferences.weeklyGoalHours ?? 15);
        setStudyDays(profile.studyPreferences.studyDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
        setPreferredStudySlot(profile.studyPreferences.preferredStudySlot || 'Evening (5 PM - 9 PM)');
      }

      if (profile.learningPreferences) {
        setTutorStyle(profile.learningPreferences.tutorStyle || 'Step-by-Step Problem Solver');
        setDefaultDifficulty(profile.learningPreferences.defaultDifficulty || 'Intermediate');
        setDefaultNoteStyle(profile.learningPreferences.defaultNoteStyle || 'Exam Notes');
        setFlashcardReviewPace(profile.learningPreferences.flashcardReviewPace || 'Spaced Repetition (Standard)');
        setIncludeRealWorldExamples(profile.learningPreferences.includeRealWorldExamples ?? true);
        setIncludeCodeSnippets(profile.learningPreferences.includeCodeSnippets ?? true);
      }

      if (profile.notifications) {
        setDailyStudyReminders(profile.notifications.dailyStudyReminders ?? true);
        setUpcomingExamAlerts(profile.notifications.upcomingExamAlerts ?? true);
        setWeakTopicAlerts(profile.notifications.weakTopicAlerts ?? true);
        setEmailDigest(profile.notifications.emailDigest ?? false);
      }
    }
  }, [profile]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 3500);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      displayName,
      college,
      semester,
      bio,
      phone,
    });
    if (success) {
      showNotification('Personal profile updated successfully.');
    } else {
      showNotification('Could not save personal profile.', true);
    }
  };

  const handleSaveAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateAcademicSettings({
      degree,
      rollNumber,
      targetGraduationYear,
      targetGPA,
      examBoard,
      semesterExamStartDate,
      primaryMajor,
    });
    if (success) {
      showNotification('Academic credentials and exam targets saved.');
    } else {
      showNotification('Could not save academic details.', true);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateStudyPreferences({
      dailyStudyMinutes,
      sessionLengthMinutes,
      breakLengthMinutes,
      weeklyGoalHours,
      studyDays,
      preferredStudySlot,
    });
    if (success) {
      showNotification('Study schedule & daily time budget updated.');
    } else {
      showNotification('Could not save study preferences.', true);
    }
  };

  const handleSaveLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateLearningPreferences({
      tutorStyle,
      defaultDifficulty,
      defaultNoteStyle,
      flashcardReviewPace,
      includeRealWorldExamples,
      includeCodeSnippets,
    });
    if (success) {
      showNotification('AI learning and tutor style updated.');
    } else {
      showNotification('Could not save learning preferences.', true);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateNotificationSettings({
      dailyStudyReminders,
      upcomingExamAlerts,
      weakTopicAlerts,
      emailDigest,
    });
    if (success) {
      showNotification('Notification preferences saved.');
    } else {
      showNotification('Could not save notifications.', true);
    }
  };

  const toggleStudyDay = (day: string) => {
    if (studyDays.includes(day)) {
      if (studyDays.length > 1) {
        setStudyDays(studyDays.filter((d) => d !== day));
      }
    } else {
      setStudyDays([...studyDays, day]);
    }
  };

  // Open Subject Modal for Add/Edit
  const handleOpenSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjCode(subj.code);
      setSubjName(subj.name);
      setSubjDept(subj.department || 'Computer Applications');
      setSubjSemester(subj.semester || 'Semester 4');
      setSubjExamDate(subj.examDate || '');
      setSubjColor(subj.color || 'indigo');
      setSubjTargetScore(subj.targetScore ?? 85);
      setSubjDescription(subj.description || '');
      setSubjTopicsInput((subj.topics || []).join('\n'));
    } else {
      setEditingSubject(null);
      setSubjCode('');
      setSubjName('');
      setSubjDept('Computer Applications');
      setSubjSemester('Semester 4');
      setSubjExamDate('2027-01-15');
      setSubjColor('indigo');
      setSubjTargetScore(85);
      setSubjDescription('');
      setSubjTopicsInput('Unit 1: Fundamentals\nUnit 2: Core Architecture\nUnit 3: Applications & Exam Review');
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubjectModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjCode.trim() || !subjName.trim()) {
      showNotification('Please provide both subject code and subject name.', true);
      return;
    }

    const parsedTopics = subjTopicsInput
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingSubject) {
      await updateSubject(editingSubject.id, {
        code: subjCode.toUpperCase().trim(),
        name: subjName.trim(),
        department: subjDept,
        semester: subjSemester,
        examDate: subjExamDate,
        color: subjColor,
        targetScore: Number(subjTargetScore) || 85,
        description: subjDescription || `Course syllabus for ${subjName}`,
        topics: parsedTopics.length > 0 ? parsedTopics : ['Core Fundamentals'],
      });
      showNotification(`Updated subject ${subjCode.toUpperCase()}.`);
    } else {
      await addSubject({
        code: subjCode.toUpperCase().trim(),
        name: subjName.trim(),
        department: subjDept,
        semester: subjSemester,
        examDate: subjExamDate,
        color: subjColor,
        icon: 'BookOpen',
        daysUntilExam: 30,
        progressPercent: 0,
        totalChapters: 6,
        completedChapters: 0,
        materialsCount: 0,
        weakTopicsCount: 0,
        targetScore: Number(subjTargetScore) || 85,
        description: subjDescription || `Course syllabus for ${subjName}`,
        topics: parsedTopics.length > 0 ? parsedTopics : ['Core Fundamentals'],
      });
      showNotification(`Added new subject ${subjCode.toUpperCase()}.`);
    }

    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = async (subjectId: string, subjectCode: string) => {
    if (subjects.length <= 1) {
      showNotification('You must keep at least one registered course.', true);
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${subjectCode} from your enrolled courses?`)) {
      await deleteSubject(subjectId);
      showNotification(`Removed course ${subjectCode}.`);
    }
  };

  const handleResetSubjects = async () => {
    if (window.confirm('Reset all enrolled subjects to the standard YCMOU SYBCA Semester 4 curriculum?')) {
      await resetToDefaultSubjects();
      showNotification('Reset subjects to standard semester curriculum.');
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      studentProfile: profile,
      registeredSubjects: subjects,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyAI_Profile_${profile?.displayName?.replace(/\s+/g, '_') || 'Student'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Student profile & subjects exported to JSON.');
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Student Profile', icon: User },
    { id: 'academic' as SettingsTab, label: 'Academic & Goals', icon: GraduationCap },
    { id: 'subjects' as SettingsTab, label: 'Enrolled Courses', icon: BookOpen, badge: `${subjects.length}` },
    { id: 'schedule' as SettingsTab, label: 'Study Schedule', icon: Clock },
    { id: 'learning' as SettingsTab, label: 'AI Tutor & Style', icon: Sparkles },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
  ];

  const colorOptions = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-rose-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <AlertCircle className="w-4 h-4 text-rose-300" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Settings & Profile
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure your student identity, exam schedule, enrolled subjects, and adaptive AI preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Export Profile & Settings JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERSONAL & STUDENT PROFILE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-3xl flex items-center justify-center border-4 border-white shadow-md">
                  {displayName.charAt(0).toUpperCase() || 'S'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Authenticated Account">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{displayName || 'Student'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{email || user?.email || 'Authenticated User'}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {semester || 'Semester 4'}
              </span>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Institution:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]" title={college}>
                  {college || 'Hinduja College (YCMOU)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auth Status:</span>
                <span className="font-semibold text-emerald-600">Google Linked</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Courses:</span>
                <span className="font-semibold text-slate-800">{subjects.length} Enrolled</span>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Personal Details</h3>
            <p className="text-xs text-slate-500 mb-6">
              This information powers your personalized dashboard greeting, tutor context, and study summaries.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Student Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Alex Johnson"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email || user?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Managed via your Google Sign-In account.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    College / University / School <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. K. P. B. Hinduja College of Commerce (YCMOU)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Current Semester / Academic Term <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. SYBCA • Semester 4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Academic Bio / Aspirations
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. 2nd Year BCA student aiming for distinction in university exams and preparing for full-stack engineering."
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC CREDENTIALS & EXAM GOALS */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Goals & Degree Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calibrate graduation targets, GPA benchmarks, and university examination schedules.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              Exam Countdown: Active
            </span>
          </div>

          <form onSubmit={handleSaveAcademic} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Degree / Program Name
                </label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Bachelor of Computer Applications (BCA)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Student Roll No / Registration ID
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. BCA-2024-089"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Graduation Year
                </label>
                <input
                  type="text"
                  value={targetGraduationYear}
                  onChange={(e) => setTargetGraduationYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. 2027"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target GPA / Percentage Goal
                </label>
                <input
                  type="text"
                  value={targetGPA}
                  onChange={(e) => setTargetGPA(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. 8.5 CGPA or 85%"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Exam Board / University
                </label>
                <input
                  type="text"
                  value={examBoard}
                  onChange={(e) => setExamBoard(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. YCMOU (Yashwantrao Chavan Open Univ)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Semester University Exam Start Date
                </label>
                <input
                  type="date"
                  value={semesterExamStartDate}
                  onChange={(e) => setSemesterExamStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Major / Academic Stream
              </label>
              <input
                type="text"
                value={primaryMajor}
                onChange={(e) => setPrimaryMajor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. Computer Applications / Software Engineering"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Academic Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SUBJECTS / ENROLLED COURSES */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enrolled Courses & Exam Dates</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All changes here directly calibrate the Adaptive Study Planner, Weak Topic trackers, and Sidebar countdowns.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSubjects}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Reset to default 4 subjects"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standard Courses</span>
              </button>

              <button
                onClick={() => handleOpenSubjectModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subj) => {
              const daysLeft = subj.daysUntilExam;
              return (
                <div
                  key={subj.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs">
                          {subj.code.slice(0, 3)}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {subj.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{subj.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenSubjectModal(subj)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Course Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subj.id, subj.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{subj.description}</p>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Exam Date</span>
                        <span className="font-semibold text-slate-800">
                          {subj.examDate ? new Date(subj.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Countdown</span>
                        <span className={`font-bold ${daysLeft <= 14 ? 'text-rose-600' : 'text-indigo-600'}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Exam today/passed'}
                        </span>
                      </div>
                    </div>

                    {subj.topics && subj.topics.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] text-slate-400 block mb-1">Key Topics ({subj.topics.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {subj.topics.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[160px]">
                              {t}
                            </span>
                          ))}
                          {subj.topics.length > 3 && (
                            <span className="text-[10px] text-slate-400 py-0.5">+{subj.topics.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Target: {subj.targetScore ?? 85}%</span>
                    <button
                      onClick={() => {
                        if (onSelectSubject) onSelectSubject(subj.code);
                        onNavigate('subjects');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Course</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: STUDY SCHEDULE & SESSIONS */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h3 className="text-base font-bold text-slate-900">Daily Study Schedule & Budget</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These settings dictate the time allocations generated by the Adaptive Study Planner.
            </p>
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daily Study Goal (Minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={30}
                    max={360}
                    step={15}
                    value={dailyStudyMinutes}
                    onChange={(e) => setDailyStudyMinutes(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0 min-w-[70px] text-center">
                    {dailyStudyMinutes} min ({(dailyStudyMinutes / 60).toFixed(1)}h)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Focus Block Length (Minutes)
                </label>
                <select
                  value={sessionLengthMinutes}
                  onChange={(e) => setSessionLengthMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value={25}>25 min (Pomodoro Standard)</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min (Recommended Deep Focus)</option>
                  <option value={60}>60 min (Extended Session)</option>
                  <option value={90}>90 min (Intensive Block)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Break Duration (Minutes)
                </label>
                <select
                  value={breakLengthMinutes}
                  onChange={(e) => setBreakLengthMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min (Balanced)</option>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Daily Study Time
                </label>
                <select
                  value={preferredStudySlot}
                  onChange={(e) => setPreferredStudySlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 5 PM)">Afternoon (12 PM - 5 PM)</option>
                  <option value="Evening (5 PM - 9 PM)">Evening (5 PM - 9 PM)</option>
                  <option value="Night (9 PM - 2 AM)">Night (9 PM - 2 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Weekly Goal Target (Hours)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={weeklyGoalHours}
                  onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Active Study Days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Active Study Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isSelected = studyDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleStudyDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              <p className="text-[10px] text-slate-400 mt-1.5">
                The Adaptive Planner will only schedule study tasks on your selected days.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Study Schedule'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AI TUTOR & LEARNING PREFERENCES */}
      {activeTab === 'learning' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h3 className="text-base font-bold text-slate-900">AI Tutor & Learning Customization</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how Gemini generates explanations, quiz difficulty levels, note summaries, and spaced repetition.
            </p>
          </div>

          <form onSubmit={handleSaveLearning} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  AI Tutor Pedagogy & Teaching Tone
                </label>
                <select
                  value={tutorStyle}
                  onChange={(e) => setTutorStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="Step-by-Step Problem Solver">Step-by-Step Problem Solver (Structured sequential breakdowns)</option>
                  <option value="Socratic & Interactive">Socratic & Interactive (Asks guiding questions to build intuition)</option>
                  <option value="Concise & High-Yield">Concise & High-Yield (Bullet points, exam formulas, rapid recall)</option>
                  <option value="Detailed Conceptual Deep-Dive">Detailed Conceptual Deep-Dive (Academic rigor & comprehensive theory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Quiz Difficulty
                </label>
                <select
                  value={defaultDifficulty}
                  onChange={(e) => setDefaultDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="Beginner">Beginner (Foundational definitions & direct recall)</option>
                  <option value="Intermediate">Intermediate (Application & syntax comprehension)</option>
                  <option value="Exam Standard">Exam Standard (Complex scenario analysis & university past papers)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default AI Note Generation Format
                </label>
                <select
                  value={defaultNoteStyle}
                  onChange={(e) => setDefaultNoteStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="Exam Notes">Exam Notes (Formulas, high-yield takeaways & pitfalls)</option>
                  <option value="Detailed Notes">Detailed Notes (Full textbook-style synthesis)</option>
                  <option value="Quick Revision">Quick Revision (Concise cheat sheets & key definitions)</option>
                  <option value="Beginner Friendly">Beginner Friendly (Plain language with step-by-step analogies)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Flashcard Spaced Repetition Rhythm
                </label>
                <select
                  value={flashcardReviewPace}
                  onChange={(e) => setFlashcardReviewPace(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="Spaced Repetition (Standard)">Spaced Repetition (Standard Leitner algorithm)</option>
                  <option value="Accelerated Cramming">Accelerated Cramming (Frequent high-urgency cycles)</option>
                  <option value="Gentle Review">Gentle Review (Low-stress retention cycles)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRealWorldExamples}
                  onChange={(e) => setIncludeRealWorldExamples(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Include Real-World Analogies in AI Explanations</span>
                  <p className="text-[11px] text-slate-500">Tutor and Notes will provide intuitive everyday metaphors for abstract topics.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCodeSnippets}
                  onChange={(e) => setIncludeCodeSnippets(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Include Code Snippets & Exact Syntax</span>
                  <p className="text-[11px] text-slate-500">Always generate runnable code blocks and technical declarations when discussing CS topics.</p>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save AI Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS & REMINDERS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h3 className="text-base font-bold text-slate-900">Notifications & Alert Triggers</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control automated study reminders and examination milestone notifications.
            </p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900">Daily Study Reminders</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Receive daily prompts based on your selected study time slot.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyStudyReminders}
                  onChange={(e) => setDailyStudyReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900">Upcoming Exam Countdown Alerts</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatic alerts at 30d, 14d, 7d, and 48 hours before each subject exam.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={upcomingExamAlerts}
                  onChange={(e) => setUpcomingExamAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900">Weak Topic Diagnostic Alerts</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Notify when quiz scores or flashcard reviews indicate a concept needs urgent revision.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={weakTopicAlerts}
                  onChange={(e) => setWeakTopicAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900">Weekly Progress Summary Digest</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Consolidated report of hours logged, quiz accuracy trends, and mastered concepts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Notification Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD/EDIT SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSubject ? `Edit ${editingSubject.code}` : 'Add New Enrolled Subject'}
                </h3>
              </div>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectModal} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subjCode}
                    onChange={(e) => setSubjCode(e.target.value)}
                    placeholder="e.g. ADV-JAVA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Score (%)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={subjTargetScore}
                    onChange={(e) => setSubjTargetScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Full Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  placeholder="e.g. Advance Java"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={subjDept}
                    onChange={(e) => setSubjDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    University Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={subjExamDate}
                    onChange={(e) => setSubjExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Syllabus Topics (One per line)
                </label>
                <textarea
                  rows={4}
                  value={subjTopicsInput}
                  onChange={(e) => setSubjTopicsInput(e.target.value)}
                  placeholder="Unit 1: Overview&#10;Unit 2: Architecture&#10;Unit 3: Implementation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSubjColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform ${
                        subjColor === c.id ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {subjColor === c.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
