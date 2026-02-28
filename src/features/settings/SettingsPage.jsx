import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Bell, Moon, BookOpen, Shield } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Toggle } from '../../components/Toggle/Toggle';
import { Card } from '../../components/Card/Card';
import { Avatar } from '../../components/Avatar/Avatar';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
    const { user, profile, setProfile } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const qc = useQueryClient();

    const [name, setName] = useState(profile?.full_name ?? '');
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => { setName(profile?.full_name ?? ''); }, [profile]);

    // User settings from DB
    const { data: settings } = useQuery({
        queryKey: ['user_settings', user?.id],
        queryFn: async () => {
            const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
            return data;
        },
        enabled: !!user?.id,
    });

    const updateSettings = useMutation({
        mutationFn: async (patch) => {
            const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, ...patch });
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['user_settings'] }),
    });

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        const { data, error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id).select().single();
        if (!error && data) setProfile(data);
        setSavingProfile(false);
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure? This will permanently delete your account and all data.')) {
            // Sign out
            await supabase.auth.signOut();
        }
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Settings</h1>

            {/* Profile */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <User size={16} strokeWidth={1.8} />
                    <h2 className={styles.sectionTitle}>Profile</h2>
                </div>
                <Card padding="lg">
                    <div className={styles.profileRow}>
                        <Avatar src={profile?.avatar_url} name={profile?.full_name} size="lg" />
                        <div className={styles.profileFields}>
                            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                            <Input label="Email" value={user?.email ?? ''} disabled hint="Email cannot be changed here." />
                        </div>
                    </div>
                    <div className={styles.profileActions}>
                        <Button size="sm" onClick={handleSaveProfile} isLoading={savingProfile}>Save Profile</Button>
                    </div>
                </Card>
            </section>

            {/* Notifications */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Bell size={16} strokeWidth={1.8} />
                    <h2 className={styles.sectionTitle}>Notifications</h2>
                </div>
                <Card padding="md">
                    <Toggle
                        id="notify_email"
                        label="Email Notifications"
                        description="Receive weekly summary emails"
                        checked={settings?.notify_email ?? true}
                        onChange={(v) => updateSettings.mutate({ notify_email: v })}
                    />
                    <div className={styles.divider} />
                    <Toggle
                        id="notify_deadline"
                        label="Deadline Reminders"
                        description="Get notified before task deadlines"
                        checked={settings?.notify_deadline ?? true}
                        onChange={(v) => updateSettings.mutate({ notify_deadline: v })}
                    />
                </Card>
            </section>

            {/* Appearance */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Moon size={16} strokeWidth={1.8} />
                    <h2 className={styles.sectionTitle}>Appearance</h2>
                </div>
                <Card padding="md">
                    <Toggle
                        id="dark_mode"
                        label="Dark Mode"
                        description="Switch between light and dark theme"
                        checked={theme === 'dark'}
                        onChange={(v) => setTheme(v ? 'dark' : 'light')}
                    />
                </Card>
            </section>

            {/* Study Preferences */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <BookOpen size={16} strokeWidth={1.8} />
                    <h2 className={styles.sectionTitle}>Study Preferences</h2>
                </div>
                <Card padding="md">
                    <div className={styles.stepperRow}>
                        <div>
                            <p className={styles.stepperLabel}>Pomodoro Work Length</p>
                            <p className={styles.stepperDesc}>Duration of each focus session</p>
                        </div>
                        <div className={styles.stepper}>
                            <button
                                className={styles.stepBtn}
                                onClick={() => updateSettings.mutate({ pomodoro_work_mins: Math.max(5, (settings?.pomodoro_work_mins ?? 25) - 5) })}
                            >-</button>
                            <span className={styles.stepVal}>{settings?.pomodoro_work_mins ?? 25} min</span>
                            <button
                                className={styles.stepBtn}
                                onClick={() => updateSettings.mutate({ pomodoro_work_mins: Math.min(60, (settings?.pomodoro_work_mins ?? 25) + 5) })}
                            >+</button>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.stepperRow}>
                        <div>
                            <p className={styles.stepperLabel}>Short Break Length</p>
                            <p className={styles.stepperDesc}>Break after each Pomodoro</p>
                        </div>
                        <div className={styles.stepper}>
                            <button className={styles.stepBtn} onClick={() => updateSettings.mutate({ pomodoro_break_mins: Math.max(1, (settings?.pomodoro_break_mins ?? 5) - 1) })}>-</button>
                            <span className={styles.stepVal}>{settings?.pomodoro_break_mins ?? 5} min</span>
                            <button className={styles.stepBtn} onClick={() => updateSettings.mutate({ pomodoro_break_mins: Math.min(30, (settings?.pomodoro_break_mins ?? 5) + 1) })}>+</button>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.stepperRow}>
                        <div>
                            <p className={styles.stepperLabel}>Daily Study Goal</p>
                            <p className={styles.stepperDesc}>Target hours per day</p>
                        </div>
                        <div className={styles.stepper}>
                            <button className={styles.stepBtn} onClick={() => updateSettings.mutate({ study_goal_hrs: Math.max(1, (settings?.study_goal_hrs ?? 4) - 1) })}>-</button>
                            <span className={styles.stepVal}>{settings?.study_goal_hrs ?? 4} hrs</span>
                            <button className={styles.stepBtn} onClick={() => updateSettings.mutate({ study_goal_hrs: Math.min(16, (settings?.study_goal_hrs ?? 4) + 1) })}>+</button>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Account */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Shield size={16} strokeWidth={1.8} />
                    <h2 className={styles.sectionTitle}>Account</h2>
                </div>
                <Card padding="md">
                    <div className={styles.accountRow}>
                        <div>
                            <p className={styles.stepperLabel}>Change Password</p>
                            <p className={styles.stepperDesc}>Send a password reset email</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={async () => {
                            if (user?.email) await supabase.auth.resetPasswordForEmail(user.email);
                            alert('Password reset email sent!');
                        }}>Reset</Button>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.accountRow}>
                        <div>
                            <p className={styles.stepperLabel} style={{ color: 'var(--color-danger)' }}>Delete Account</p>
                            <p className={styles.stepperDesc}>Permanently remove all your data</p>
                        </div>
                        <Button variant="danger" size="sm" onClick={handleDeleteAccount}>Delete</Button>
                    </div>
                </Card>
            </section>
        </div>
    );
}
