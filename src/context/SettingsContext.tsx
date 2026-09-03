import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  UserProfile,
  Subject,
  StudentAcademicSettings,
  StudentStudyPreferences,
  StudentLearningPreferences,
  StudentNotificationSettings,
} from '../types';
import {
  getUserProfile,
  saveUserProfile,
  loadSubjectsFromFirestore,
  saveSubjectToFirestore,
  deleteSubjectFromFirestore,
  saveMultipleSubjectsToFirestore,
  isFirestoreReady,
} from '../lib/firebase';
import { mockSubjects } from '../data/mockData';
import { useAuth } from './AuthContext';

export interface UpcomingExamItem {
  subject: Subject;
  daysLeft: number;
  isPast: boolean;
  examDateFormatted: string;
}

export interface SettingsContextType {
  profile: UserProfile | null;
  subjects: Subject[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  targetExamDays: number;
  targetExamSubject: string;
  upcomingExams: UpcomingExamItem[];
  // Update functions
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updateAcademicSettings: (data: Partial<StudentAcademicSettings>) => Promise<boolean>;
  updateStudyPreferences: (data: Partial<StudentStudyPreferences>) => Promise<boolean>;
  updateLearningPreferences: (data: Partial<StudentLearningPreferences>) => Promise<boolean>;
  updateNotificationSettings: (data: Partial<StudentNotificationSettings>) => Promise<boolean>;
  // Subject management
  addSubject: (subject: Omit<Subject, 'id'> & { id?: string }) => Promise<Subject>;
  updateSubject: (subjectId: string, data: Partial<Subject>) => Promise<boolean>;
  deleteSubject: (subjectId: string) => Promise<boolean>;
  resetToDefaultSubjects: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultAcademic: StudentAcademicSettings = {
  degree: 'Bachelor of Computer Applications (BCA)',
  rollNumber: 'BCA-2024-089',
  targetGraduationYear: '2027',
  targetGPA: '8.5 CGPA',
  targetPercentage: 85,
  examBoard: 'Yashwantrao Chavan Maharashtra Open University (YCMOU)',
  semesterExamStartDate: '2027-01-03',
  primaryMajor: 'Computer Applications / IT',
};

const defaultStudyPreferences: StudentStudyPreferences = {
  dailyStudyMinutes: 120,
  sessionLengthMinutes: 45,
  breakLengthMinutes: 10,
  studyDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  preferredStudySlot: 'Evening (5 PM - 9 PM)',
  weeklyGoalHours: 15,
};

const defaultLearningPreferences: StudentLearningPreferences = {
  tutorStyle: 'Step-by-Step Problem Solver',
  defaultDifficulty: 'Intermediate',
  defaultNoteStyle: 'Exam Notes',
  flashcardReviewPace: 'Spaced Repetition (Standard)',
  includeRealWorldExamples: true,
  includeCodeSnippets: true,
};

const defaultNotifications: StudentNotificationSettings = {
  dailyStudyReminders: true,
  upcomingExamAlerts: true,
  weakTopicAlerts: true,
  emailDigest: false,
};

const calculateDaysUntilExam = (dateStr: string): number => {
  if (!dateStr) return 0;
  const examDate = new Date(dateStr);
  const now = new Date();
  const diffTime = examDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    return mockSubjects.map((s) => ({
      ...s,
      daysUntilExam: calculateDaysUntilExam(s.examDate),
    }));
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load and synchronize profile and subjects from Firestore
  const loadData = useCallback(async () => {
    if (!user?.uid) {
      // Fallback default state for unauthenticated / guest preview
      setProfile({
        uid: 'guest-user',
        displayName: 'Guest Student',
        email: 'student@hindujacollege.edu.in',
        college: 'K. P. B. Hinduja College of Commerce (YCMOU)',
        semester: 'SYBCA • Semester 4',
        bio: 'Computer Applications student preparing for university exams and software engineering interviews.',
        academic: defaultAcademic,
        studyPreferences: defaultStudyPreferences,
        learningPreferences: defaultLearningPreferences,
        notifications: defaultNotifications,
      });
      setSubjects(
        mockSubjects.map((s) => ({
          ...s,
          daysUntilExam: calculateDaysUntilExam(s.examDate),
        }))
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isFirestoreReady()) {
        // 1. Fetch Profile
        const firestoreProfile = await getUserProfile(user.uid);
        if (firestoreProfile) {
          setProfile({
            ...firestoreProfile,
            uid: user.uid,
            displayName: firestoreProfile.displayName || user.displayName || 'Student',
            email: firestoreProfile.email || user.email || '',
            photoURL: firestoreProfile.photoURL ?? user.photoURL ?? null,
            college: firestoreProfile.college || 'K. P. B. Hinduja College of Commerce (YCMOU)',
            semester: firestoreProfile.semester || 'SYBCA • Semester 4',
            bio: firestoreProfile.bio || 'Computer Applications student preparing for university exams and software engineering interviews.',
            academic: {
              ...defaultAcademic,
              ...(firestoreProfile.academic || {}),
            },
            studyPreferences: {
              ...defaultStudyPreferences,
              ...(firestoreProfile.studyPreferences || {}),
            },
            learningPreferences: {
              ...defaultLearningPreferences,
              ...(firestoreProfile.learningPreferences || {}),
            },
            notifications: {
              ...defaultNotifications,
              ...(firestoreProfile.notifications || {}),
            },
          });
        } else {
          // Initialize fresh profile
          const initialProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Student',
            email: user.email || '',
            photoURL: user.photoURL || null,
            college: 'K. P. B. Hinduja College of Commerce (YCMOU)',
            semester: 'SYBCA • Semester 4',
            bio: 'Computer Applications student preparing for university exams and software engineering interviews.',
            academic: defaultAcademic,
            studyPreferences: defaultStudyPreferences,
            learningPreferences: defaultLearningPreferences,
            notifications: defaultNotifications,
          };
          setProfile(initialProfile);
          await saveUserProfile(user.uid, initialProfile);
        }

        // 2. Fetch Subjects
        const firestoreSubjects = await loadSubjectsFromFirestore(user.uid);
        if (firestoreSubjects && firestoreSubjects.length > 0) {
          const updated = firestoreSubjects.map((s) => ({
            ...s,
            daysUntilExam: calculateDaysUntilExam(s.examDate),
          }));
          setSubjects(updated);
        } else {
          // Seed default subjects into Firestore
          const seededSubjects = mockSubjects.map((s) => ({
            ...s,
            daysUntilExam: calculateDaysUntilExam(s.examDate),
          }));
          setSubjects(seededSubjects);
          await saveMultipleSubjectsToFirestore(seededSubjects, user.uid);
        }
      }
    } catch (err: any) {
      console.warn('Error loading settings from Firestore:', err);
      setError('Could not sync settings with cloud. Local copy is active.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Profile updates
  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;
    setIsSaving(true);
    setError(null);

    const updated: UserProfile = {
      ...profile,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setProfile(updated);

    try {
      if (user?.uid && isFirestoreReady()) {
        await saveUserProfile(user.uid, updated);
      }
      return true;
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError('Failed to update profile to cloud.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAcademicSettings = async (data: Partial<StudentAcademicSettings>): Promise<boolean> => {
    if (!profile) return false;
    const newAcademic = {
      ...(profile.academic || defaultAcademic),
      ...data,
    };
    return await updateProfile({ academic: newAcademic });
  };

  const updateStudyPreferences = async (data: Partial<StudentStudyPreferences>): Promise<boolean> => {
    if (!profile) return false;
    const newPrefs = {
      ...(profile.studyPreferences || defaultStudyPreferences),
      ...data,
    };
    return await updateProfile({ studyPreferences: newPrefs });
  };

  const updateLearningPreferences = async (data: Partial<StudentLearningPreferences>): Promise<boolean> => {
    if (!profile) return false;
    const newPrefs = {
      ...(profile.learningPreferences || defaultLearningPreferences),
      ...data,
    };
    return await updateProfile({ learningPreferences: newPrefs });
  };

  const updateNotificationSettings = async (data: Partial<StudentNotificationSettings>): Promise<boolean> => {
    if (!profile) return false;
    const newNotifs = {
      ...(profile.notifications || defaultNotifications),
      ...data,
    };
    return await updateProfile({ notifications: newNotifs });
  };

  // Subject management
  const addSubject = async (
    subjData: Omit<Subject, 'id'> & { id?: string }
  ): Promise<Subject> => {
    const newId = subjData.id || `subj-${Date.now()}`;
    const daysUntilExam = calculateDaysUntilExam(subjData.examDate);

    const newSubject: Subject = {
      ...subjData,
      id: newId,
      daysUntilExam,
      progressPercent: subjData.progressPercent ?? 0,
      totalChapters: subjData.totalChapters ?? 6,
      completedChapters: subjData.completedChapters ?? 0,
      materialsCount: subjData.materialsCount ?? 0,
      weakTopicsCount: subjData.weakTopicsCount ?? 0,
      topics: Array.isArray(subjData.topics) ? subjData.topics : [],
      description: subjData.description || `Syllabus and learning goals for ${subjData.name}`,
      color: subjData.color || 'indigo',
      icon: subjData.icon || 'BookOpen',
      targetScore: subjData.targetScore ?? 85,
    };

    const nextList = [newSubject, ...subjects.filter((s) => s.id !== newId)];
    setSubjects(nextList);

    if (user?.uid && isFirestoreReady()) {
      await saveSubjectToFirestore(newSubject, user.uid);
    }

    return newSubject;
  };

  const updateSubject = async (subjectId: string, data: Partial<Subject>): Promise<boolean> => {
    const target = subjects.find((s) => s.id === subjectId || s.code === subjectId);
    if (!target) return false;

    const daysUntilExam = data.examDate !== undefined ? calculateDaysUntilExam(data.examDate) : target.daysUntilExam;

    const updatedSubject: Subject = {
      ...target,
      ...data,
      daysUntilExam,
    };

    const nextList = subjects.map((s) => (s.id === target.id ? updatedSubject : s));
    setSubjects(nextList);

    if (user?.uid && isFirestoreReady()) {
      await saveSubjectToFirestore(updatedSubject, user.uid);
    }

    return true;
  };

  const deleteSubject = async (subjectId: string): Promise<boolean> => {
    const target = subjects.find((s) => s.id === subjectId || s.code === subjectId);
    if (!target) return false;

    const nextList = subjects.filter((s) => s.id !== target.id);
    setSubjects(nextList);

    if (user?.uid && isFirestoreReady()) {
      await deleteSubjectFromFirestore(target.id, user.uid);
    }

    return true;
  };

  const resetToDefaultSubjects = async (): Promise<void> => {
    const seeded = mockSubjects.map((s) => ({
      ...s,
      daysUntilExam: calculateDaysUntilExam(s.examDate),
    }));
    setSubjects(seeded);

    if (user?.uid && isFirestoreReady()) {
      await saveMultipleSubjectsToFirestore(seeded, user.uid);
    }
  };

  // Compute upcoming exams sorted by date
  const upcomingExams = useMemo<UpcomingExamItem[]>(() => {
    return subjects
      .filter((s) => s.examDate && !s.isArchived)
      .map((s) => {
        const daysLeft = calculateDaysUntilExam(s.examDate);
        const examDateObj = new Date(s.examDate);
        const formatted = !isNaN(examDateObj.getTime())
          ? examDateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : s.examDate;

        return {
          subject: s,
          daysLeft,
          isPast: daysLeft === 0 && new Date(s.examDate).getTime() < Date.now() - 86400000,
          examDateFormatted: formatted,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.subject.examDate).getTime();
        const dateB = new Date(b.subject.examDate).getTime();
        return dateA - dateB;
      });
  }, [subjects]);

  // Target exam details (closest upcoming exam)
  const targetExamInfo = useMemo(() => {
    const validUpcoming = upcomingExams.filter((e) => !e.isPast);
    if (validUpcoming.length > 0) {
      return {
        days: validUpcoming[0].daysLeft,
        name: validUpcoming[0].subject.name,
        code: validUpcoming[0].subject.code,
      };
    }
    return {
      days: 0,
      name: subjects[0]?.name || 'Course Exam',
      code: subjects[0]?.code || 'EXAM',
    };
  }, [upcomingExams, subjects]);

  return (
    <SettingsContext.Provider
      value={{
        profile,
        subjects,
        isLoading,
        isSaving,
        error,
        targetExamDays: targetExamInfo.days,
        targetExamSubject: targetExamInfo.name,
        upcomingExams,
        updateProfile,
        updateAcademicSettings,
        updateStudyPreferences,
        updateLearningPreferences,
        updateNotificationSettings,
        addSubject,
        updateSubject,
        deleteSubject,
        resetToDefaultSubjects,
        refreshSettings: loadData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
