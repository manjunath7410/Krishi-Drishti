import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOutUser, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile } from '../../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync or listen to user profile in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // First time Google Sign In - initialize farmer profile in Firestore
            const initialProfile: UserProfile = {
              name: user.displayName || 'Farmer Partner',
              phone: user.phoneNumber || '9876543210',
              district: 'Nagpur',
              state: 'Maharashtra',
              land_size: 3.5,
              farming_type: 'Organic',
              category: 'General',
              crops: ['Cotton', 'Soybean'],
              trust_score: 95
            };
            await setDoc(userDocRef, {
              ...initialProfile,
              uid: user.uid,
              email: user.email || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.warn('[AuthProvider] Firestore sync error or offline:', err);
          // Fallback to minimal profile
          setUserProfile({
            name: user.displayName || 'Farmer',
            phone: '9876543210',
            district: 'Nagpur',
            state: 'Maharashtra',
            land_size: 3.5,
            farming_type: 'Organic',
            category: 'General',
            crops: ['Cotton', 'Soybean'],
            trust_score: 90
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logOutUser();
      setUserProfile(null);
    } catch (error) {
      console.error('Sign Out failed:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const updated = {
        ...userProfile,
        ...data,
        uid: currentUser.uid,
        email: currentUser.email || '',
        updatedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, updated, { merge: true });
      setUserProfile(updated as UserProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signIn, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
