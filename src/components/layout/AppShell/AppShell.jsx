import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '../Sidebar/Sidebar';
import { MobileNav } from '../MobileNav/MobileNav';
import { useSidebarStore } from '../../../stores/sidebarStore';
import styles from './AppShell.module.css';

export const AppShell = () => {
    const { isOpen, close, mobileOpen, setMobileOpen } = useSidebarStore();
    const location = useLocation();

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, setMobileOpen]);

    // Close mobile sidebar when clicking outside
    const handleOverlayClick = () => {
        setMobileOpen(false);
    };

    const shellClass = [
        styles.shell,
        isOpen ? '' : styles.sidebarCollapsed,
    ].filter(Boolean).join(' ');

    return (
        <div className={shellClass}>
            {/* Mobile hamburger */}
            <button
                className={styles.mobileToggle}
                onClick={() => setMobileOpen(true)}
                title="Open menu"
            >
                <Menu size={20} strokeWidth={2} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={handleOverlayClick} />
            )}

            {/* Sidebar — add mobileOpen class on mobile */}
            <div className={mobileOpen ? styles.sidebarMobileOpen : ''}>
                <Sidebar />
            </div>

            <main className={styles.main}>
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
};
