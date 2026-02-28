import React from 'react';
import styles from './Badge.module.css';

export const Badge = ({
    label,
    variant = 'default',
    color,
    className = '',
}) => {
    const style = color
        ? { '--badge-color': color }
        : undefined;

    return (
        <span
            className={[styles.badge, styles[variant], color ? styles.custom : '', className].filter(Boolean).join(' ')}
            style={style}
        >
            {label}
        </span>
    );
};
