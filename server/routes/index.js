import { Router } from 'express';
import healthRoutes from './health.routes.js';
import statsRoutes from './stats.routes.js';

const router = Router();

// Mount all routes
router.use('/health', healthRoutes);
router.use('/stats', statsRoutes);

export default router;
