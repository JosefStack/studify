import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks } from 'date-fns';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import styles from './SchedulePage.module.css';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#2EAADC', '#0f9f6e', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'];

const EMPTY_FORM = { title: '', subject: '', location: '', day_of_week: 0, start_time: '09:00', end_time: '10:00', color: '#2EAADC' };

export default function SchedulePage() {
    const { user } = useAuthStore();
    const qc = useQueryClient();
    const [weekOffset, setWeekOffset] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

    const { data: events = [] } = useQuery({
        queryKey: ['schedule', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from('schedule_events').select('*').eq('user_id', user.id);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user?.id,
    });

    const createEvent = useMutation({
        mutationFn: async (f) => {
            const { error } = await supabase.from('schedule_events').insert({
                user_id: user.id, title: f.title, subject: f.subject || null,
                location: f.location || null, day_of_week: Number(f.day_of_week),
                start_time: f.start_time, end_time: f.end_time, color: f.color, recurring: true,
            });
            if (error) throw error;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule'] }); closeModal(); },
    });

    const deleteEvent = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('schedule_events').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
    });

    function getEventsForSlot(dayIdx, hour) {
        return events.filter((e) => {
            const startH = parseInt(e.start_time.split(':')[0]);
            return e.day_of_week === dayIdx && startH === hour;
        });
    }

    function getEventHeight(e) {
        const [sh, sm] = e.start_time.split(':').map(Number);
        const [eh, em] = e.end_time.split(':').map(Number);
        const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
        return Math.max(duration, 0.5) * 60; // 60px per hour
    }

    const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); };

    return (
        <div className={styles.page}>
            {/* Top bar */}
            <div className={styles.topBar}>
                <h1 className={styles.title}>Schedule</h1>
                <div className={styles.weekNav}>
                    <button className={styles.navBtn} onClick={() => setWeekOffset((o) => o - 1)}><ChevronLeft size={16} /></button>
                    <span className={styles.weekLabel}>
                        {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </span>
                    <button className={styles.navBtn} onClick={() => setWeekOffset((o) => o + 1)}><ChevronRight size={16} /></button>
                    <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
                </div>
                <Button leftIcon={<Plus size={15} />} onClick={() => setShowModal(true)}>Add Class</Button>
            </div>

            {/* Grid */}
            <div className={styles.gridWrapper}>
                {/* Time labels column */}
                <div className={styles.timeCol}>
                    <div className={styles.timeColHeader} />
                    {HOURS.map((h) => (
                        <div key={h} className={styles.timeSlot}>
                            {h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIdx) => {
                    const isToday = weekOffset === 0 && dayIdx === todayIdx;
                    return (
                        <div key={dayIdx} className={[styles.dayCol, isToday ? styles.todayCol : ''].filter(Boolean).join(' ')}>
                            <div className={[styles.dayHeader, isToday ? styles.todayHeader : ''].filter(Boolean).join(' ')}>
                                <span className={styles.dayName}>{DAYS[dayIdx]}</span>
                                <span className={styles.dayNum}>{format(day, 'd')}</span>
                            </div>
                            {HOURS.map((hour) => {
                                const slotEvents = getEventsForSlot(dayIdx, hour);
                                return (
                                    <div key={hour} className={styles.cell}>
                                        {slotEvents.map((ev) => (
                                            <div
                                                key={ev.id}
                                                className={styles.eventBlock}
                                                style={{
                                                    background: `${ev.color}22`,
                                                    borderLeft: `3px solid ${ev.color}`,
                                                    height: `${getEventHeight(ev)}px`,
                                                    color: ev.color,
                                                }}
                                            >
                                                <span className={styles.evTitle}>{ev.title}</span>
                                                {ev.location && <span className={styles.evRoom}>{ev.location}</span>}
                                                <button
                                                    className={styles.evDelete}
                                                    onClick={() => deleteEvent.mutate(ev.id)}
                                                    aria-label="Remove class"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add Class</h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); createEvent.mutate(form); }} className={styles.modalForm}>
                            <Input label="Class Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Linear Algebra" required autoFocus />
                            <div className={styles.row2}>
                                <div className={styles.fg}>
                                    <label className={styles.fl}>Subject</label>
                                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Math" />
                                </div>
                                <div className={styles.fg}>
                                    <label className={styles.fl}>Room / Location</label>
                                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. B204" />
                                </div>
                            </div>
                            <div className={styles.fg}>
                                <label className={styles.fl}>Day</label>
                                <select className={styles.select} value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}>
                                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                                </select>
                            </div>
                            <div className={styles.row2}>
                                <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                                <Input label="End Time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                            </div>
                            <div className={styles.fg}>
                                <label className={styles.fl}>Color</label>
                                <div className={styles.colorRow}>
                                    {COLORS.map((c) => (
                                        <button
                                            key={c} type="button"
                                            className={[styles.colorSwatch, form.color === c ? styles.colorActive : ''].filter(Boolean).join(' ')}
                                            style={{ background: c }}
                                            onClick={() => setForm({ ...form, color: c })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit" isLoading={createEvent.isPending}>Add Class</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
