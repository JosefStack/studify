import React from 'react';
import styles from './Input.module.css';

export const Input = ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    id,
    className = '',
    ...rest
}) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={[styles.wrapper, className].join(' ')}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            )}
            <div className={[styles.inputWrap, error ? styles.hasError : ''].join(' ')}>
                {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                <input
                    id={inputId}
                    className={[styles.input, leftIcon ? styles.withLeftIcon : '', rightIcon ? styles.withRightIcon : ''].join(' ')}
                    {...rest}
                />
                {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {hint && !error && <p className={styles.hint}>{hint}</p>}
        </div>
    );
};
