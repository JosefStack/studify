import { Router } from 'express';
import { getUserStats } from '../controllers/stats.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect this route with the requireAuth middleware
router.get('/:userId', requireAuth, getUserStats);

export default router;
