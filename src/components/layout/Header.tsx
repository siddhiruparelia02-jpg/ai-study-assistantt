import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Settings as SettingsIcon,
} from 'lucide-react';
import { PageId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useStudyPerformance } from '../../context/PerformanceContext';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onOpenMobileMenu: () => void;
  onOpenUploadModal?: () => void;
  onOpenNewNoteModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  selectedSubject,
  onSelectSubject,
  onOpenMobileMenu,
  onOpenUploadModal,
}) => {
  const { user, signOutUser } = useAuth();
  const { profile, subjects } = useSettings();
  const { studySessionsCount } = useStudyPerformance();
  const [globalSearch, setGlobalSearch] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile?.displayName || user?.displayName || 'Student';
  const displayEmail = profile?.email || user?.email || '';
  const displaySemester = profile?.semester || 'Semester 4';
  const displayCollege = profile?.college || 'Hinduja College (YCMOU)';
  const initial = displayName.charAt(0).toUpperCase() || 'S';
  const photoURL = profile?.photoURL || user?.photoURL;
  const streakDays = studySessionsCount > 0 ? Math.min(studySessionsCount, 30) : 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile Toggle & Sleek Rounded Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs sm:max-w-md">
          <input
            type="text"
            placeholder="Search notes, flashcards, or concepts..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-full py-2 px-10 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
      </div>

      {/* Right: Subject Selector, Streak & User Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Subject Filter Dropdown */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5 text-xs">
          <span className="text-slate-500 font-medium">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="bg-transparent border-0 text-slate-800 font-bold focus:ring-0 focus:outline-none cursor-pointer text-xs"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id || s.code} value={s.code}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-lg leading-none">🔥</span>
          <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
            {streakDays} Day Streak
          </span>
        </div>

        {/* User Profile & Menu */}
        <div className="relative border-l pl-4 sm:pl-6 border-slate-200" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 group focus:outline-none cursor-pointer"
            aria-label="User profile menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-900 group-hover:text-indigo-600 transition-colors">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate max-w-[140px]" title={displaySemester}>
                {displaySemester}
              </p>
            </div>
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover ring-2 ring-transparent group-hover:ring-indigo-500 transition-all"
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-bold rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sm ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
                {initial}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                {displayEmail && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{displayEmail}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Google Linked
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]" title={displayCollege}>
                    {displayCollege}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Settings & Profile</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('progress');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Study Progress</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await signOutUser();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

