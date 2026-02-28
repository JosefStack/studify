import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Calendar, Flame, Plus, Clock } from 'lucide-react';
import { Card } from '../../components/Card/Card';
import { Badge } from '../../components/Badge/Badge';
import { Button } from '../../components/Button/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import styles from './DashboardPage.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(anchor) {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user, profile } = useAuthStore();
    const queryClient = useQueryClient();
    const today = new Date();
    const weekDays = useMemo(() => getWeekDays(today), []);

    const firstName = profile?.full_name?.split(' ')[0] ?? 'Student';
    const hour = today.getHours();
    const greeting =
        hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Fetch today's tasks
    const todayStr = format(today, 'yyyy-MM-dd');
    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks', user?.id, 'today'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('due_date', todayStr)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user?.id,
    });

    // Fetch upcoming (next 7 days, not today)
    const { data: upcomingTasks = [] } = useQuery({
        queryKey: ['tasks', user?.id, 'upcoming'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'done')
                .gt('due_date', todayStr)
                .order('due_date', { ascending: true })
                .limit(5);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user?.id,
    });

    // Fetch recent notes
    const { data: notes = [] } = useQuery({
        queryKey: ['notes', user?.id, 'recent'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(4);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user?.id,
    });

    const doneToday = tasks.filter((t) => t.status === 'done').length;
    const overdueCount = upcomingTasks.filter(
        (t) => t.due_date && t.due_date < todayStr
    ).length;

    // Toggle task done
    const toggleTask = async (task) => {
        const next = task.status === 'done' ? 'todo' : 'done';
        await supabase.from('tasks').update({ status: next }).eq('id', task.id);
        queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.greeting}>
                        {greeting}, {firstName} 👋
                    </h1>
                    <p className={styles.date}>{format(today, 'EEEE, MMMM d, yyyy')}</p>
                </div>
            </div>

            {/* Weekly Calendar Strip */}
            <div className={styles.weekStrip}>
                {weekDays.map((day) => {
                    const active = isToday(day);
                    return (
                        <div
                            key={day.toISOString()}
                            className={[styles.weekDay, active ? styles.weekDayActive : ''].filter(Boolean).join(' ')}
                        >
                            <span className={styles.weekDayLabel}>{format(day, 'EEE')}</span>
                            <span className={styles.weekDayNum}>{format(day, 'd')}</span>
                        </div>
                    );
                })}
            </div>

            {/* Stat Cards */}
            <div className={styles.statsRow}>
                <Card padding="md" className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                        <CheckSquare size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                        <p className={styles.statValue}>{doneToday}/{tasks.length}</p>
                        <p className={styles.statLabel}>Today's Tasks</p>
                    </div>
                </Card>
                <Card padding="md" className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                        <Calendar size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                        <p className={styles.statValue}>{upcomingTasks.length}</p>
                        <p className={styles.statLabel}>Upcoming Deadlines</p>
                    </div>
                </Card>
                <Card padding="md" className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                        <Flame size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                        <p className={styles.statValue}>{overdueCount > 0 ? `${overdueCount} overdue` : 'On track'}</p>
                        <p className={styles.statLabel}>Study Status</p>
                    </div>
                </Card>
            </div>

            {/* Main 2-column area */}
            <div className={styles.columns}>
                {/* Today's Tasks */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Today's Tasks</h2>
                        <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={() => window.location.assign('/tasks')}>
                            Add
                        </Button>
                    </div>
                    <Card padding="none">
                        {tasks.length === 0 ? (
                            <div className={styles.empty}>
                                <CheckSquare size={24} color="var(--color-text-muted)" />
                                <p>No tasks due today</p>
                                <Button variant="secondary" size="sm" onClick={() => window.location.assign('/tasks')}>
                                    Add a task
                                </Button>
                            </div>
                        ) : (
                            <ul className={styles.taskList}>
                                {tasks.map((task) => (
                                    <li key={task.id} className={styles.taskItem}>
                                        <button
                                            className={[styles.checkbox, task.status === 'done' ? styles.checked : ''].filter(Boolean).join(' ')}
                                            onClick={() => toggleTask(task)}
                                            aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                                        >
                                            {task.status === 'done' && (
                                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                        <span className={[styles.taskTitle, task.status === 'done' ? styles.done : ''].join(' ')}>
                                            {task.title}
                                        </span>
                                        {task.subject && (
                                            <span className={styles.taskSubject}>{task.subject}</span>
                                        )}
                                        <Badge label={task.priority} variant={task.priority} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </section>

                {/* Quick Notes */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Quick Notes</h2>
                        <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={() => window.location.assign('/notes')}>
                            New
                        </Button>
                    </div>
                    {notes.length === 0 ? (
                        <Card padding="md">
                            <div className={styles.empty}>
                                <p>No notes yet</p>
                                <Button variant="secondary" size="sm" onClick={() => window.location.assign('/notes')}>
                                    Create note
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className={styles.notesGrid}>
                            {notes.map((note) => (
                                <Card key={note.id} padding="md" hoverable onClick={() => window.location.assign('/notes')}>
                                    <h3 className={styles.noteTitle}>{note.title}</h3>
                                    {note.content && (
                                        <p className={styles.noteSnippet}>
                                            {note.content.slice(0, 80)}{note.content.length > 80 ? '…' : ''}
                                        </p>
                                    )}
                                    <p className={styles.noteDate}>{format(new Date(note.updated_at), 'MMM d')}</p>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Pomodoro quick-start card */}
            <div className={styles.pomodoroWidget}>
                <Card padding="md" className={styles.pomodoroCard}>
                    <div className={styles.pomodoroInner}>
                        <div className={styles.timerRing}>
                            <Clock size={20} color="var(--color-accent)" />
                        </div>
                        <div>
                            <p className={styles.pomodoroTitle}>Focus Timer</p>
                            <p className={styles.pomodoroSub}>Start a Pomodoro session</p>
                        </div>
                        <Button size="sm" onClick={() => window.location.assign('/focus')}>Start</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
