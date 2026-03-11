import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { foldersRouter } from './routes/folders.js';
import { scoresRouter } from './routes/scores.js';
import { concertsRouter } from './routes/concerts.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(generalLimiter);

  // Routes
  app.use('/api/v1', healthRouter);
  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/folders', foldersRouter);
  app.use('/api/v1/scores', scoresRouter);
  app.use('/api/v1/concerts', concertsRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
