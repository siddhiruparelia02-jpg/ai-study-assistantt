import React from 'react';
import {
  Sparkles,
  BookOpen,
  Brain,
  Layers,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignIn: React.FC = () => {
  const { signInWithGoogle, isSigningIn, error, clearError } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Simple Header */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-xs">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">StudyAI</span>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 hidden sm:inline-flex">
          SYBCA • Semester 4
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10">
            {/* Logo Badge */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Welcome to StudyAI
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your intelligent study companion. Master subjects with AI-driven notes, adaptive quizzes, and active recall flashcards.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-semibold">Sign in failed</p>
                  <p className="mt-0.5 text-rose-600/90">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-rose-400 hover:text-rose-700 font-bold text-sm px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-sm rounded-xl px-4 flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Feature Checklist */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Isolated private cloud database per Google account</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Persistent quiz metrics & weak topic mastery tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Synced study materials & AI summary notes</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-slate-400">
            K. P. B. Hinduja College of Commerce • YCMOU Curriculum
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40">
        © 2026 StudyAI • Secure Google Authentication
      </footer>
    </div>
  );
};
