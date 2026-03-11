import { Router, Request, Response, NextFunction } from 'express';
import { requireJwt } from '../middleware/auth.js';
import {
  createFolder,
  getFolder,
  listFolders,
  getFolderTree,
  updateFolder,
  deleteFolder,
  getFolderWithScores,
} from '../services/folders.js';
import { AppError } from '../lib/errors.js';

export const foldersRouter = Router();

// Middleware
foldersRouter.use(requireJwt);

// GET /folders/tree - Get folder tree structure (all nested folders)
foldersRouter.get(
  '/tree',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tree = await getFolderTree(req.userId!);
      res.json(tree);
    } catch (error) {
      next(error);
    }
  }
);

// GET /folders - List root folders or children of a parent folder
foldersRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parentId = req.query.parentId as string | undefined;
      const folders = await listFolders(req.userId!, parentId);
      res.json(folders);
    } catch (error) {
      next(error);
    }
  }
);

// GET /folders/:id/scores - Get folder with all scores
foldersRouter.get(
  '/:id/scores',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folder = await getFolderWithScores(req.params.id, req.userId!);
      res.json(folder);
    } catch (error) {
      next(error);
    }
  }
);

// GET /folders/:id - Get folder details with children
foldersRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folder = await getFolder(req.params.id, req.userId!);
      res.json(folder);
    } catch (error) {
      next(error);
    }
  }
);

// POST /folders - Create a new folder
foldersRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, parentId } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError('Folder name is required', 400);
      }

      const folder = await createFolder(req.userId!, name.trim(), parentId);
      res.status(201).json(folder);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /folders/:id - Update folder
foldersRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, parentId } = req.body;

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          throw new AppError('Folder name must be a non-empty string', 400);
        }
      }

      const folder = await updateFolder(req.params.id, req.userId!, {
        name: name ? name.trim() : undefined,
        parentId,
      });

      res.json(folder);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /folders/:id - Delete folder
foldersRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteFolder(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
