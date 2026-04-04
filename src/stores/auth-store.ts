'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/supabase/helpers';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  type: 'candidate' | 'employer';
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await getUserProfile(user.id);
        set({
          user,
          profile: profile as UserProfile | null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAuthenticated: false });
  },
}));
