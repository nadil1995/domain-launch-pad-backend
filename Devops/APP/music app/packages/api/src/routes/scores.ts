import { Router, Request, Response, NextFunction } from 'express';
import { requireJwt, requireRole } from '../middleware/auth.js';
import { upload } from '../lib/upload.js';
import { getPresignedUrl } from '../lib/s3.js';
import { ValidationError } from '../lib/errors.js';
import { prisma } from '../lib/db.js';
import * as scoresService from '../services/scores.js';

interface MultipartRequest extends Request {
  file?: Express.Multer.File;
}

export const scoresRouter = Router();

// List scores (with optional folder filter and search)
scoresRouter.get('/', requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { folderId, search, tags } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (!user.groupId) {
      throw new ValidationError('User must be part of a group');
    }

    let scores;
    if (search) {
      const tagArray = tags
        ? typeof tags === 'string'
          ? [tags]
          : Array.isArray(tags)
          ? tags
          : undefined
        : undefined;
      scores = await scoresService.searchScores(
        user.groupId,
        search as string,
        tagArray as string[] | undefined
      );
    } else {
      let folderIdStr: string | null = null;
      if (folderId && typeof folderId === 'string') {
        folderIdStr = folderId;
      } else if (Array.isArray(folderId) && folderId.length > 0 && typeof folderId[0] === 'string') {
        folderIdStr = folderId[0];
      }
      scores = await scoresService.listScores(user.groupId, folderIdStr);
    }

    res.json(scores);
  } catch (error) {
    next(error);
  }
});

// Create score
scoresRouter.post('/', requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { title, composer, folderId, tags, durationSeconds, key, tempo, genre, notes } = req.body;

    if (!title) {
      throw new ValidationError('Title is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    const score = await scoresService.createScore(
      userId,
      title,
      composer,
      folderId,
      tags,
      durationSeconds,
      key,
      tempo,
      genre,
      notes
    );

    res.status(201).json(score);
  } catch (error) {
    next(error);
  }
});

// Get score details
scoresRouter.get('/:id', requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const score = await scoresService.getScore(id);

    // Add presigned URLs to versions
    const versionsWithUrls = await Promise.all(
      score.versions.map(async (v: any) => ({
        ...v,
        downloadUrl: await getPresignedUrl(v.filePath),
      }))
    );

    res.json({ ...score, versions: versionsWithUrls });
  } catch (error) {
    next(error);
  }
});

// Update score
scoresRouter.patch('/:id', requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, composer, tags, durationSeconds, key, tempo, genre, notes } = req.body;

    const score = await scoresService.updateScore(id, userId, {
      title,
      composer,
      tags,
      durationSeconds,
      key,
      tempo,
      genre,
      notes,
    });

    res.json(score);
  } catch (error) {
    next(error);
  }
});

// Delete score
scoresRouter.delete('/:id', requireJwt, requireRole('ADMIN', 'CONDUCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await scoresService.deleteScore(id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Upload new score version
scoresRouter.post(
  '/:id/upload',
  requireJwt,
  upload.single('file'),
  async (req: MultipartRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { changeNotes, tags } = req.body;

      if (!req.file) {
        throw new ValidationError('No file provided');
      }

      const parsedTags = tags ? JSON.parse(tags) : undefined;

      const version = await scoresService.uploadScoreVersion(
        id,
        userId,
        req.file,
        changeNotes,
        parsedTags
      );

      res.status(201).json(version);
    } catch (error) {
      next(error);
    }
  }
);

// Get all versions for a score
scoresRouter.get('/:id/versions', requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const versions = await scoresService.getScoreVersions(id);
    res.json(versions);
  } catch (error) {
    next(error);
  }
});

// Get presigned download URL for a version
scoresRouter.get('/versions/:versionId/url', requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;

    const version = await prisma.scoreVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new ValidationError('Version not found');
    }

    const url = await getPresignedUrl(version.filePath);
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

// Pin a version (admin/conductor only)
scoresRouter.patch(
  '/versions/:versionId/pin',
  requireJwt,
  requireRole('ADMIN', 'CONDUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { versionId } = req.params;

      const version = await scoresService.pinScoreVersion(versionId, userId);
      res.json(version);
    } catch (error) {
      next(error);
    }
  }
);

// Delete a version (admin/conductor only)
scoresRouter.delete(
  '/versions/:versionId',
  requireJwt,
  requireRole('ADMIN', 'CONDUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { versionId } = req.params;

      await scoresService.deleteScoreVersion(versionId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
