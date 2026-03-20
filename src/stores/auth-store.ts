import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const toAuthUser = (user: { id: string; email?: string | null }): AuthUser => ({
  id: user.id,
  email: user.email ?? null,
});

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({
      user: session?.user ? toAuthUser(session.user) : null,
      initialized: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ? toAuthUser(session.user) : null });
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
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
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
    set({ user: null });
  },
}));
