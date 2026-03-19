import helmet from 'helmet';
import { aj } from '../lib/arcjet.js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;

// ── Security: Helmet HTTP headers ────────────────────────────────────────────
export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", supabaseUrl, "https://*.supabase.co"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding external resources
});

// ── Arcjet middleware ────────────────────────────────────────────────────────
export const arcjetMiddleware = async (req, res, next) => {
    try {
        const decision = await aj.protect(req);

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return res.status(429).json({ error: 'Too many requests. Please try again later.' });
            }
            if (decision.reason.isBot()) {
                return res.status(403).json({ error: 'Bot detected.' });
            }
            return res.status(403).json({ error: 'Forbidden.' });
        }

        next();
    } catch (error) {
        // If Arcjet is not configured (no key), just pass through
        if (!process.env.ARCJET_KEY) {
            return next();
        }
        console.error('Arcjet error:', error.message);
        next();
    }
};
