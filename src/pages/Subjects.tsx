import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  ChevronRight,
  Layers,
  HelpCircle,
  FileText,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  GraduationCap,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { PageId, Subject } from '../types';
import { useSettings } from '../context/SettingsContext';

interface SubjectsProps {
  onNavigate: (page: PageId) => void;
  onSelectSubject: (subjectCode: string) => void;
  selectedSubject: string;
}

export const Subjects: React.FC<SubjectsProps> = ({
  onNavigate,
  onSelectSubject,
  selectedSubject,
}) => {
  const { subjects, addSubject, profile } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDrawerSubject, setActiveDrawerSubject] = useState<Subject | null>(null);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // New subject form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newDate, setNewDate] = useState('2026-09-20');

  const filteredSubjects = subjects.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSubjectFilter =
      selectedSubject === 'ALL' || s.code === selectedSubject;

    return matchSearch && matchSubjectFilter;
  });

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const newSubj: Omit<Subject, 'id'> & { id?: string } = {
      id: `subj-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      department: newDept,
      semester: profile?.semester || 'Semester 4',
      color: 'indigo',
      icon: 'BookOpen',
      examDate: newDate,
      daysUntilExam: 28,
      progressPercent: 0,
      totalChapters: 6,
      completedChapters: 0,
      materialsCount: 1,
      weakTopicsCount: 0,
      description: `Course syllabus and study curriculum for ${newName}.`,
      topics: ['Course Introduction', 'Foundational Principles', 'Applied Problem Solving'],
    };

    await addSubject(newSubj);
    setIsAddSubjectModalOpen(false);
    setNewCode('');
    setNewName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header controls & stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Courses</h2>
          <p className="text-xs text-slate-500">
            {filteredSubjects.length} courses loaded for Fall 2026 examination period
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by code, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSubjects.map((subj) => (
          <div
            key={subj.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                    {subj.code.slice(0, 4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700">{subj.code}</span>
                      <span className="text-[11px] text-slate-400">• {subj.department}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {subj.name}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{subj.daysUntilExam}d to Exam</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Exam: {new Date(subj.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                {subj.description}
              </p>

              {/* Topics Pills */}
              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {subj.topics.slice(0, 3).map((topic, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                  >
                    {topic}
                  </span>
                ))}
                {subj.topics.length > 3 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 font-medium">
                    +{subj.topics.length - 3} more
                  </span>
                )}
              </div>

              {/* Mastery Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Course Syllabus Progress</span>
                  <span className="font-bold text-indigo-700">{subj.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${subj.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>{subj.completedChapters} of {subj.totalChapters} units completed</span>
                  <span className="text-rose-600 font-medium">{subj.weakTopicsCount} weak areas flagged</span>
                </div>
              </div>
            </div>

            {/* Quick Action Matrix */}
            <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-4 gap-1.5">
              <button
                onClick={() => {
                  onSelectSubject(subj.code);
                  onNavigate('tutor');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-50/60 hover:bg-indigo-600 hover:text-white text-indigo-700 transition-colors text-center group"
                title="Open AI Tutor for this subject"
              >
                <Bot className="w-4 h-4 mb-1 text-indigo-600 group-hover:text-white" />
                <span className="text-[10px] font-bold">AI Tutor</span>
              </button>

              <button
                onClick={() => {
                  onSelectSubject(subj.code);
                  onNavigate('flashcards');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 transition-colors text-center group"
                title="Review flashcards"
              >
                <Layers className="w-4 h-4 mb-1 text-slate-500 group-hover:text-white" />
                <span className="text-[10px] font-bold">Cards</span>
              </button>

              <button
                onClick={() => {
                  onSelectSubject(subj.code);
                  onNavigate('quiz');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 transition-colors text-center group"
                title="Practice diagnostic quiz"
              >
                <HelpCircle className="w-4 h-4 mb-1 text-slate-500 group-hover:text-white" />
                <span className="text-[10px] font-bold">Quiz</span>
              </button>

              <button
                onClick={() => setActiveDrawerSubject(subj)}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 transition-colors text-center group"
                title="View syllabus & details"
              >
                <BookOpen className="w-4 h-4 mb-1 text-slate-500 group-hover:text-white" />
                <span className="text-[10px] font-bold">Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Details Drawer Modal */}
      {activeDrawerSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {activeDrawerSubject.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {activeDrawerSubject.name}
                </h3>
                <p className="text-xs text-slate-500">{activeDrawerSubject.department} • {activeDrawerSubject.semester}</p>
              </div>
              <button
                onClick={() => setActiveDrawerSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Course Syllabus & Core Topics
                </h4>
                <div className="space-y-1.5">
                  {activeDrawerSubject.topics.map((t, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{idx + 1}. {t}</span>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Unit {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                <span>Total Materials: <strong>{activeDrawerSubject.materialsCount} files</strong></span>
                <span>Exam Target: <strong>{activeDrawerSubject.examDate}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  onSelectSubject(activeDrawerSubject.code);
                  onNavigate('tutor');
                  setActiveDrawerSubject(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Bot className="w-4 h-4" />
                <span>Launch AI Tutor</span>
              </button>
              <button
                onClick={() => setActiveDrawerSubject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Course Modal */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Course</h3>
              <button
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Code (e.g. CS301, BIO110)</label>
                <input
                  type="text"
                  required
                  placeholder="CS301"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="Data Structures & Algorithms"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Economics">Economics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
