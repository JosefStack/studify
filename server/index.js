import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Studify backend running on port ${PORT}`);
    if (!process.env.ARCJET_KEY) {
        console.warn('⚠️  ARCJET_KEY not set — Arcjet running in DRY_RUN mode (no enforcement)');
    }
});
