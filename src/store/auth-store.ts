import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

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
  login: (email: string, name?: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, targetRole?: string, seniority?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeSubscription: () => void;
  downgradeSubscription: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: 'user_demo_101',
        name: 'Alex Rivera',
        email: 'alex@intervibe.ai',
        targetRole: 'Senior Full Stack Developer',
        seniority: 'Senior / Staff (5-8+ yrs)',
        hasProSubscription: true,
      },
      isAuthenticated: true,
      login: async (email: string, name?: string, password?: string) => {
        // Attempt Supabase Auth if anon key is configured
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && password) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) {
              console.warn('[Supabase Auth] Fallback to local session:', error.message);
            } else if (data.user) {
              set({
                user: {
                  id: data.user.id,
                  name: data.user.user_metadata?.full_name || name || email.split('@')[0],
                  email: data.user.email || email,
                  targetRole: data.user.user_metadata?.target_role || 'Senior Full Stack Developer',
                  seniority: data.user.user_metadata?.seniority || 'Senior / Staff (5-8+ yrs)',
                  hasProSubscription: true,
                },
                isAuthenticated: true,
              });
              return;
            }
          } catch (err) {
            console.warn('[Supabase Auth] Exception during login:', err);
          }
        }

        // Fast fallback/demo mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({
          user: {
            id: `user_${Date.now()}`,
            name: name || email.split('@')[0],
            email,
            targetRole: 'Senior Full Stack Developer',
            seniority: 'Senior / Staff (5-8+ yrs)',
            hasProSubscription: true,
          },
          isAuthenticated: true,
        });
      },
      signup: async (name: string, email: string, targetRole?: string, seniority?: string, password?: string) => {
        // Attempt Supabase Auth Registration
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && password) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: name,
                  target_role: targetRole || 'Senior Full Stack Developer',
                  seniority: seniority || 'Senior / Staff (5-8+ yrs)',
                },
              },
            });
            if (error) {
              console.warn('[Supabase Auth] Registration error, using local session:', error.message);
            } else if (data.user) {
              set({
                user: {
                  id: data.user.id,
                  name: name.trim(),
                  email: email.trim(),
                  targetRole: targetRole || 'Senior Full Stack Developer',
                  seniority: seniority || 'Senior / Staff (5-8+ yrs)',
                  hasProSubscription: true,
                },
                isAuthenticated: true,
              });
              return;
            }
          } catch (err) {
            console.warn('[Supabase Auth] Registration exception:', err);
          }
        }

        // Fast fallback/demo mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({
          user: {
            id: `user_${Date.now()}`,
            name: name.trim() || email.split('@')[0],
            email: email.trim(),
            targetRole: targetRole || 'Senior Full Stack Developer',
            seniority: seniority || 'Senior / Staff (5-8+ yrs)',
            hasProSubscription: true,
          },
          isAuthenticated: true,
        });
      },
      logout: async () => {
        try {
          if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            await supabase.auth.signOut();
          }
        } catch {
          // ignore signout errors
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
