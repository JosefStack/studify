import React from 'react';
import styles from './Button.module.css';

export const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    disabled,
    className = '',
    ...rest
}) => {
    return (
        <button
            className={[
                styles.button,
                styles[variant],
                styles[size],
                fullWidth ? styles.fullWidth : '',
                isLoading ? styles.loading : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading ? (
                <span className={styles.spinner} aria-hidden="true" />
            ) : (
                <>
                    {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
                </>
            )}
        </button>
    );
};
