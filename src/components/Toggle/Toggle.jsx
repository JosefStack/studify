import React from 'react';
import styles from './Toggle.module.css';

export const Toggle = ({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
}) => {
    return (
        <div className={styles.row}>
            {(label || description) && (
                <div className={styles.text}>
                    {label && <label htmlFor={id} className={styles.label}>{label}</label>}
                    {description && <p className={styles.description}>{description}</p>}
                </div>
            )}
            <button
                id={id}
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={[styles.toggle, checked ? styles.on : styles.off].join(' ')}
            >
                <span className={styles.thumb} />
            </button>
        </div>
    );
};
