// ==============================================================================
// FIREBASE AUTH CONTEXT & PROVIDER
// Provides real-time Firebase Authentication state + Supabase Profile linkage
// ==============================================================================

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  onAuthStateChanged,
  FirebaseUser,
  firebaseSignOut,
} from '@/lib/firebase';
import { supabase, SupabaseProfile, syncFirebaseProfile } from '@/lib/supabase';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  supabaseProfile: SupabaseProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  supabaseProfile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch or sync corresponding profile from Supabase
        const profile = await syncFirebaseProfile(user.uid, {
          full_name: user.displayName || 'Qubink User',
          email: user.email || '',
          phone: user.phoneNumber || undefined,
          avatar_url: user.photoURL || undefined,
          role: 'customer',
        });
        setSupabaseProfile(profile);
      } else {
        setSupabaseProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setFirebaseUser(null);
    setSupabaseProfile(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, supabaseProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
