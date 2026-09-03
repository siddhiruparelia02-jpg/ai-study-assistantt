import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle as firebaseGoogleSignIn,
  signOutUser as firebaseSignOutUser,
  getUserProfile,
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const profile = await getUserProfile(currentUser.uid);
            if (profile) {
              setUserProfile(profile);
            } else {
              setUserProfile({
                uid: currentUser.uid,
                displayName: currentUser.displayName || 'Student',
                email: currentUser.email || '',
                photoURL: currentUser.photoURL,
                college: 'K. P. B. Hinduja College of Commerce (YCMOU)',
                semester: 'SYBCA • Semester 4',
              });
            }
          } catch (e) {
            console.warn('Could not fetch user profile document:', e);
            setUserProfile({
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Student',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL,
              college: 'K. P. B. Hinduja College of Commerce (YCMOU)',
              semester: 'SYBCA • Semester 4',
            });
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (authErr) => {
        console.error('Auth state listener error:', authErr);
        setError('Authentication service unavailable. Please check your network.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const signedInUser = await firebaseGoogleSignIn();
      setUser(signedInUser);
      const profile = await getUserProfile(signedInUser.uid);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await firebaseSignOutUser();
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isSigningIn,
        error,
        signInWithGoogle,
        signOutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
