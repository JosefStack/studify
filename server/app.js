import express from 'express';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { helmetMiddleware, arcjetMiddleware } from './middlewares/security.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

// 1. Global Security Middlewares
app.use(corsMiddleware);
app.use(helmetMiddleware);

// 2. Request parsing
app.use(express.json({ limit: '50kb' })); // Limit payload size

// 3. API Protection (Arcjet)
app.use(arcjetMiddleware);

// 4. Mount API Routes
app.use('/api', apiRoutes);

// 5. Catch-all 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// 6. Global error handler
/* eslint-disable-next-line no-unused-vars */
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

export default app;
