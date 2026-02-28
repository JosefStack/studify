import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set({ user: null, session: null, profile: null, isLoading: false }),
}));
