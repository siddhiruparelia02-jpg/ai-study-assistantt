import React, { useState, useEffect } from 'react';
import { PageId, StudyMaterial } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { mockStudyMaterials } from './data/mockData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SignIn } from './pages/SignIn';
import { Loader2 } from 'lucide-react';
import { loadStudyMaterialsFromFirestore, saveStudyMaterialToFirestore, isFirestoreReady } from './lib/firebase';

// Pages
import { Dashboard } from './pages/Dashboard';
import { StudyPlanner } from './pages/StudyPlanner';
import { Subjects } from './pages/Subjects';
import { AiTutor } from './pages/AiTutor';
import { AiNotes } from './pages/AiNotes';
import { Flashcards } from './pages/Flashcards';
import { QuizPage } from './pages/Quiz';
import { StudyMaterials } from './pages/StudyMaterials';
import { AskNotes } from './pages/AskNotes';
import { WeakTopics } from './pages/WeakTopics';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { PerformanceProvider } from './context/PerformanceContext';
import { SettingsProvider } from './context/SettingsContext';

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [tutorInitialPrompt, setTutorInitialPrompt] = useState<string | undefined>(undefined);
  const [flashcardsInitialTopic, setFlashcardsInitialTopic] = useState<string | undefined>(undefined);
  const [quizInitialTopic, setQuizInitialTopic] = useState<string | undefined>(undefined);
  const [askNotesInitialQuestion, setAskNotesInitialQuestion] = useState<string | undefined>(undefined);
  const [materials, setMaterials] = useState<StudyMaterial[]>(mockStudyMaterials);
  const [selectedMaterialIdForAskNotes, setSelectedMaterialIdForAskNotes] = useState<string | undefined>(
    mockStudyMaterials[0]?.id
  );

  // Synchronize study materials from Firestore when user signs in
  useEffect(() => {
    async function loadUserMaterials() {
      if (!user?.uid) {
        setMaterials([]);
        return;
      }
      if (isFirestoreReady()) {
        try {
          const firestoreList = await loadStudyMaterialsFromFirestore(user.uid);
          const hasInitialized = localStorage.getItem(`study_materials_init_${user.uid}`);
          if (firestoreList && firestoreList.length > 0) {
            setMaterials(firestoreList);
            localStorage.setItem(`study_materials_init_${user.uid}`, 'true');
          } else if (!hasInitialized) {
            // First time user: seed starter curriculum study materials into Firestore for this user
            const seededMaterials = mockStudyMaterials.map((m) => ({
              ...m,
              userId: user.uid,
            }));
            setMaterials(seededMaterials);
            localStorage.setItem(`study_materials_init_${user.uid}`, 'true');
            // Persist to user's Firestore collection asynchronously
            Promise.all(seededMaterials.map((m) => saveStudyMaterialToFirestore(m, user.uid))).catch((err) =>
              console.warn('Notice saving seeded study materials to Firestore:', err)
            );
          } else {
            // User previously initialized and explicitly deleted all materials
            setMaterials([]);
          }
        } catch (err) {
          console.warn('Error loading materials in App:', err);
        }
      }
    }
    loadUserMaterials();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md animate-pulse">
            A
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">StudyAI Assistant</h3>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 pt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying authentication...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubject = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
  };

  const handleStudyWeakTopic = (subjectCode: string, topicName: string) => {
    setSelectedSubject(subjectCode);
    setTutorInitialPrompt(
      `I need help understanding "${topicName}" in ${subjectCode}. I had difficulty with it on my diagnostic quiz. Can you break down the core concepts, common pitfalls, and explain with simple analogies?`
    );
    setActivePage('tutor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskNotesForTopic = (subjectCode: string, topicName: string) => {
    if (subjectCode && subjectCode !== 'ALL') {
      setSelectedSubject(subjectCode);
      const matchingMaterial = materials.find(
        (m) =>
          m.subjectCode === subjectCode ||
          m.title.toLowerCase().includes(topicName.toLowerCase())
      );
      if (matchingMaterial) {
        setSelectedMaterialIdForAskNotes(matchingMaterial.id);
      }
    }
    setAskNotesInitialQuestion(
      `What are the core concepts and common exam pitfalls related to "${topicName}" in this document?`
    );
    setActivePage('ask-notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePracticeQuizFromTopic = (subjectCode: string, topic: string) => {
    if (subjectCode && subjectCode !== 'ALL') {
      setSelectedSubject(subjectCode);
    }
    setQuizInitialTopic(topic);
    setActivePage('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewFlashcardsFromTopic = (subjectCode: string, topic: string) => {
    if (subjectCode && subjectCode !== 'ALL') {
      setSelectedSubject(subjectCode);
    }
    setFlashcardsInitialTopic(topic);
    setActivePage('flashcards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateFlashcardsFromTopic = (subjectCode: string, topic: string) => {
    setSelectedSubject(subjectCode);
    setFlashcardsInitialTopic(topic);
    setActivePage('flashcards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateQuizFromTopic = (subjectCode: string, topic: string) => {
    setSelectedSubject(subjectCode);
    setQuizInitialTopic(topic);
    setActivePage('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAboutMaterial = (subjectCode: string, materialTitle: string, topic?: string) => {
    setSelectedSubject(subjectCode);
    setTutorInitialPrompt(
      `I am studying the course material "${materialTitle}"${topic ? ` on the topic "${topic}"` : ''} in ${subjectCode}. Can you explain the key concepts, core mechanisms, and give me targeted practice questions based on this document?`
    );
    setActivePage('tutor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAskNotesForMaterial = (materialId: string, subjectCode?: string) => {
    setSelectedMaterialIdForAskNotes(materialId);
    if (subjectCode && subjectCode !== 'ALL') {
      setSelectedSubject(subjectCode);
    }
    setActivePage('ask-notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskTutorFromNotes = (question: string, subjectCode?: string) => {
    if (subjectCode && subjectCode !== 'ALL') {
      setSelectedSubject(subjectCode);
    }
    setTutorInitialPrompt(question);
    setActivePage('tutor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SettingsProvider>
      <PerformanceProvider>
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
          {/* Desktop Sticky Sidebar */}
          <div className="hidden md:block shrink-0">
            <Sidebar
              activePage={activePage}
              onNavigate={handleNavigate}
              onSelectSubject={handleSelectSubject}
            />
          </div>

          {/* Mobile Drawer */}
          <MobileNav
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            activePage={activePage}
            onNavigate={handleNavigate}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            {/* Top Header */}
            <Header
              activePage={activePage}
              onNavigate={handleNavigate}
              selectedSubject={selectedSubject}
              onSelectSubject={handleSelectSubject}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onOpenUploadModal={() => {
                setActivePage('materials');
                setIsUploadModalOpen(true);
              }}
            />

            {/* Page Container */}
            <main
              className={`flex-1 ${
                activePage === 'ask-notes' ? 'p-0' : 'p-4 sm:p-6 lg:p-8 max-w-7xl'
              } w-full mx-auto`}
            >
              {activePage === 'dashboard' && (
                <Dashboard
                  onNavigate={handleNavigate}
                  onSelectSubject={handleSelectSubject}
                  onOpenUploadModal={() => {
                    setActivePage('materials');
                    setIsUploadModalOpen(true);
                  }}
                />
              )}

              {activePage === 'planner' && (
                <StudyPlanner
                  onNavigate={handleNavigate}
                  onOpenTutor={(subjCode, topic) => handleStudyWeakTopic(subjCode, topic || 'Core Fundamentals')}
                  onOpenQuiz={(subjCode, topic) => handlePracticeQuizFromTopic(subjCode, topic || 'Core Fundamentals')}
                  onOpenFlashcards={(subjCode) => {
                    setSelectedSubject(subjCode);
                    setActivePage('flashcards');
                  }}
                  onOpenNotes={(subjCode) => {
                    setSelectedSubject(subjCode);
                    setActivePage('notes');
                  }}
                  onOpenMaterials={(subjCode) => {
                    setSelectedSubject(subjCode);
                    setActivePage('materials');
                  }}
                  materials={materials}
                />
              )}

              {activePage === 'subjects' && (
                <Subjects
                  onNavigate={handleNavigate}
                  onSelectSubject={handleSelectSubject}
                  selectedSubject={selectedSubject}
                />
              )}

              {activePage === 'tutor' && (
                <AiTutor
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  initialPrompt={tutorInitialPrompt}
                  onClearInitialPrompt={() => setTutorInitialPrompt(undefined)}
                />
              )}

              {activePage === 'notes' && (
                <AiNotes
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  onCreateFlashcards={handleCreateFlashcardsFromTopic}
                  onCreateQuiz={handleCreateQuizFromTopic}
                  materials={materials}
                />
              )}

              {activePage === 'flashcards' && (
                <Flashcards
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  onStudyWeakTopic={handleStudyWeakTopic}
                  initialTopic={flashcardsInitialTopic}
                  onClearInitialTopic={() => setFlashcardsInitialTopic(undefined)}
                />
              )}

              {activePage === 'quiz' && (
                <QuizPage
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  onStudyWeakTopic={handleStudyWeakTopic}
                  initialTopic={quizInitialTopic}
                  onClearInitialTopic={() => setQuizInitialTopic(undefined)}
                />
              )}

              {activePage === 'materials' && (
                <StudyMaterials
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  isUploadModalOpen={isUploadModalOpen}
                  setIsUploadModalOpen={setIsUploadModalOpen}
                  onAskAboutMaterial={handleAskAboutMaterial}
                  onAskNotes={handleOpenAskNotesForMaterial}
                  materials={materials}
                  onMaterialsChange={setMaterials}
                />
              )}

              {activePage === 'ask-notes' && (
                <AskNotes
                  materials={materials}
                  selectedMaterialId={selectedMaterialIdForAskNotes}
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onSelectMaterial={(matId) => setSelectedMaterialIdForAskNotes(matId)}
                  onNavigate={handleNavigate}
                  onAskTutorGeneral={handleAskTutorFromNotes}
                  onOpenUploadModal={() => {
                    setActivePage('materials');
                    setIsUploadModalOpen(true);
                  }}
                  initialQuestion={askNotesInitialQuestion}
                  onClearInitialQuestion={() => setAskNotesInitialQuestion(undefined)}
                />
              )}

              {activePage === 'weak-topics' && (
                <WeakTopics
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  onStudyTopic={handleStudyWeakTopic}
                  onAskMyNotes={handleAskNotesForTopic}
                  onPracticeQuiz={handlePracticeQuizFromTopic}
                  onReviewFlashcards={handleReviewFlashcardsFromTopic}
                />
              )}

              {activePage === 'progress' && (
                <Progress
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  onNavigate={handleNavigate}
                  onStudyTopic={handleStudyWeakTopic}
                  onPracticeQuiz={handlePracticeQuizFromTopic}
                  onReviewFlashcards={handleReviewFlashcardsFromTopic}
                />
              )}

              {activePage === 'settings' && (
                <Settings
                  onNavigate={handleNavigate}
                />
              )}
            </main>
          </div>
        </div>
      </PerformanceProvider>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
