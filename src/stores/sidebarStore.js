import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create(
    persist(
        (set, get) => ({
            isOpen: true,
            toggle: () => set({ isOpen: !get().isOpen }),
            open: () => set({ isOpen: true }),
            close: () => set({ isOpen: false }),

            mobileOpen: false,
            setMobileOpen: (open) => set({ mobileOpen: open })
        }),
        {
            name: 'studify-sidebar',
            partialize: (state) => ({ isOpen: state.isOpen })
        }
    )
);
