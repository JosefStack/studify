import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckSquare,
    BookOpen,
    Calendar,
    Timer,
    Settings,
    LogOut,
    Sun,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    X,
} from 'lucide-react';
import { Avatar } from '../../Avatar/Avatar';
import styles from './Sidebar.module.css';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useSidebarStore } from '../../../stores/sidebarStore';
import { supabase } from '../../../lib/supabase';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
    { to: '/notes', label: 'Notes', Icon: BookOpen },
    { to: '/schedule', label: 'Schedule', Icon: Calendar },
    { to: '/focus', label: 'Focus Timer', Icon: Timer },
];

export const Sidebar = () => {
    const { profile } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const { isOpen, toggle, setMobileOpen } = useSidebarStore();
    const navigate = useNavigate();

    const handleToggleClick = () => {
        if (window.innerWidth <= 768) {
            setMobileOpen(false);
        } else {
            toggle();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const sidebarClass = [
        styles.sidebar,
        !isOpen ? styles.collapsed : '',
    ].filter(Boolean).join(' ');

    return (
        <aside className={sidebarClass}>
            {/* Logo + Toggle */}
            <div className={styles.logoRow}>
                <div className={styles.logo}>
                    <span className={styles.logoMark}>S</span>
                    <span className={styles.logoText}>Studify</span>
                </div>
                <button
                    className={styles.toggleBtn}
                    onClick={handleToggleClick}
                    title="Toggle sidebar"
                >
                    <span className={styles.desktopToggleIcon}>
                        {isOpen
                            ? <PanelLeftClose size={16} strokeWidth={1.8} />
                            : <PanelLeftOpen size={16} strokeWidth={1.8} />}
                    </span>
                    <span className={styles.mobileToggleIcon}>
                        <X size={16} strokeWidth={1.8} />
                    </span>
                </button>
            </div>

            {/* Nav */}
            <nav className={styles.nav}>
                {NAV_ITEMS.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            [styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')
                        }
                        title={!isOpen ? label : undefined}
                    >
                        <Icon size={16} strokeWidth={1.8} />
                        <span className={styles.navText}>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom actions */}
            <div className={styles.bottom}>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        [styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')
                    }
                    title={!isOpen ? 'Settings' : undefined}
                >
                    <Settings size={16} strokeWidth={1.8} />
                    <span className={styles.navText}>Settings</span>
                </NavLink>

                <button
                    className={styles.themeBtn}
                    onClick={toggleTheme}
                    title={isOpen ? 'Toggle theme' : (theme === 'light' ? 'Dark mode' : 'Light mode')}
                >
                    {theme === 'light' ? <Moon size={16} strokeWidth={1.8} /> : <Sun size={16} strokeWidth={1.8} />}
                    <span className={styles.navText}>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
                </button>

                <div className={styles.userRow}>
                    <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
                    <div className={styles.userInfo}>
                        <p className={styles.userName}>{profile?.full_name ?? 'Student'}</p>
                        <p className={styles.userEmail}>{profile?.school_email ?? ''}</p>
                    </div>
                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        title="Sign out"
                    >
                        <LogOut size={14} strokeWidth={1.8} />
                    </button>
                </div>
            </div>
        </aside>
    );
};
