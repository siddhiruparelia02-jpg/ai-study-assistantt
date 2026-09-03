import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';
import {
  Subject,
  StudyMaterial,
  NoteItem,
  TopicStudyPerformance,
  ActivityItem,
  UserProfile,
  PlannerPreferences,
  StudyPlan,
  PlannerTask,
} from '../types';

// Safe Firebase App Initialization
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let isFirebaseAvailable = false;

try {
  if (firebaseConfigJson && firebaseConfigJson.projectId) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigJson);
    const databaseId =
      firebaseConfigJson.firestoreDatabaseId &&
      firebaseConfigJson.firestoreDatabaseId !== '(default)'
        ? firebaseConfigJson.firestoreDatabaseId
        : undefined;

    firestoreDb = databaseId
      ? getFirestore(firebaseApp, databaseId)
      : getFirestore(firebaseApp);

    firebaseAuth = getAuth(firebaseApp);

    // Initialize Storage
    try {
      firebaseStorage = getStorage(firebaseApp);
    } catch (storageErr) {
      console.warn('Firebase Storage initialization warning:', storageErr);
    }

    // Ensure persistent login
    try {
      setPersistence(firebaseAuth, browserLocalPersistence);
    } catch {
      // Browser fallback
    }

    isFirebaseAvailable = true;
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
  isFirebaseAvailable = false;
}

export const app = firebaseApp;
export const db = firestoreDb;
export const auth = firebaseAuth;
export const storage = firebaseStorage;
export const isFirestoreReady = (): boolean => isFirebaseAvailable && !!db;
export const isAuthReady = (): boolean => isFirebaseAvailable && !!auth;
export const isStorageReady = (): boolean => isFirebaseAvailable && !!storage;

// Active User ID resolution
export const getActiveUserId = (): string | null => {
  if (auth && auth.currentUser) {
    return auth.currentUser.uid;
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('study_user_id');
    if (saved) return saved;
  }
  return null;
};

// Helper to get collection path under users/{userId}/{subcollection}
export const getUserSubcollectionRef = (subcollectionName: string, customUserId?: string) => {
  const uid = customUserId || getActiveUserId();
  if (!firestoreDb || !uid) return null;
  return collection(firestoreDb, 'users', uid, subcollectionName);
};

export const getUserDocRef = (
  subcollectionName: string,
  docId: string,
  customUserId?: string
) => {
  const uid = customUserId || getActiveUserId();
  if (!firestoreDb || !uid) return null;
  return doc(firestoreDb, 'users', uid, subcollectionName, docId);
};

/* =========================================================================
   AUTHENTICATION HELPERS
   ========================================================================= */

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const user = result.user;

    // Synchronize user profile into Firestore users/{uid}
    if (user && firestoreDb) {
      const userRef = doc(firestoreDb, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Student',
          email: user.email || '',
          photoURL: user.photoURL || null,
          college: 'K. P. B. Hinduja College of Commerce (YCMOU)',
          semester: 'SYBCA • Semester 4',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          userRef,
          {
            displayName: user.displayName || userSnap.data()?.displayName || 'Student',
            email: user.email || userSnap.data()?.email || '',
            photoURL: user.photoURL || userSnap.data()?.photoURL || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    if (typeof window !== 'undefined' && user?.uid) {
      localStorage.setItem('study_user_id', user.uid);
    }

    return user;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing. Please try again.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in operation was cancelled. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by browser. Please allow popups or open in a new tab.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error during authentication. Please check your internet connection.');
    }
    throw new Error(error.message || 'Failed to sign in with Google.');
  }
};

export const signOutUser = async (): Promise<void> => {
  if (firebaseAuth) {
    await firebaseSignOut(firebaseAuth);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('study_user_id');
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!firestoreDb || !uid) return null;
  try {
    const userRef = doc(firestoreDb, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile:', err);
    return null;
  }
};

export const saveUserProfile = async (
  uid: string,
  profileData: Partial<UserProfile>
): Promise<boolean> => {
  if (!firestoreDb || !uid) return false;
  try {
    const userRef = doc(firestoreDb, 'users', uid);
    await setDoc(
      userRef,
      {
        ...profileData,
        uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
    return false;
  }
};

/* =========================================================================
   SUBJECTS COLLECTION MANAGEMENT
   ========================================================================= */

export const saveSubjectToFirestore = async (
  subject: Subject,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('subjects', subject.id, uid);
    if (!docRef) return false;
    await setDoc(
      docRef,
      {
        ...subject,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving subject to Firestore:', err);
    return false;
  }
};

export const loadSubjectsFromFirestore = async (
  customUserId?: string
): Promise<Subject[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const subjectsCol = getUserSubcollectionRef('subjects', uid);
    if (!subjectsCol) return [];
    const snap = await getDocs(subjectsCol);
    if (snap.empty) return [];
    const list: Subject[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      // Calculate days until exam if examDate exists
      let daysUntilExam = data.daysUntilExam ?? 0;
      if (data.examDate) {
        const examTime = new Date(data.examDate).getTime();
        const nowTime = new Date().getTime();
        daysUntilExam = Math.max(0, Math.ceil((examTime - nowTime) / (1000 * 60 * 60 * 24)));
      }

      list.push({
        id: data.id || d.id,
        code: data.code || '',
        name: data.name || '',
        department: data.department || '',
        semester: data.semester || 'Semester 4',
        color: data.color || 'indigo',
        icon: data.icon || 'BookOpen',
        examDate: data.examDate || '',
        daysUntilExam,
        progressPercent: data.progressPercent ?? 0,
        totalChapters: data.totalChapters ?? 6,
        completedChapters: data.completedChapters ?? 0,
        materialsCount: data.materialsCount ?? 0,
        weakTopicsCount: data.weakTopicsCount ?? 0,
        description: data.description || '',
        topics: Array.isArray(data.topics) ? data.topics : [],
        targetScore: data.targetScore ?? 85,
        isArchived: !!data.isArchived,
      });
    });
    return list;
  } catch (err) {
    console.error('Error loading subjects from Firestore:', err);
    return [];
  }
};

export const deleteSubjectFromFirestore = async (
  subjectId: string,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('subjects', subjectId, uid);
    if (!docRef) return false;
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting subject from Firestore:', err);
    return false;
  }
};

export const saveMultipleSubjectsToFirestore = async (
  subjects: Subject[],
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const promises = subjects.map((subj) => saveSubjectToFirestore(subj, uid));
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.error('Error saving multiple subjects to Firestore:', err);
    return false;
  }
};

/* =========================================================================
   1. QUIZ RESULTS & QUIZZES
   ========================================================================= */

export interface PersistedQuizResult {
  id: string;
  quizId?: string;
  quizTitle: string;
  subjectCode: string;
  subjectName: string;
  topicName: string;
  difficulty?: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  mistakes?: string[];
  timestamp: string;
  date: string;
  createdAt?: any;
}

export const saveQuizResultToFirestore = async (
  result: PersistedQuizResult,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('quizResults', result.id, uid);
    if (!docRef) return false;
    await setDoc(docRef, {
      ...result,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Error saving quiz result to Firestore:', err);
    return false;
  }
};

export const loadQuizResultsFromFirestore = async (
  customUserId?: string
): Promise<PersistedQuizResult[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const colRef = getUserSubcollectionRef('quizResults', uid);
    if (!colRef) return [];
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const results: PersistedQuizResult[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      results.push({
        id: d.id,
        quizId: data.quizId || '',
        quizTitle: data.quizTitle || 'Quiz',
        subjectCode: data.subjectCode || 'JAVA',
        subjectName: data.subjectName || 'Java',
        topicName: data.topicName || 'General',
        difficulty: data.difficulty || 'Medium',
        scorePercent: data.scorePercent ?? 0,
        correctCount: data.correctCount ?? 0,
        totalQuestions: data.totalQuestions ?? 0,
        mistakes: data.mistakes || [],
        timestamp: data.timestamp || 'Recent',
        date: data.date || new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      });
    });
    return results;
  } catch (err) {
    console.error('Error loading quiz results from Firestore:', err);
    return [];
  }
};

/* =========================================================================
   2. FLASHCARD SESSIONS & DECKS
   ========================================================================= */

export interface PersistedFlashcardSession {
  id: string;
  deckId?: string;
  deckTitle: string;
  subjectCode: string;
  subjectName: string;
  topicName: string;
  masteredCount: number;
  reviewCount: number;
  totalReviewed: number;
  masteryPercent: number;
  timestamp: string;
  createdAt?: any;
}

export const saveFlashcardSessionToFirestore = async (
  session: PersistedFlashcardSession,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('flashcardSessions', session.id, uid);
    if (!docRef) return false;
    await setDoc(docRef, {
      ...session,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Error saving flashcard session to Firestore:', err);
    return false;
  }
};

export const loadFlashcardSessionsFromFirestore = async (
  customUserId?: string
): Promise<PersistedFlashcardSession[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const colRef = getUserSubcollectionRef('flashcardSessions', uid);
    if (!colRef) return [];
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const results: PersistedFlashcardSession[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      results.push({
        id: d.id,
        deckId: data.deckId || '',
        deckTitle: data.deckTitle || 'Flashcards',
        subjectCode: data.subjectCode || 'JAVA',
        subjectName: data.subjectName || 'Java',
        topicName: data.topicName || 'General',
        masteredCount: data.masteredCount ?? 0,
        reviewCount: data.reviewCount ?? 0,
        totalReviewed: data.totalReviewed ?? 0,
        masteryPercent: data.masteryPercent ?? 0,
        timestamp: data.timestamp || 'Recent',
      });
    });
    return results;
  } catch (err) {
    console.error('Error loading flashcard sessions from Firestore:', err);
    return [];
  }
};

/* =========================================================================
   3. STUDY MATERIALS & FIREBASE STORAGE
   ========================================================================= */

export const uploadStudyMaterialFile = async (
  materialId: string,
  file: File,
  customUserId?: string
): Promise<{ storagePath: string; downloadUrl?: string }> => {
  const uid = customUserId || getActiveUserId();
  if (!uid) {
    throw new Error('User must be authenticated to upload study materials.');
  }

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetPath = `users/${uid}/study-materials/${materialId}/${sanitizedFileName}`;

  if (!firebaseStorage) {
    console.warn('Firebase Storage is not initialized, continuing with path record');
    return { storagePath: targetPath };
  }

  try {
    const fileRef = storageRef(firebaseStorage, targetPath);
    await uploadBytes(fileRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        userId: uid,
        materialId,
        originalName: file.name,
      },
    });

    let downloadUrl: string | undefined;
    try {
      downloadUrl = await getDownloadURL(fileRef);
    } catch {
      // downloadURL may not be required if accessed privately
    }

    return { storagePath: targetPath, downloadUrl };
  } catch (err: any) {
    console.error('Firebase Storage upload error:', err);
    throw new Error(err.message || 'Failed to upload document file to Firebase Storage.');
  }
};

export const deleteStudyMaterialFile = async (storagePath: string): Promise<boolean> => {
  if (!firebaseStorage || !storagePath) return false;
  try {
    const fileRef = storageRef(firebaseStorage, storagePath);
    await deleteObject(fileRef);
    return true;
  } catch (err) {
    console.warn('Notice deleting file from Firebase Storage:', err);
    return false;
  }
};

export const saveStudyMaterialToFirestore = async (
  material: StudyMaterial,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('studyMaterials', material.id, uid);
    if (!docRef) return false;
    await setDoc(
      docRef,
      {
        ...material,
        materialId: material.id,
        userId: uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving study material to Firestore:', err);
    return false;
  }
};

export const deleteStudyMaterialFromFirestore = async (
  materialId: string,
  storagePath?: string,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    // Delete file from Firebase Storage if storagePath is provided
    if (storagePath) {
      await deleteStudyMaterialFile(storagePath);
    }

    const docRef = getUserDocRef('studyMaterials', materialId, uid);
    if (!docRef) return false;
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting study material from Firestore:', err);
    return false;
  }
};

export const loadStudyMaterialsFromFirestore = async (
  customUserId?: string
): Promise<StudyMaterial[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const colRef = getUserSubcollectionRef('studyMaterials', uid);
    if (!colRef) return [];
    const snapshot = await getDocs(colRef);
    const materials: StudyMaterial[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      materials.push({
        id: d.id,
        materialId: data.materialId || d.id,
        userId: data.userId || uid,
        title: data.title || 'Study Material',
        fileName: data.fileName || data.title,
        subjectId: data.subjectId || `subj-${(data.subjectCode || 'JAVA').toLowerCase()}`,
        subjectCode: data.subjectCode || 'JAVA',
        type: data.type || 'PDF',
        category: data.category || 'Lecture Notes',
        topic: data.topic || 'General',
        fileSize: data.fileSize || '1.0 MB',
        uploadDate: data.uploadDate || new Date().toISOString().split('T')[0],
        uploadTimestamp: data.uploadTimestamp || '',
        storagePath: data.storagePath,
        downloadUrl: data.downloadUrl,
        tags: data.tags || [data.subjectCode || 'JAVA', 'Study Material'],
        status: data.status || 'Ready',
        processingStatus: data.processingStatus || (data.status?.toLowerCase() as any) || 'ready',
        progress: data.progress ?? 100,
        errorMessage: data.errorMessage || data.processingError,
        processingError: data.processingError || data.errorMessage,
        fileContent: data.fileContent || '',
        pageCount: data.pageCount,
        generatedItems: data.generatedItems || {
          flashcards: 12,
          notes: 2,
          quizzes: 1,
        },
        summarySnippet: data.summarySnippet || '',
      });
    });
    return materials;
  } catch (err) {
    console.error('Error loading study materials from Firestore:', err);
    return [];
  }
};

/* =========================================================================
   4. AI NOTES
   ========================================================================= */

export const saveNoteToFirestore = async (
  note: NoteItem,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('notes', note.id, uid);
    if (!docRef) return false;
    await setDoc(docRef, {
      ...note,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Error saving note to Firestore:', err);
    return false;
  }
};

export const deleteNoteFromFirestore = async (
  noteId: string,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('notes', noteId, uid);
    if (!docRef) return false;
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting note from Firestore:', err);
    return false;
  }
};

export const loadNotesFromFirestore = async (
  customUserId?: string
): Promise<NoteItem[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const colRef = getUserSubcollectionRef('notes', uid);
    if (!colRef) return [];
    const snapshot = await getDocs(colRef);
    const notes: NoteItem[] = [];
    snapshot.forEach((d) => {
      notes.push({ id: d.id, ...(d.data() as any) });
    });
    return notes;
  } catch (err) {
    console.error('Error loading notes from Firestore:', err);
    return [];
  }
};

/* =========================================================================
   5. WEAK TOPICS & TOPIC PERFORMANCE
   ========================================================================= */

export const saveTopicPerformanceToFirestore = async (
  topic: TopicStudyPerformance,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('weakTopics', topic.id, uid);
    if (!docRef) return false;
    await setDoc(docRef, {
      ...topic,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Error saving topic performance to Firestore:', err);
    return false;
  }
};

export const loadTopicPerformancesFromFirestore = async (
  customUserId?: string
): Promise<TopicStudyPerformance[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const colRef = getUserSubcollectionRef('weakTopics', uid);
    if (!colRef) return [];
    const snapshot = await getDocs(colRef);
    const topics: TopicStudyPerformance[] = [];
    snapshot.forEach((d) => {
      topics.push({ id: d.id, ...(d.data() as any) });
    });
    return topics;
  } catch (err) {
    console.error('Error loading topic performances from Firestore:', err);
    return [];
  }
};

/* =========================================================================
   6. RECENT ACTIVITY
   ========================================================================= */

export const saveActivityToFirestore = async (
  activity: ActivityItem,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('activity', activity.id, uid);
    if (!docRef) return false;
    await setDoc(docRef, {
      ...activity,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Error saving activity to Firestore:', err);
    return false;
  }
};

export const loadActivitiesFromFirestore = async (
  customUserId?: string
): Promise<ActivityItem[]> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return [];
  try {
    const colRef = getUserSubcollectionRef('activity', uid);
    if (!colRef) return [];
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const activities: ActivityItem[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      activities.push({
        id: d.id,
        type: data.type || 'quiz',
        title: data.title || 'Study Activity',
        subjectCode: data.subjectCode || 'JAVA',
        timestamp: data.timestamp || 'Recent',
        scoreOrCount: data.scoreOrCount,
      });
    });
    return activities;
  } catch (err) {
    console.error('Error loading activities from Firestore:', err);
    return [];
  }
};

/* =========================================================================
   7. STUDY PLANNER (PREFERENCES & PLANS)
   ========================================================================= */

export const savePlannerPreferencesToFirestore = async (
  prefs: PlannerPreferences,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    const docRef = getUserDocRef('planner', 'preferences', uid);
    if (!docRef) return false;
    await setDoc(
      docRef,
      {
        ...prefs,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving planner preferences to Firestore:', err);
    return false;
  }
};

export const loadPlannerPreferencesFromFirestore = async (
  customUserId?: string
): Promise<PlannerPreferences | null> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return null;
  try {
    const docRef = getUserDocRef('planner', 'preferences', uid);
    if (!docRef) return null;
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        dailyStudyMinutes: data.dailyStudyMinutes || 120,
        sessionLengthMinutes: data.sessionLengthMinutes || 45,
        studyDays: data.studyDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        targetSubject: data.targetSubject || 'ALL',
      };
    }
    return null;
  } catch (err) {
    console.error('Error loading planner preferences from Firestore:', err);
    return null;
  }
};

export const saveStudyPlanToFirestore = async (
  plan: StudyPlan,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    // 1. Save this specific plan under users/{userId}/planner_plans/{planId}
    const planDocRef = getUserDocRef('planner_plans', plan.id, uid);
    if (!planDocRef) return false;
    await setDoc(planDocRef, {
      ...plan,
      userId: uid,
      updatedAt: serverTimestamp(),
    });

    // 2. Also update the current active plan pointer/copy under users/{userId}/planner/current_plan
    const currentPlanRef = getUserDocRef('planner', 'current_plan', uid);
    if (currentPlanRef) {
      await setDoc(currentPlanRef, {
        ...plan,
        userId: uid,
        isCurrent: true,
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  } catch (err) {
    console.error('Error saving study plan to Firestore:', err);
    return false;
  }
};

export const loadCurrentStudyPlanFromFirestore = async (
  customUserId?: string
): Promise<StudyPlan | null> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return null;
  try {
    // Check current_plan doc first
    const currentPlanRef = getUserDocRef('planner', 'current_plan', uid);
    if (currentPlanRef) {
      const snap = await getDoc(currentPlanRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: data.id || data.planId || snap.id,
          planId: data.planId || snap.id,
          userId: data.userId || uid,
          generatedAt: data.generatedAt || new Date().toISOString(),
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          endDate: data.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          preferences: data.preferences || {
            dailyStudyMinutes: 120,
            sessionLengthMinutes: 45,
            studyDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          },
          prioritySubjects: data.prioritySubjects || [],
          days: data.days || [],
          totalPlannedMinutes: data.totalPlannedMinutes || 0,
          totalTasksCount: data.totalTasksCount || 0,
          completedTasksCount: data.completedTasksCount || 0,
          adaptationInsights: data.adaptationInsights || [],
          isCurrent: true,
        };
      }
    }

    // Fallback: Query most recent from planner_plans
    const plansColRef = getUserSubcollectionRef('planner_plans', uid);
    if (plansColRef) {
      const q = query(plansColRef, orderBy('updatedAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        return {
          id: d.id,
          planId: data.planId || d.id,
          userId: data.userId || uid,
          generatedAt: data.generatedAt || new Date().toISOString(),
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          endDate: data.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          preferences: data.preferences,
          prioritySubjects: data.prioritySubjects || [],
          days: data.days || [],
          totalPlannedMinutes: data.totalPlannedMinutes || 0,
          totalTasksCount: data.totalTasksCount || 0,
          completedTasksCount: data.completedTasksCount || 0,
          adaptationInsights: data.adaptationInsights || [],
          isCurrent: true,
        };
      }
    }
    return null;
  } catch (err) {
    console.error('Error loading current study plan from Firestore:', err);
    return null;
  }
};

export const updatePlannerTaskStatusInFirestore = async (
  plan: StudyPlan,
  taskId: string,
  completed: boolean,
  customUserId?: string
): Promise<boolean> => {
  const uid = customUserId || getActiveUserId();
  if (!isFirestoreReady() || !uid) return false;
  try {
    let taskFound = false;
    let completedCount = 0;
    let totalCount = 0;

    const updatedDays = plan.days.map((day) => {
      const updatedTasks = day.tasks.map((task) => {
        if (task.id === taskId) {
          taskFound = true;
          return {
            ...task,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        }
        return task;
      });

      updatedTasks.forEach((t) => {
        if (!t.isBreak) {
          totalCount++;
          if (t.completed) completedCount++;
        }
      });

      return {
        ...day,
        tasks: updatedTasks,
      };
    });

    if (!taskFound) return false;

    const updatedPlan: StudyPlan = {
      ...plan,
      days: updatedDays,
      completedTasksCount: completedCount,
      totalTasksCount: totalCount > 0 ? totalCount : plan.totalTasksCount,
    };

    return await saveStudyPlanToFirestore(updatedPlan, uid);
  } catch (err) {
    console.error('Error updating planner task status in Firestore:', err);
    return false;
  }
};

