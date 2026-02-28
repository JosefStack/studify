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
} from 'lucide-react';
import { Avatar } from '../../Avatar/Avatar';
import styles from './Sidebar.module.css';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
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
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <aside className={styles.sidebar}>
            {/* Logo */}
            <div className={styles.logo}>
                <span className={styles.logoMark}>S</span>
                <span className={styles.logoText}>Studify</span>
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
                    >
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{label}</span>
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
                >
                    <Settings size={16} strokeWidth={1.8} />
                    <span>Settings</span>
                </NavLink>

                <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
                    {theme === 'light' ? <Moon size={16} strokeWidth={1.8} /> : <Sun size={16} strokeWidth={1.8} />}
                    <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
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
