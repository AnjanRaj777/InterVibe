import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type User = {
  id: string;
  name: string;
  email: string;
  hasProSubscription: boolean;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
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
        hasProSubscription: true,
      },
      isAuthenticated: true,
      login: async (email: string) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        set({
          user: {
            id: `user_${Date.now()}`,
            name: email.split('@')[0],
            email,
            hasProSubscription: true,
          },
          isAuthenticated: true,
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
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
