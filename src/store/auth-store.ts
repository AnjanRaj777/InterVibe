import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export type User = {
  id: string;
  name: string;
  email: string;
  targetRole?: string;
  seniority?: string;
  hasProSubscription: boolean;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, targetRole?: string, seniority?: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  upgradeSubscription: () => void;
  downgradeSubscription: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      initializeAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({
              user: {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Candidate',
                email: session.user.email || '',
                targetRole: session.user.user_metadata?.target_role || 'Senior Full Stack Developer',
                seniority: session.user.user_metadata?.seniority || 'Senior / Staff (5-8+ yrs)',
                hasProSubscription: true,
              },
              isAuthenticated: true,
            });
          }
        } catch (err) {
          console.warn('[Auth Store] Session init notice:', err);
        }
      },

      login: async (email: string, password: string) => {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
          throw new Error('Email and password are required');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          set({
            user: {
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || cleanEmail.split('@')[0],
              email: data.user.email || cleanEmail,
              targetRole: data.user.user_metadata?.target_role || 'Senior Full Stack Developer',
              seniority: data.user.user_metadata?.seniority || 'Senior / Staff (5-8+ yrs)',
              hasProSubscription: true,
            },
            isAuthenticated: true,
          });
        }
      },

      signup: async (name: string, email: string, password: string, targetRole?: string, seniority?: string) => {
        const cleanEmail = email.trim();
        const cleanName = name.trim();

        if (!cleanEmail || !password) {
          throw new Error('Email and password are required');
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName || cleanEmail.split('@')[0],
              target_role: targetRole || 'Senior Full Stack Developer',
              seniority: seniority || 'Senior / Staff (5-8+ yrs)',
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          set({
            user: {
              id: data.user.id,
              name: cleanName || cleanEmail.split('@')[0],
              email: cleanEmail,
              targetRole: targetRole || 'Senior Full Stack Developer',
              seniority: seniority || 'Senior / Staff (5-8+ yrs)',
              hasProSubscription: true,
            },
            isAuthenticated: Boolean(data.session),
          });
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('[Auth] Sign out error:', err);
        }
        set({ user: null, isAuthenticated: false });
      },

      upgradeSubscription: () =>
        set((state) => ({
          user: state.user ? { ...state.user, hasProSubscription: true } : null,
        })),

      downgradeSubscription: () =>
        set((state) => ({
          user: state.user ? { ...state.user, hasProSubscription: false } : null,
        })),
    }),
    {
      name: 'intervibe-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
