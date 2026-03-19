import { supabase } from '../lib/supabase.js';

export const getUserStats = async (req, res) => {
    try {
        // req.user is populated by the requireAuth middleware
        const authenticatedUserId = req.user.id;
        const requestedUserId = req.params.userId;

        // Ensure the authenticated user can only access their own data
        if (authenticatedUserId !== requestedUserId) {
            return res.status(403).json({ error: 'Forbidden: You can only access your own stats.' });
        }

        const [tasksRes, sessionsRes] = await Promise.all([
            supabase.from('tasks').select('id, status').eq('user_id', requestedUserId),
            supabase.from('pomodoro_sessions').select('id, duration_mins').eq('user_id', requestedUserId)
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
        console.error('Stats controller error:', error.message);
        res.status(500).json({ error: 'Internal server error fetching stats' });
    }
};
