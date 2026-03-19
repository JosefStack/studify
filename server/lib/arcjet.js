import arcjet, { tokenBucket, shield, detectBot } from '@arcjet/node';
import dotenv from 'dotenv';
dotenv.config();

// ── Arcjet — Rate limiting, bot detection, and shield ────────────────────────
export const aj = arcjet({
    key: process.env.ARCJET_KEY || '',
    characteristics: ['ip.src'],
    rules: [
        // Rate limiting: 60 requests per minute per IP
        tokenBucket({
            mode: process.env.ARCJET_KEY ? 'LIVE' : 'DRY_RUN',
            refillRate: 60,
            interval: 60,
            capacity: 60,
        }),
        // Shield: protects against common attacks (SQLi, XSS, etc.)
        shield({
            mode: process.env.ARCJET_KEY ? 'LIVE' : 'DRY_RUN',
        }),
        // Bot detection
        detectBot({
            mode: process.env.ARCJET_KEY ? 'LIVE' : 'DRY_RUN',
            allow: [], // Allow no bots by default; add specific ones if needed
        }),
    ],
});
