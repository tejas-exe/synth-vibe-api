import cors from 'cors';
import express from 'express';
import { apiRouter } from '../routes/index.ts';

export function createExpressApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(apiRouter);

    return app;
}
