import { Router, Request, Response, NextFunction } from 'express';
import { requireJwt } from '../middleware/auth.js';
import {
  createConcert,
  getConcert,
  listConcerts,
  updateConcert,
  deleteConcert,
  addPieceToConcert,
  removePieceFromConcert,
  reorderPieces,
} from '../services/concerts.js';
import { AppError } from '../lib/errors.js';

export const concertsRouter = Router();

// Middleware
concertsRouter.use(requireJwt);

// GET /concerts - List all concerts
concertsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const concerts = await listConcerts(req.userId!);
      res.json(concerts);
    } catch (error) {
      next(error);
    }
  }
);

// POST /concerts - Create concert
concertsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, date, location } = req.body;

      if (!title) {
        throw new AppError('Concert title is required', 400);
      }

      if (!date) {
        throw new AppError('Concert date is required', 400);
      }

      const concertDate = new Date(date);
      if (isNaN(concertDate.getTime())) {
        throw new AppError('Invalid date format', 400);
      }

      const concert = await createConcert(
        req.userId!,
        title,
        concertDate,
        location
      );

      res.status(201).json(concert);
    } catch (error) {
      next(error);
    }
  }
);

// GET /concerts/:id - Get concert details
concertsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const concert = await getConcert(req.params.id, req.userId!);
      res.json(concert);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /concerts/:id - Update concert
concertsRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, date, location } = req.body;

      const updateData: Record<string, any> = {};

      if (title !== undefined) {
        if (!title || typeof title !== 'string') {
          throw new AppError('Concert title must be a non-empty string', 400);
        }
        updateData.title = title;
      }

      if (date !== undefined) {
        const concertDate = new Date(date);
        if (isNaN(concertDate.getTime())) {
          throw new AppError('Invalid date format', 400);
        }
        updateData.date = concertDate;
      }

      if (location !== undefined) {
        updateData.location = location;
      }

      const concert = await updateConcert(req.params.id, req.userId!, updateData);
      res.json(concert);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /concerts/:id - Delete concert
concertsRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteConcert(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// POST /concerts/:id/pieces - Add piece to concert
concertsRouter.post(
  '/:id/pieces',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scoreId, versionId } = req.body;

      if (!scoreId) {
        throw new AppError('scoreId is required', 400);
      }

      if (!versionId) {
        throw new AppError('versionId is required', 400);
      }

      const piece = await addPieceToConcert(
        req.params.id,
        scoreId,
        versionId,
        req.userId!
      );

      res.status(201).json(piece);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /concerts/:id/pieces/:pieceId - Remove piece from concert
concertsRouter.delete(
  '/:concertId/pieces/:pieceId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await removePieceFromConcert(req.params.pieceId, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /concerts/:id/pieces/reorder - Reorder pieces
concertsRouter.patch(
  '/:id/pieces/reorder',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pieces } = req.body;

      if (!Array.isArray(pieces)) {
        throw new AppError('pieces must be an array', 400);
      }

      const concert = await reorderPieces(req.params.id, req.userId!, pieces);
      res.json(concert);
    } catch (error) {
      next(error);
    }
  }
);
