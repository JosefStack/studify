import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BookOpen, Timer, Settings } from 'lucide-react';
import styles from './MobileNav.module.css';

const NAV_ITEMS = [
    { to: '/', label: 'Home', Icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
    { to: '/notes', label: 'Notes', Icon: BookOpen },
    { to: '/focus', label: 'Timer', Icon: Timer },
    { to: '/settings', label: 'More', Icon: Settings },
];

export const MobileNav = () => {
    return (
        <nav className={styles.mobileNav}>
            {NAV_ITEMS.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                        [styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')
                    }
                >
                    <Icon size={20} strokeWidth={2} />
                    <span className={styles.label}>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
