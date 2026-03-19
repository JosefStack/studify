import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = [
    'http://localhost:5173',        // Local Vite dev
    'http://localhost:4173',        // Vite preview
    process.env.FRONTEND_URL,       // Production frontend
].filter(Boolean);

export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
});
