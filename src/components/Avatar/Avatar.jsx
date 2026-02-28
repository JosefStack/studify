import React from 'react';
import styles from './Avatar.module.css';

function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function stringToColor(str) {
    const colors = ['#2EAADC', '#0f9f6e', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export const Avatar = ({ src, name, size = 'md', className = '' }) => {
    const initials = getInitials(name);
    const bg = name ? stringToColor(name) : '#9b9b97';

    return (
        <div className={[styles.avatar, styles[size], className].join(' ')}>
            {src ? (
                <img src={src} alt={name ?? 'User'} className={styles.img} />
            ) : (
                <span className={styles.initials} style={{ background: bg }}>
                    {initials}
                </span>
            )}
        </div>
    );
};
