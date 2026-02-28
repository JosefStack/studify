import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'light',
            setTheme: (theme) => {
                set({ theme });
                document.documentElement.setAttribute('data-theme', theme);
            },
            toggleTheme: () => {
                const next = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: next });
                document.documentElement.setAttribute('data-theme', next);
            },
        }),
        {
            name: 'studify-theme',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    document.documentElement.setAttribute('data-theme', state.theme);
                }
            },
        }
    )
);
