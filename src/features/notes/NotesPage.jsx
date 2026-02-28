import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Pencil, X, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Card } from '../../components/Card/Card';
import { Badge } from '../../components/Badge/Badge';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import styles from './NotesPage.module.css';

const SUBJECTS = ['Math', 'Physics', 'History', 'Biology', 'English', 'Chemistry'];
const SUBJECT_COLORS = {
    Math: '#2EAADC', Physics: '#8b5cf6', History: '#f59e0b',
    Biology: '#0f9f6e', English: '#ec4899', Chemistry: '#ef4444',
};

const EMPTY_FORM = { title: '', content: '', subject: '', tags: '' };

export default function NotesPage() {
    const { user } = useAuthStore();
    const qc = useQueryClient();

    const [activeSubject, setActiveSubject] = useState('All');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editNote, setEditNote] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    /* ── Queries ── */
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user?.id,
    });

    /* ── Mutations ── */
    const createNote = useMutation({
        mutationFn: async (f) => {
            const tags = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
            const { error } = await supabase.from('notes').insert({
                user_id: user.id,
                title: f.title,
                content: f.content || null,
                subject: f.subject || null,
                tags,
            });
            if (error) throw error;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); closeModal(); },
    });

    const updateNote = useMutation({
        mutationFn: async ({ id, ...f }) => {
            const tags = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
            const { error } = await supabase.from('notes').update({
                title: f.title, content: f.content || null,
                subject: f.subject || null, tags,
            }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); closeModal(); },
    });

    const deleteNote = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
    });

    /* ── Filter ── */
    const filtered = notes.filter((n) => {
        const matchSub = activeSubject === 'All' || n.subject === activeSubject;
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());
        return matchSub && matchSearch;
    });

    /* ── Modal helpers ── */
    const openCreate = () => { setForm(EMPTY_FORM); setEditNote(null); setShowModal(true); };
    const openEdit = (n) => {
        setForm({ title: n.title, content: n.content ?? '', subject: n.subject ?? '', tags: (n.tags || []).join(', ') });
        setEditNote(n);
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditNote(null); setForm(EMPTY_FORM); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        if (editNote) updateNote.mutate({ id: editNote.id, ...form });
        else createNote.mutate(form);
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Notes</h1>
                <div className={styles.headerActions}>
                    <Input
                        placeholder="Search notes…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search size={14} />}
                        className={styles.search}
                    />
                    <Button leftIcon={<Plus size={15} />} onClick={openCreate}>New Note</Button>
                </div>
            </div>

            {/* Subject filter chips */}
            <div className={styles.filters}>
                {['All', ...SUBJECTS].map((sub) => (
                    <button
                        key={sub}
                        className={[styles.chip, activeSubject === sub ? styles.chipActive : ''].filter(Boolean).join(' ')}
                        onClick={() => setActiveSubject(sub)}
                        style={activeSubject === sub && sub !== 'All' ? { background: SUBJECT_COLORS[sub], color: '#fff', borderColor: 'transparent' } : undefined}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className={styles.loading}>Loading…</div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <Tag size={32} color="var(--color-text-muted)" />
                    <p>No notes found</p>
                    <Button variant="secondary" size="sm" onClick={openCreate}>Create your first note</Button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((note) => {
                        const color = SUBJECT_COLORS[note.subject ?? ''] ?? '#9b9b97';
                        return (
                            <Card key={note.id} padding="none" hoverable className={styles.noteCard}>
                                {note.subject && (
                                    <div className={styles.colorStrip} style={{ background: color }} />
                                )}
                                <div className={styles.noteBody}>
                                    <h3 className={styles.noteTitle}>{note.title}</h3>
                                    {note.content && (
                                        <p className={styles.noteSnippet}>
                                            {note.content.slice(0, 100)}{note.content.length > 100 ? '…' : ''}
                                        </p>
                                    )}
                                    <div className={styles.noteMeta}>
                                        <span className={styles.noteDate}>{format(new Date(note.updated_at), 'MMM d, yyyy')}</span>
                                        {(note.tags || []).map((tag) => (
                                            <Badge key={tag} label={tag} />
                                        ))}
                                    </div>
                                    <div className={styles.noteActions}>
                                        <button className={styles.iconBtn} onClick={() => openEdit(note)} aria-label="Edit note"><Pencil size={13} /></button>
                                        <button className={[styles.iconBtn, styles.dangerBtn].join(' ')} onClick={() => deleteNote.mutate(note.id)} aria-label="Delete note"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {/* Empty card */}
                    <button className={styles.addCard} onClick={openCreate}>
                        <Plus size={20} color="var(--color-text-muted)" />
                        <span>New note</span>
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editNote ? 'Edit Note' : 'New Note'}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Note title" required autoFocus />
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Subject</label>
                                <select className={styles.select} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                                    <option value="">No subject</option>
                                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Content</label>
                                <textarea className={styles.textarea} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Write your notes here…" />
                            </div>
                            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. midterm, chapter-3" />
                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit" isLoading={createNote.isPending || updateNote.isPending}>
                                    {editNote ? 'Save Changes' : 'Create Note'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
