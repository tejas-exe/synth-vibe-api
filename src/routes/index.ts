import { Router } from 'express';
import { healthRouter } from './health.route.ts';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
    res.send('SyncPlay server is running 🎵');
});

apiRouter.use('/health', healthRouter);
