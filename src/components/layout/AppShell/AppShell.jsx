import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { MobileNav } from '../MobileNav/MobileNav';
import styles from './AppShell.module.css';

export const AppShell = () => {
    return (
        <div className={styles.shell}>
            <Sidebar />
            <main className={styles.main}>
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
};
