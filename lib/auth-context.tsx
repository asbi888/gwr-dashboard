'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Build a fallback profile from Supabase auth user metadata
  const buildFallbackProfile = useCallback((authUser: User): UserProfile => {
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      full_name: (meta.full_name as string) || authUser.email || 'User',
      role: (['admin', 'manager', 'staff'].includes(meta.role as string)
        ? meta.role
        : 'admin') as UserRole,
      is_active: true,
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, []);

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        const p = data as UserProfile;
        setProfile(p);
        return p;
      }

      // Profile fetch failed (table missing, RLS blocking, no row yet)
      // Use fallback from auth metadata so the app doesn't hang
      console.warn('Profile fetch failed, using fallback:', error?.message);
      const fallback = buildFallbackProfile(authUser);
      setProfile(fallback);
      return fallback;
    } catch (err) {
      console.error('Profile fetch error:', err);
      const fallback = buildFallbackProfile(authUser);
      setProfile(fallback);
      return fallback;
    }
  }, [buildFallbackProfile]);

  // Initialize: check existing session
  useEffect(() => {
    async function init() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user);
      }
      setLoading(false);
    }
    init();
  }, [fetchProfile]);

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
