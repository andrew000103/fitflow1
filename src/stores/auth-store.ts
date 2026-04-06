import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { useAIPlanStore } from './ai-plan-store';
import { usePersonaStore } from './persona-store';

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ mode: 'anonymous_upgrade' | 'standard_signup' }>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const toAuthUser = (user: { id: string; email?: string | null; is_anonymous?: boolean }): AuthUser => ({
  id: user.id,
  email: user.email ?? null,
  isAnonymous: user.is_anonymous ?? false,
});

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('auth session init timeout')), 10000)
        ),
      ]);
      const { data: { session } } = sessionResult;
      set({
        user: session?.user ? toAuthUser(session.user) : null,
        initialized: true,
      });
    } catch {
      set({ initialized: true });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ? toAuthUser(session.user) : null;
      const currentUserId = get().user?.id;
      // 다른 유저로 로그인 시 AI 플랜 스토어 리셋 (이전 유저 데이터 격리)
      if (newUser?.id && currentUserId && currentUserId !== newUser.id) {
        useAIPlanStore.getState().reset();
        usePersonaStore.getState().reset();
      }
      set({ user: newUser });
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      if (get().user?.isAnonymous) {
        const { error } = await supabase.auth.updateUser({ email, password });
        if (error) throw error;
        return { mode: 'anonymous_upgrade' as const };
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { mode: 'standard_signup' as const };
    } finally {
      set({ loading: false });
    }
  },

  signInAnonymously: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    useAIPlanStore.getState().reset();
    usePersonaStore.getState().reset();
    set({ user: null });
  },
}));
