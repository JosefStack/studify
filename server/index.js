import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Default to 3001 to avoid Vite conflict

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        brand: 'Studify',
        timestamp: new Date().toISOString()
    });
});

// Example route: Proxying study stats or computing them on server
app.get('/api/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Parallel fetch for dashboard data
        const [tasksRes, sessionsRes] = await Promise.all([
            supabase.from('tasks').select('*').eq('user_id', userId),
            supabase.from('pomodoro_sessions').select('*').eq('user_id', userId)
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (sessionsRes.error) throw sessionsRes.error;

        const tasks = tasksRes.data || [];
        const sessions = sessionsRes.data || [];

        const stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
            totalFocusMins: sessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0),
            pomodorosCompleted: sessions.length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend in production (optional, usually handled by separate deployment)
// app.use(express.static('dist'));

app.listen(PORT, () => {
    console.log(`Studify Backend running at http://localhost:${PORT}`);
});
