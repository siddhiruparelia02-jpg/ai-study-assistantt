import React from 'react';
import {
  X,
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
  LogOut,
} from 'lucide-react';
import { PageId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useStudyPerformance } from '../../context/PerformanceContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  activePage,
  onNavigate,
}) => {
  const { user, signOutUser } = useAuth();
  const { profile, subjects } = useSettings();
  const { topicsPerformance, flashcardHistory, studySessionsCount } = useStudyPerformance();

  if (!isOpen) return null;

  const displayName = profile?.displayName || user?.displayName || 'Student';
  const displayEmail = profile?.email || user?.email || '';
  const displaySemester = profile?.semester || 'Semester 4';
  const initial = displayName.charAt(0).toUpperCase() || 'S';
  const photoURL = profile?.photoURL || user?.photoURL;

  const weakTopicsCount = topicsPerformance.filter(
    (t) => t.priority === 'HIGH' || t.priority === 'MEDIUM'
  ).length;
  const cardsDueToday = Math.max(0, 12 - flashcardHistory.length);
  const streakDays = Math.max(1, 5 + Math.min(studySessionsCount, 10));

  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner' as PageId, label: 'Study Planner', icon: CalendarDays, isAi: true },
    { id: 'materials' as PageId, label: 'Study Materials', icon: FolderArchive },
    { id: 'ask-notes' as PageId, label: 'Ask My Notes', icon: Sparkles, isAi: true },
    { id: 'tutor' as PageId, label: 'AI Tutor', icon: Bot, isAi: true },
    { id: 'notes' as PageId, label: 'AI Notes', icon: FileText, isAi: true },
    { id: 'flashcards' as PageId, label: 'Flashcards', icon: Layers, badge: cardsDueToday > 0 ? cardsDueToday : undefined },
    { id: 'quiz' as PageId, label: 'Quiz & Practice', icon: HelpCircle },
    { id: 'subjects' as PageId, label: 'Subjects', icon: BookOpen, badge: `${subjects.length}` },
    { id: 'weak-topics' as PageId, label: 'Weak Topics', icon: AlertTriangle, badge: weakTopicsCount > 0 ? weakTopicsCount : undefined },
    { id: 'progress' as PageId, label: 'Progress', icon: TrendingUp },
    { id: 'settings' as PageId, label: 'Settings & Profile', icon: SettingsIcon },
  ];

  const handleItemClick = (pageId: PageId) => {
    onNavigate(pageId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">StudyAI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center text-xs shrink-0">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{displaySemester}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              onClose();
              await signOutUser();
            }}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Streak summary */}
        <div className="p-3 mx-4 my-2 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-between text-xs text-amber-900 font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span>{streakDays} Day Streak</span>
          </div>
          <span className="text-[11px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
            Active
          </span>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      <Sparkles className="w-2 h-2" /> AI
                    </span>
                  )}
                </div>
                {item.badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pro Plan Banner */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pro Plan</p>
            <p className="text-sm leading-snug">Unlock unlimited document processing.</p>
            <button
              onClick={() => {
                onNavigate('materials');
                onClose();
              }}
              className="mt-2 bg-white text-slate-900 text-xs font-bold py-2 rounded-lg cursor-pointer"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
