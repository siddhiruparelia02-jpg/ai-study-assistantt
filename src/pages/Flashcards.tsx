import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  BookOpen,
  Filter,
  Check,
  Flame,
  Volume2,
  X,
  RotateCcw,
  Award,
  Sliders,
  TrendingUp,
  BrainCircuit,
  GraduationCap,
  ArrowRight,
  List,
  Eye,
} from 'lucide-react';
import { FlashcardDeck, Flashcard, PageId } from '../types';
import { mockFlashcardDecks } from '../data/mockData';
import { useStudyPerformance } from '../context/PerformanceContext';
import { useSettings } from '../context/SettingsContext';

interface FlashcardsProps {
  selectedSubject: string;
  onSelectSubject: (subjectCode: string) => void;
  onNavigate: (page: PageId) => void;
  onStudyWeakTopic?: (subjectCode: string, topicName: string) => void;
  initialTopic?: string;
  onClearInitialTopic?: () => void;
}

export type FlashcardDifficulty = 'Easy' | 'Medium' | 'Hard';
export type CardCardCount = 10 | 20 | 30 | 50;

interface CardSessionStatus {
  [cardId: string]: 'know' | 'review' | undefined;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigate,
  onStudyWeakTopic,
  initialTopic,
  onClearInitialTopic,
}) => {
  // Deck and active session state
  const [decks, setDecks] = useState<FlashcardDeck[]>(mockFlashcardDecks);
  const [activeDeckId, setActiveDeckId] = useState<string>(mockFlashcardDecks[0]?.id || 'deck-1');

  // Study view state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [cardStatusMap, setCardStatusMap] = useState<CardSessionStatus>({});

  // View tabs
  const [activeTab, setActiveTab] = useState<'study' | 'generator' | 'allDecks'>('study');

  // Performance context
  const { recordFlashcardReview } = useStudyPerformance();
  const { subjects } = useSettings();
  const recordedFlashcardRef = useRef<string | null>(null);

  // AI Generator Form State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [genSubject, setGenSubject] = useState(
    selectedSubject === 'ALL' ? 'Java Programming' : selectedSubject
  );
  const [genTopic, setGenTopic] = useState('Inheritance & OOP Concepts');
  const [genDifficulty, setGenDifficulty] = useState<FlashcardDifficulty>('Medium');
  const [genCardCount, setGenCardCount] = useState<CardCardCount>(10);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Sync selectedSubject prop
  useEffect(() => {
    if (selectedSubject !== 'ALL') {
      const found = subjects.find((s) => s.code === selectedSubject);
      setGenSubject(found ? `${found.code} - ${found.name}` : selectedSubject);
    }
  }, [selectedSubject, subjects]);

  // Handle incoming topic from AI Notes or Study Materials
  useEffect(() => {
    if (initialTopic) {
      setGenTopic(initialTopic);
      setIsGenerateModalOpen(true);
      if (onClearInitialTopic) {
        onClearInitialTopic();
      }
    }
  }, [initialTopic, onClearInitialTopic]);

  // Find active deck
  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];

  // Initialize or update sessionCards when activeDeck changes (unless in revision mode)
  useEffect(() => {
    if (activeDeck && !isRevisionMode) {
      setSessionCards(activeDeck.cards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setIsSessionCompleted(false);
      setCardStatusMap({});
    }
  }, [activeDeckId, isRevisionMode]);

  const currentCard = sessionCards[currentCardIndex];

  // Keyboard navigation & flip handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (activeTab === 'study' && !isSessionCompleted && currentCard) {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (e.key === 'ArrowRight' && currentCardIndex < sessionCards.length - 1) {
          handleNextCard();
        } else if (e.key === 'ArrowLeft' && currentCardIndex > 0) {
          handlePrevCard();
        } else if (e.key === '1' || e.key === 'r' || e.key === 'R') {
          handleMarkCard('review');
        } else if (e.key === '2' || e.key === 'k' || e.key === 'K') {
          handleMarkCard('know');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isSessionCompleted, currentCardIndex, sessionCards.length, currentCard]);

  // Card navigation
  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setIsSessionCompleted(true);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  // Card marking (Know It / Review Again)
  const handleMarkCard = (status: 'know' | 'review') => {
    if (!currentCard) return;

    setCardStatusMap((prev) => ({
      ...prev,
      [currentCard.id]: status,
    }));

    setIsFlipped(false);

    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setIsSessionCompleted(true);
    }
  };

  // Mastery Calculation
  const calculateMastery = () => {
    const total = sessionCards.length;
    let knowCount = 0;
    let reviewCount = 0;

    sessionCards.forEach((c) => {
      const st = cardStatusMap[c.id];
      if (st === 'know') knowCount++;
      else if (st === 'review') reviewCount++;
    });

    const masteryPercent = total > 0 ? Math.round((knowCount / total) * 100) : 0;

    let classification: 'Needs Revision' | 'Improving' | 'Good' = 'Needs Revision';
    if (masteryPercent > 70) {
      classification = 'Good';
    } else if (masteryPercent >= 50) {
      classification = 'Improving';
    } else {
      classification = 'Needs Revision';
    }

    const reviewCards = sessionCards.filter((c) => cardStatusMap[c.id] === 'review');

    return {
      total,
      knowCount,
      reviewCount,
      masteryPercent,
      classification,
      reviewCards,
    };
  };

  // Record completed flashcard session to Weak Topics / Performance Context
  useEffect(() => {
    if (isSessionCompleted && activeDeck && sessionCards.length > 0) {
      const sessionKey = `${activeDeck.id}-${sessionCards.length}-${Date.now()}`;
      if (recordedFlashcardRef.current !== sessionKey) {
        recordedFlashcardRef.current = sessionKey;
        const mastery = calculateMastery();
        if (mastery.knowCount + mastery.reviewCount > 0) {
          recordFlashcardReview(
            activeDeck.subjectCode || selectedSubject || 'JAVA',
            activeDeck.title,
            mastery.knowCount,
            mastery.reviewCount
          );
        }
      }
    }
  }, [isSessionCompleted]);

  // Start "Review Again" Revision Mode
  const handleStartRevisionMode = () => {
    const { reviewCards } = calculateMastery();
    if (reviewCards.length === 0) return;

    setSessionCards(reviewCards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsSessionCompleted(false);
    setIsRevisionMode(true);
    // Reset status map for the revision batch
    const freshStatus: CardSessionStatus = {};
    setCardStatusMap(freshStatus);
  };

  // Restart full session
  const handleRestartFullSession = () => {
    if (activeDeck) {
      setSessionCards(activeDeck.cards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setIsSessionCompleted(false);
      setIsRevisionMode(false);
      setCardStatusMap({});
    }
  };

  // AI Flashcards Generator API Handler
  const handleGenerateAiFlashcards = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: genSubject,
          topic: genTopic,
          difficulty: genDifficulty,
          cardCount: genCardCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const resData = await response.json();
      const generated = resData.data;

      if (!generated || !Array.isArray(generated.cards) || generated.cards.length === 0) {
        throw new Error('Received empty flashcard set from server.');
      }

      const cleanSubjectCode = genSubject.includes(' - ')
        ? genSubject.split(' - ')[0]
        : genSubject.slice(0, 8).toUpperCase();

      const newDeck: FlashcardDeck = {
        id: `deck-ai-${Date.now()}`,
        subjectId: 'subj-ai-gen',
        subjectCode: cleanSubjectCode,
        title: generated.title || `${cleanSubjectCode}: ${genTopic}`,
        description:
          generated.description ||
          `AI active recall flashcards (${genDifficulty}) generated with Gemini.`,
        cardCount: generated.cards.length,
        masteredCount: 0,
        color: 'indigo',
        lastStudied: 'Just now',
        cards: generated.cards.map((c: any, idx: number) => ({
          id: c.id || `card-ai-${Date.now()}-${idx}`,
          subjectId: 'subj-ai-gen',
          subjectCode: cleanSubjectCode,
          deckName: generated.title || `${cleanSubjectCode}: ${genTopic}`,
          front: c.front,
          back: c.back,
          explanation: c.explanation || '',
          difficulty: c.difficulty || genDifficulty,
          masteryStatus: 'learning',
          reviewCount: 0,
        })),
      };

      setDecks([newDeck, ...decks]);
      setActiveDeckId(newDeck.id);
      setSessionCards(newDeck.cards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setIsSessionCompleted(false);
      setIsRevisionMode(false);
      setCardStatusMap({});
      setIsGenerateModalOpen(false);
      setActiveTab('study');
    } catch (err: any) {
      console.error('Failed to generate flashcards:', err);
      setGenerateError(
        err.message || 'Unable to generate flashcards. Please check server settings and retry.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredDecks = decks.filter(
    (d) => selectedSubject === 'ALL' || d.subjectCode === selectedSubject
  );

  const suggestedTopics: { [key: string]: string[] } = {
    'Java Programming': [
      'Inheritance & Polymorphism',
      'Abstract Classes vs Interfaces',
      'Collections Framework & Generics',
      'Exception Handling Invariants',
      'Memory Model & Garbage Collection',
    ],
    CS301: [
      'AVL Trees & Self-Balancing',
      'Dijkstra & Shortest Paths',
      'Dynamic Programming Invariants',
      'Hash Map Collision Resolution',
    ],
    CHEM202: [
      'Reaction Kinetics & Rate Laws',
      'Electrophilic Aromatic Substitution',
      'Stereochemistry & Enantiomers',
      'Thermodynamics vs Kinetics',
    ],
    ECON101: [
      'Slutsky Decomposition & Elasticity',
      'Monopoly Price Discrimination',
      'Game Theory & Nash Equilibrium',
    ],
    MATH240: [
      'Eigenvalues & Diagonalization',
      'Taylor Series & Error Bounds',
      'Vector Fields & Divergence',
    ],
  };

  const currentTopicSuggestions =
    suggestedTopics[genSubject] ||
    suggestedTopics[genSubject.split(' - ')[0]] ||
    suggestedTopics['Java Programming'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Recall & Spaced Repetition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Flashcards & Mastery
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Generate high-yield conceptual flashcards on any subject with Gemini AI. Flip, test
            active recall, track mastery scores, and filter revision batches.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5 items-center">
          <button
            onClick={() => {
              setGenSubject(selectedSubject === 'ALL' ? 'Java Programming' : selectedSubject);
              setGenTopic('Inheritance & OOP Concepts');
              setGenDifficulty('Medium');
              setGenCardCount(10);
              setIsGenerateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-indigo-900 text-xs font-extrabold shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Generate Flashcards</span>
          </button>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Pills & Deck Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Left: Decks Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 shrink-0">
            Decks:
          </span>
          {filteredDecks.map((deck) => {
            const isSelected = activeDeckId === deck.id && activeTab === 'study';
            return (
              <button
                key={deck.id}
                onClick={() => {
                  setActiveDeckId(deck.id);
                  setSessionCards(deck.cards);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setIsSessionCompleted(false);
                  setIsRevisionMode(false);
                  setCardStatusMap({});
                  setActiveTab('study');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {deck.subjectCode}
                </span>
                <span className="truncate max-w-[160px] font-bold">{deck.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {deck.cards?.length || deck.cardCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: View toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('study')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'study'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Study Session
          </button>
          <button
            onClick={() => setActiveTab('allDecks')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'allDecks'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Decks ({decks.length})
          </button>
        </div>
      </div>

      {/* Main Active Study View */}
      {activeTab === 'study' && (
        <>
          {!isSessionCompleted && currentCard ? (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Card Meta & Header Status */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 shrink-0">
                    {currentCard.subjectCode || activeDeck?.subjectCode}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                    {isRevisionMode
                      ? `Revision Mode: ${activeDeck?.title}`
                      : activeDeck?.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isRevisionMode && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      Reviewing Mistakes
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span>
                      Card {currentCardIndex + 1} of {sessionCards.length}
                    </span>
                    <div className="w-20 sm:w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${((currentCardIndex + 1) / (sessionCards.length || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Flashcard Component */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 min-h-[340px] sm:min-h-[380px] cursor-pointer select-none"
              >
                <div
                  className={`w-full h-full min-h-[340px] sm:min-h-[380px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 transform-style-3d border shadow-sm ${
                    isFlipped
                      ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-800'
                      : 'bg-white text-slate-900 border-slate-200/80 hover:border-indigo-300'
                  }`}
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] ${
                        isFlipped
                          ? 'bg-indigo-800/80 text-indigo-200 border border-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isFlipped ? 'Answer & Explanation' : 'Question / Front'}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentCard.difficulty === 'Hard'
                            ? 'bg-rose-100 text-rose-700'
                            : currentCard.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {currentCard.difficulty}
                      </span>
                      <span
                        className={`text-[11px] font-medium hidden sm:inline ${
                          isFlipped ? 'text-indigo-300' : 'text-slate-400'
                        }`}
                      >
                        Click or Space to flip
                      </span>
                    </div>
                  </div>

                  {/* Main Content inside Card */}
                  <div className="my-auto py-4 text-center space-y-4">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider block ${
                        isFlipped ? 'text-indigo-300' : 'text-slate-400'
                      }`}
                    >
                      Topic: {currentCard.topic || 'Core Concept'}
                    </span>

                    {!isFlipped ? (
                      <div className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed px-4">
                        {currentCard.front}
                      </div>
                    ) : (
                      <div className="space-y-4 px-2">
                        <div className="text-lg sm:text-xl font-bold text-emerald-300 leading-relaxed">
                          {currentCard.back}
                        </div>

                        {currentCard.explanation && (
                          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg mx-auto bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-left space-y-1">
                            <span className="text-[11px] font-bold text-indigo-300 block">
                              Key Insight & Details:
                            </span>
                            <p className="text-slate-200">{currentCard.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom hint inside Card */}
                  <div
                    className={`text-[11px] text-center flex items-center justify-center gap-1.5 ${
                      isFlipped ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Click card to view prompt' : 'Click card to reveal answer'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Know It / Review Again & Navigation */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleMarkCard('review')}
                    className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-extrabold text-xs border border-rose-200 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Review Again (1 / R)</span>
                  </button>

                  <button
                    onClick={() => handleMarkCard('know')}
                    className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Know It (2 / K)</span>
                  </button>
                </div>

                {/* Secondary navigation bar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Flip to Question' : 'Flip Card (Space)'}</span>
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{currentCardIndex === sessionCards.length - 1 ? 'Finish' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="text-center text-[11px] text-slate-400 pt-1">
                  Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-slate-600">Space</kbd> Flip •{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-slate-600">1</kbd> Review Again •{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-slate-600">2</kbd> Know It •{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-slate-600">←</kbd>{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-slate-600">→</kbd> Move
                </div>
              </div>
            </div>
          ) : isSessionCompleted ? (
            /* Results & Mastery Analytics Screen */
            <div className="max-w-2xl mx-auto space-y-6">
              {(() => {
                const mastery = calculateMastery();
                return (
                  <>
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-6">
                      <div
                        className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-inner ${
                          mastery.masteryPercent >= 70
                            ? 'bg-emerald-50 text-emerald-600'
                            : mastery.masteryPercent >= 50
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        <Award className="w-10 h-10" />
                      </div>

                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                          <span
                            className={`px-3 py-1 rounded-full ${
                              mastery.classification === 'Good'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mastery.classification === 'Improving'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Mastery Level: {mastery.classification}
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {mastery.masteryPercent >= 70
                            ? 'Great Job! Flashcard Session Complete'
                            : mastery.masteryPercent >= 50
                            ? 'Solid Effort! Keep Reinforcing'
                            : 'Session Finished — Needs Revision'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          {activeDeck?.title} • {sessionCards.length} cards studied
                        </p>
                      </div>

                      {/* 4 Analytics Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <div className="text-2xl font-extrabold text-indigo-600">
                            {mastery.masteryPercent}%
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                            Mastery
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <div className="text-2xl font-extrabold text-slate-900">{mastery.total}</div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                            Total Cards
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                          <div className="text-2xl font-extrabold text-emerald-700">
                            {mastery.knowCount}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600 uppercase mt-0.5">
                            Know It
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                          <div className="text-2xl font-extrabold text-rose-700">
                            {mastery.reviewCount}
                          </div>
                          <div className="text-[11px] font-bold text-rose-600 uppercase mt-0.5">
                            Review Again
                          </div>
                        </div>
                      </div>

                      {/* Main Results Action Controls */}
                      <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                        {mastery.reviewCards.length > 0 && (
                          <button
                            onClick={handleStartRevisionMode}
                            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Start Review ({mastery.reviewCards.length} Cards)</span>
                          </button>
                        )}

                        <button
                          onClick={handleRestartFullSession}
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          <RotateCw className="w-4 h-4 text-slate-500" />
                          <span>Restart All Cards</span>
                        </button>

                        <button
                          onClick={() => setIsGenerateModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Generate New Cards</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown of Cards Reviewed in this Session */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <List className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Cards In This Session ({sessionCards.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {mastery.knowCount} Mastered • {mastery.reviewCount} Need Review
                        </span>
                      </div>

                      <div className="space-y-3">
                        {sessionCards.map((card, idx) => {
                          const status = cardStatusMap[card.id];
                          return (
                            <div
                              key={card.id}
                              className={`p-4 rounded-2xl border transition-all space-y-2 ${
                                status === 'know'
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : status === 'review'
                                  ? 'bg-rose-50/40 border-rose-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-500">
                                  Card #{idx + 1} • {card.topic || 'Concept'}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    status === 'know'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : status === 'review'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {status === 'know'
                                    ? 'Know It'
                                    : status === 'review'
                                    ? 'Review Again'
                                    : 'Unmarked'}
                                </span>
                              </div>

                              <div className="text-xs font-bold text-slate-900">
                                Q: {card.front}
                              </div>

                              <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                                <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                                  Answer:
                                </span>
                                {card.back}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* Empty State if no cards in deck */
            <div className="max-w-md mx-auto text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Flashcards Available</h3>
              <p className="text-xs text-slate-500">
                This deck does not contain any cards yet. Generate a fresh set of flashcards using
                Gemini AI.
              </p>
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Flashcards</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* All Decks Library Tab */}
      {activeTab === 'allDecks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Flashcard Decks Library</h3>
            <span className="text-xs text-slate-400">{filteredDecks.length} available decks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDecks.map((deck) => (
              <div
                key={deck.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {deck.subjectCode}
                    </span>
                    <span className="text-[11px] text-slate-400">{deck.lastStudied}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2.5 leading-snug">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deck.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    {deck.cards?.length || deck.cardCount} Flashcards
                  </span>
                  <button
                    onClick={() => {
                      setActiveDeckId(deck.id);
                      setSessionCards(deck.cards);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      setIsSessionCompleted(false);
                      setIsRevisionMode(false);
                      setCardStatusMap({});
                      setActiveTab('study');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Study Deck
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Flashcards Setup & Generation Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Flashcard Generator</h3>
                  <p className="text-[11px] text-slate-500">
                    Generate active-recall study cards with Gemini AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isGenerating && setIsGenerateModalOpen(false)}
                disabled={isGenerating}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generateError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="flex-1">{generateError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateAiFlashcards} className="space-y-4 text-xs">
              {/* 1. Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Subject</span>
                </label>
                <input
                  type="text"
                  required
                  value={genSubject}
                  disabled={isGenerating}
                  onChange={(e) => setGenSubject(e.target.value)}
                  placeholder="e.g. Java Programming, CS301, Organic Chemistry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* 2. Topic */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Topic / Concept to Test</span>
                </label>
                <input
                  type="text"
                  required
                  value={genTopic}
                  disabled={isGenerating}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Inheritance & Polymorphism, AVL Trees"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                {/* Quick Topic Pills */}
                {currentTopicSuggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold self-center">
                      Quick suggestions:
                    </span>
                    {currentTopicSuggestions.slice(0, 3).map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGenTopic(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Difficulty */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Difficulty</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as FlashcardDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setGenDifficulty(d)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        genDifficulty === d
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Number of Cards */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>4. Number of Cards</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([10, 20, 30, 50] as CardCardCount[]).map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setGenCardCount(num)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        genCardCount === num
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {num} Cards
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !genTopic.trim() || !genSubject.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Generating {genCardCount} Cards...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Flashcards</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
