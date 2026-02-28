import React from 'react';
import styles from './Card.module.css';

export const Card = ({
    children,
    className = '',
    padding = 'md',
    hoverable = false,
    onClick,
}) => {
    return (
        <div
            className={[
                styles.card,
                styles[`pad-${padding}`],
                hoverable ? styles.hoverable : '',
                onClick ? styles.clickable : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
};
