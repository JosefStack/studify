import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('FATAL: Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Security: Restrict CORS to known origins only ---
const allowedOrigins = [
    'http://localhost:5173',        // Local Vite dev
    process.env.FRONTEND_URL,       // Production frontend (set in Render env vars)
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));

app.use(express.json({ limit: '50kb' })); // Limit payload size

// --- Security: Basic rate limiting helper ---
const requestCounts = new Map();
function rateLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const max = 60;             // 60 requests per minute

    const entry = requestCounts.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
        entry.count = 1;
        entry.start = now;
    } else {
        entry.count++;
    }
    requestCounts.set(ip, entry);

    if (entry.count > max) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    next();
}

app.use(rateLimit);

// --- Security headers ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Health check - no sensitive info
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// --- Protected: /api/stats/:userId ---
// Validate that the requesting user can only access their own stats
// by verifying the Supabase JWT from the Authorization header
app.get('/api/stats/:userId', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const { userId } = req.params;

        // Ensure the authenticated user can only access their own data
        if (user.id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const [tasksRes, sessionsRes] = await Promise.all([
            supabase.from('tasks').select('id, status').eq('user_id', userId),
            supabase.from('pomodoro_sessions').select('id, duration_mins').eq('user_id', userId)
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (sessionsRes.error) throw sessionsRes.error;

        const tasks = tasksRes.data || [];
        const sessions = sessionsRes.data || [];

        res.json({
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
            totalFocusMins: sessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0),
            pomodorosCompleted: sessions.length
        });
    } catch (error) {
        console.error('Stats error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Catch-all 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Studify backend running on port ${PORT}`);
});
