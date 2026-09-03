import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Bot,
  FileText,
  Layers,
  HelpCircle,
  FolderArchive,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Settings as SettingsIcon,
  Clock,
  Zap,
} from 'lucide-react';
import { PageId } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useStudyPerformance } from '../../context/PerformanceContext';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onSelectSubject?: (subjectCode: string) => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  isAi?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { subjects, targetExamDays, targetExamSubject } = useSettings();
  const { topicsPerformance, flashcardHistory } = useStudyPerformance();

  const weakTopicsCount = topicsPerformance.filter(
    (t) => t.priority === 'HIGH' || t.priority === 'MEDIUM'
  ).length;

  const cardsDueToday = Math.max(0, 12 - flashcardHistory.length);
  const activeSubjectsCount = subjects.length;

  // Average progress across active subjects
  const avgProgress =
    subjects.length > 0
      ? Math.round(subjects.reduce((acc, s) => acc + (s.progressPercent ?? 0), 0) / subjects.length)
      : 55;

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Study Planner', icon: CalendarDays, isAi: true, badge: 'Adaptive', badgeColor: 'bg-indigo-100 text-indigo-800' },
    { id: 'materials', label: 'Study Materials', icon: FolderArchive, badge: '14' },
    { id: 'ask-notes', label: 'Ask My Notes', icon: Sparkles, isAi: true, badge: 'Grounded' },
    { id: 'tutor', label: 'AI Tutor', icon: Bot, isAi: true, badge: 'Live' },
    { id: 'notes', label: 'AI Notes', icon: FileText, isAi: true },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, badge: cardsDueToday > 0 ? cardsDueToday : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'quiz', label: 'Quiz & Practice', icon: HelpCircle },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, badge: `${activeSubjectsCount} Active` },
    { id: 'weak-topics', label: 'Weak Topics', icon: AlertTriangle, badge: weakTopicsCount > 0 ? weakTopicsCount : undefined, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'settings', label: 'Settings & Profile', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-indigo-700 transition-colors">
            A
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-indigo-600 transition-colors">
              StudyAI
            </span>
          </div>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all group cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.isAi && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/80">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Exam Countdown card */}
      <div className="px-4 pb-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Target Exam
            </span>
            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
              {targetExamDays}d Left
            </span>
          </div>
          <div className="font-bold text-xs text-slate-900 truncate">{targetExamSubject}</div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.max(10, Math.min(100, avgProgress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pro Plan Banner */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pro Plan</p>
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-sm leading-snug text-slate-200">Unlock unlimited document processing.</p>
          <button
            onClick={() => onNavigate('materials')}
            className="mt-2 bg-white text-slate-900 text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors active:scale-[0.98] cursor-pointer"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
};
