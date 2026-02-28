import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import styles from './FocusPage.module.css';

const MODE_LABELS = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };
const DEFAULT_DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

export default function FocusPage() {
    const { user } = useAuthStore();

    const [mode, setMode] = useState('focus');
    const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.focus);
    const [isRunning, setIsRunning] = useState(false);
    const [pomodoroCount, setPomos] = useState(0);
    const [subject, setSubject] = useState('');
    const [sessionStarted, setSessionStarted] = useState(null);

    const totalSeconds = DEFAULT_DURATIONS[mode];
    const progress = (secondsLeft / totalSeconds) * 100;
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const seconds = (secondsLeft % 60).toString().padStart(2, '0');

    // ── Timer tick ──
    useEffect(() => {
        if (!isRunning) return;
        const id = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearInterval(id);
                    handleComplete();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [isRunning, mode]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleComplete = useCallback(async () => {
        setIsRunning(false);
        if (mode === 'focus') {
            const newCount = pomodoroCount + 1;
            setPomos(newCount);
            // Log session to Supabase
            if (user && sessionStarted) {
                await supabase.from('pomodoro_sessions').insert({
                    user_id: user.id,
                    subject: subject || null,
                    duration_mins: DEFAULT_DURATIONS.focus / 60,
                    started_at: sessionStarted,
                    completed_at: new Date().toISOString(),
                    was_completed: true,
                });
            }
            setSessionStarted(null);
            // Auto switch to break
            const nextMode = newCount % 4 === 0 ? 'long' : 'short';
            switchMode(nextMode);
        } else {
            switchMode('focus');
        }
    }, [mode, pomodoroCount, user, subject, sessionStarted]); // eslint-disable-line react-hooks/exhaustive-deps

    function switchMode(m) {
        setMode(m);
        setSecondsLeft(DEFAULT_DURATIONS[m]);
        setIsRunning(false);
    }

    function handleStart() {
        if (!isRunning && mode === 'focus' && secondsLeft === DEFAULT_DURATIONS.focus) {
            setSessionStarted(new Date().toISOString());
        }
        setIsRunning((r) => !r);
    }

    function handleReset() {
        setIsRunning(false);
        setSecondsLeft(DEFAULT_DURATIONS[mode]);
        setSessionStarted(null);
    }

    function handleSkip() {
        setIsRunning(false);
        if (mode === 'focus') {
            const nextMode = (pomodoroCount + 1) % 4 === 0 ? 'long' : 'short';
            switchMode(nextMode);
        } else {
            switchMode('focus');
        }
    }

    // SVG ring
    const radius = 90;
    const circ = 2 * Math.PI * radius;
    const strokeDash = circ - (circ * (100 - progress)) / 100;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Focus Timer</h1>
                <p className={styles.sub}>Deep work mode</p>
            </div>

            {/* Mode tabs */}
            <div className={styles.tabs}>
                {Object.keys(MODE_LABELS).map((m) => (
                    <button
                        key={m}
                        className={[styles.tab, mode === m ? styles.tabActive : ''].filter(Boolean).join(' ')}
                        onClick={() => !isRunning && switchMode(m)}
                    >
                        {MODE_LABELS[m]}
                    </button>
                ))}
            </div>

            {/* Timer ring */}
            <div className={styles.timerWrap}>
                <svg width="220" height="220" viewBox="0 0 220 220" className={styles.ring}>
                    <circle cx="110" cy="110" r={radius} className={styles.ringTrack} strokeWidth="8" fill="none" />
                    <circle
                        cx="110" cy="110" r={radius}
                        className={styles.ringProgress}
                        strokeWidth="8" fill="none"
                        strokeDasharray={circ}
                        strokeDashoffset={circ - strokeDash}
                        strokeLinecap="round"
                        transform="rotate(-90 110 110)"
                    />
                </svg>
                <div className={styles.timerInner}>
                    <span className={styles.timerDisplay}>{minutes}:{seconds}</span>
                    <span className={styles.pomodoroInfo}>
                        Pomodoro {pomodoroCount + 1}
                        {mode !== 'focus' ? ' — on break' : ''}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <button className={styles.controlBtn} onClick={handleReset} title="Reset">
                    <RotateCcw size={18} strokeWidth={1.8} />
                </button>
                <Button
                    size="lg"
                    onClick={handleStart}
                    className={styles.playBtn}
                    leftIcon={isRunning ? <Pause size={20} /> : <Play size={20} />}
                >
                    {isRunning ? 'Pause' : 'Start'}
                </Button>
                <button className={styles.controlBtn} onClick={handleSkip} title="Skip">
                    <SkipForward size={18} strokeWidth={1.8} />
                </button>
            </div>

            {/* Currently studying */}
            <Card padding="md" className={styles.studyCard}>
                <p className={styles.studyLabel}>Currently studying</p>
                <input
                    className={styles.studyInput}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject or topic…"
                />
            </Card>

            {/* Stats */}
            <div className={styles.statsRow}>
                <Card padding="md" className={styles.statChip}>
                    <p className={styles.statVal}>{pomodoroCount}</p>
                    <p className={styles.statKey}>Completed today</p>
                </Card>
                <Card padding="md" className={styles.statChip}>
                    <p className={styles.statVal}>{pomodoroCount * 25} min</p>
                    <p className={styles.statKey}>Focus time</p>
                </Card>
                <Card padding="md" className={styles.statChip}>
                    <p className={styles.statVal}>{pomodoroCount > 0 ? Math.ceil(pomodoroCount / 4) : 0}</p>
                    <p className={styles.statKey}>Long breaks taken</p>
                </Card>
            </div>
        </div>
    );
}
