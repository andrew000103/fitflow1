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

const authDebug = (message: string, payload?: Record<string, unknown>) => {
  console.log(`[auth-debug] ${message}`, payload ?? {});
};

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
      authDebug('initialize:getSession:resolved', {
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        isAnonymous: session?.user?.is_anonymous ?? null,
      });
      set({
        user: session?.user ? toAuthUser(session.user) : null,
        initialized: true,
      });
    } catch (error) {
      authDebug('initialize:getSession:failed', {
        message: error instanceof Error ? error.message : String(error),
      });
      set({ initialized: true });
    }

    supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ? toAuthUser(session.user) : null;
      const currentUserId = get().user?.id;
      authDebug('onAuthStateChange', {
        event,
        currentUserId,
        newUserId: newUser?.id ?? null,
        email: newUser?.email ?? null,
        isAnonymous: newUser?.isAnonymous ?? null,
        hasSession: Boolean(session),
      });
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
      authDebug('signIn:start', {
        email,
      });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      authDebug('signIn:result', {
        email,
        errorMessage: error?.message ?? null,
        errorStatus: error?.status ?? null,
        userId: data.user?.id ?? null,
        sessionUserId: data.session?.user?.id ?? null,
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      const isAnonymousUpgrade = Boolean(get().user?.isAnonymous);
      authDebug('signUp:start', {
        email,
        mode: isAnonymousUpgrade ? 'anonymous_upgrade' : 'standard_signup',
        currentUserId: get().user?.id ?? null,
      });

      if (isAnonymousUpgrade) {
        const { data, error } = await supabase.auth.updateUser({ email, password });
        authDebug('signUp:anonymous_upgrade:result', {
          email,
          errorMessage: error?.message ?? null,
          errorStatus: error?.status ?? null,
          userId: data.user?.id ?? null,
          userEmail: data.user?.email ?? null,
          identities: data.user?.identities?.length ?? null,
        });
        if (error) throw error;
        return { mode: 'anonymous_upgrade' as const };
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      authDebug('signUp:standard_signup:result', {
        email,
        errorMessage: error?.message ?? null,
        errorStatus: error?.status ?? null,
        userId: data.user?.id ?? null,
        userEmail: data.user?.email ?? null,
        hasSession: Boolean(data.session),
        emailConfirmedAt: data.user?.email_confirmed_at ?? null,
      });
      if (error) throw error;
      return { mode: 'standard_signup' as const };
    } finally {
      set({ loading: false });
    }
  },

  signInAnonymously: async () => {
    set({ loading: true });
    try {
      authDebug('signInAnonymously:start');
      const { data, error } = await supabase.auth.signInAnonymously();
      authDebug('signInAnonymously:result', {
        errorMessage: error?.message ?? null,
        errorStatus: error?.status ?? null,
        userId: data.user?.id ?? null,
        isAnonymous: data.user?.is_anonymous ?? null,
        hasSession: Boolean(data.session),
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    authDebug('signOut:start', {
      currentUserId: get().user?.id ?? null,
      email: get().user?.email ?? null,
    });
    await supabase.auth.signOut();
    useAIPlanStore.getState().reset();
    usePersonaStore.getState().reset();
    set({ user: null });
    authDebug('signOut:complete');
  },
}));
