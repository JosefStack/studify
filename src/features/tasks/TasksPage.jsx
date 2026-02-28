import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Pencil, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Badge } from '../../components/Badge/Badge';
import { Card } from '../../components/Card/Card';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import styles from './TasksPage.module.css';

const SUBJECTS = ['Math', 'Physics', 'History', 'Biology', 'English', 'Chemistry'];

const EMPTY_FORM = {
    title: '',
    subject: '',
    priority: 'medium',
    due_date: '',
    description: '',
};

export default function TasksPage() {
    const { user } = useAuthStore();
    const qc = useQueryClient();

    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const today = format(new Date(), 'yyyy-MM-dd');

    /* ── Queries ── */
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user?.id,
    });

    /* ── Mutations ── */
    const createTask = useMutation({
        mutationFn: async (payload) => {
            const { error } = await supabase.from('tasks').insert({
                user_id: user.id,
                title: payload.title,
                subject: payload.subject || null,
                priority: payload.priority,
                due_date: payload.due_date || null,
                description: payload.description || null,
                status: 'todo',
            });
            if (error) throw error;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); closeModal(); },
    });

    const updateTask = useMutation({
        mutationFn: async ({ id, ...patch }) => {
            const { error } = await supabase.from('tasks').update(patch).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); closeModal(); },
    });

    const deleteTask = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    });

    /* ── Filter Logic ── */
    const filteredTasks = tasks.filter((t) => {
        const matchesFilter =
            filter === 'all'
                ? true
                : filter === 'today'
                    ? t.due_date === today
                    : filter === 'upcoming'
                        ? t.due_date != null && t.due_date > today
                        : t.subject === filter;
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    /* ── Counts for sidebar ── */
    const todayCount = tasks.filter((t) => t.due_date === today).length;
    const upcomingCount = tasks.filter((t) => t.due_date != null && t.due_date > today).length;

    /* ── Modal helpers ── */
    const openCreate = () => { setForm(EMPTY_FORM); setEditTask(null); setShowModal(true); };
    const openEdit = (t) => {
        setForm({ title: t.title, subject: t.subject ?? '', priority: t.priority, due_date: t.due_date ?? '', description: t.description ?? '' });
        setEditTask(t);
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditTask(null); setForm(EMPTY_FORM); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        if (editTask) {
            updateTask.mutate({ id: editTask.id, ...form });
        } else {
            createTask.mutate(form);
        }
    };

    const toggleStatus = (t) => {
        const next = t.status === 'done' ? 'todo' : 'done';
        updateTask.mutate({ id: t.id, status: next });
    };

    return (
        <div className={styles.layout}>
            {/* Secondary sidebar — categories */}
            <aside className={styles.categorySidebar}>
                <p className={styles.catHeader}>Views</p>
                {[
                    { key: 'all', label: 'All Tasks', count: tasks.length },
                    { key: 'today', label: 'Today', count: todayCount },
                    { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        className={[styles.catItem, filter === key ? styles.catActive : ''].filter(Boolean).join(' ')}
                        onClick={() => setFilter(key)}
                    >
                        <span>{label}</span>
                        <span className={styles.catCount}>{count}</span>
                    </button>
                ))}

                <p className={styles.catHeader} style={{ marginTop: 'var(--space-5)' }}>By Subject</p>
                {SUBJECTS.map((sub) => {
                    const cnt = tasks.filter((t) => t.subject === sub).length;
                    return (
                        <button
                            key={sub}
                            className={[styles.catItem, filter === sub ? styles.catActive : ''].filter(Boolean).join(' ')}
                            onClick={() => setFilter(sub)}
                        >
                            <span>{sub}</span>
                            {cnt > 0 && <span className={styles.catCount}>{cnt}</span>}
                        </button>
                    );
                })}
            </aside>

            {/* Main content */}
            <div className={styles.main}>
                {/* Top bar */}
                <div className={styles.topBar}>
                    <h1 className={styles.pageTitle}>
                        {filter === 'all' ? 'All Tasks' : filter === 'today' ? 'Today' : filter === 'upcoming' ? 'Upcoming' : filter}
                    </h1>
                    <div className={styles.topActions}>
                        <Input
                            placeholder="Search tasks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search size={14} />}
                            className={styles.searchInput}
                        />
                        <Button leftIcon={<Plus size={15} />} onClick={openCreate}>New Task</Button>
                    </div>
                </div>

                {/* Task list */}
                {isLoading ? (
                    <div className={styles.loadingMsg}>Loading…</div>
                ) : filteredTasks.length === 0 ? (
                    <Card padding="lg">
                        <div className={styles.emptyState}>
                            <p>No tasks found</p>
                            <Button variant="secondary" size="sm" onClick={openCreate}>Add your first task</Button>
                        </div>
                    </Card>
                ) : (
                    <Card padding="none">
                        <ul className={styles.taskList}>
                            {filteredTasks.map((task) => (
                                <li key={task.id} className={styles.taskRow}>
                                    <button
                                        className={[styles.checkbox, task.status === 'done' ? styles.checked : ''].filter(Boolean).join(' ')}
                                        onClick={() => toggleStatus(task)}
                                        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                                    >
                                        {task.status === 'done' && <Check size={10} strokeWidth={3} color="#fff" />}
                                    </button>

                                    <div className={styles.taskInfo}>
                                        <span className={[styles.taskTitle, task.status === 'done' ? styles.done : ''].filter(Boolean).join(' ')}>
                                            {task.title}
                                        </span>
                                        {task.description && (
                                            <span className={styles.taskDesc}>{task.description}</span>
                                        )}
                                    </div>

                                    {task.subject && (
                                        <span className={styles.subjectPill}>{task.subject}</span>
                                    )}
                                    {task.due_date && (
                                        <span className={[styles.duePill, task.due_date < today && task.status !== 'done' ? styles.overdue : ''].filter(Boolean).join(' ')}>
                                            {format(new Date(task.due_date + 'T00:00'), 'MMM d')}
                                        </span>
                                    )}
                                    <Badge label={task.priority} variant={task.priority} />

                                    <div className={styles.rowActions}>
                                        <button className={styles.actionBtn} onClick={() => openEdit(task)} aria-label="Edit task">
                                            <Pencil size={13} strokeWidth={1.8} />
                                        </button>
                                        <button
                                            className={[styles.actionBtn, styles.dangerBtn].join(' ')}
                                            onClick={() => deleteTask.mutate(task.id)}
                                            aria-label="Delete task"
                                        >
                                            <Trash2 size={13} strokeWidth={1.8} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>

            {/* FAB */}
            <button className={styles.fab} onClick={openCreate} aria-label="Add task">
                <Plus size={22} />
            </button>

            {/* Modal */}
            {showModal && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editTask ? 'Edit Task' : 'New Task'}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <Input
                                label="Title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Task title"
                                required
                                autoFocus
                            />
                            <Input
                                label="Description (optional)"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Additional notes…"
                            />
                            <div className={styles.row2col}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Subject</label>
                                    <select
                                        className={styles.select}
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    >
                                        <option value="">No subject</option>
                                        {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Priority</label>
                                    <select
                                        className={styles.select}
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="Due Date (optional)"
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            />
                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button
                                    type="submit"
                                    isLoading={createTask.isPending || updateTask.isPending}
                                >
                                    {editTask ? 'Save Changes' : 'Add Task'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
