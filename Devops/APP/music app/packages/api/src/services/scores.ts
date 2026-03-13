import path from 'path';
import { prisma } from '../lib/db.js';
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/s3.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';

async function getUserGroup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.groupId) {
    throw new BadRequestError('User must be part of a group');
  }

  return user.groupId;
}

async function validateFolderAccess(folderId: string | undefined | null, userGroupId: string) {
  if (!folderId) {
    return; // Null folderId is allowed (root level)
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.groupId !== userGroupId) {
    throw new BadRequestError('Folder not found or access denied');
  }
}

export async function createScore(
  createdById: string,
  title: string,
  composer?: string,
  folderId?: string | null,
  tags?: string[],
  durationSeconds?: number,
  key?: string,
  tempo?: number,
  genre?: string,
  notes?: string
) {
  const userGroupId = await getUserGroup(createdById);
  await validateFolderAccess(folderId, userGroupId);

  return prisma.score.create({
    data: {
      title,
      composer: composer || null,
      createdById,
      folderId: folderId || null,
      tags: tags || [],
      durationSeconds: durationSeconds || null,
      key: key || null,
      tempo: tempo || null,
      genre: genre || null,
      notes: notes || null,
    },
  });
}

export async function uploadScoreVersion(
  scoreId: string,
  userId: string,
  file: Express.Multer.File,
  changeNotes?: string,
  tags?: string[]
) {
  const userGroupId = await getUserGroup(userId);

  // Verify score exists
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: { folder: true },
  });

  if (!score) {
    throw new NotFoundError('Score not found');
  }

  // Verify user has access to the score's folder
  if (score.folderId) {
    await validateFolderAccess(score.folderId, userGroupId);
  }

  // Get current version count to increment
  const versionCount = await prisma.scoreVersion.count({
    where: { scoreId },
  });

  const versionNumber = versionCount + 1;

  // Determine file type from extension
  const ext = path.extname(file.originalname).toLowerCase();
  let fileType: 'PDF' | 'MUSICXML' | 'IMAGE';

  if (ext === '.pdf') {
    fileType = 'PDF';
  } else if (['.xml', '.musicxml'].includes(ext)) {
    fileType = 'MUSICXML';
  } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    fileType = 'IMAGE';
  } else {
    throw new BadRequestError('Unsupported file type');
  }

  // Generate S3 key: scores/{groupId}/{scoreId}/{versionId}.{ext}
  const versionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const s3Key = `scores/${userGroupId}/${scoreId}/${versionId}${ext}`;

  // Upload file to S3
  await uploadFile(s3Key, file.buffer, file.mimetype);

  // Create score version record
  const scoreVersion = await prisma.scoreVersion.create({
    data: {
      scoreId,
      versionNumber,
      fileType,
      filePath: s3Key,
      changeNotes: changeNotes || null,
      tags: tags || [],
      pinned: false,
    },
  });

  // Get presigned URL for download
  const presignedUrl = await getPresignedUrl(s3Key);

  return {
    ...scoreVersion,
    downloadUrl: presignedUrl,
  };
}

export async function getScoreVersions(scoreId: string) {
  const versions = await prisma.scoreVersion.findMany({
    where: { scoreId },
    orderBy: { createdAt: 'desc' },
  });

  // Add presigned URLs
  const versionsWithUrls = await Promise.all(
    versions.map(async (v) => ({
      ...v,
      downloadUrl: await getPresignedUrl(v.filePath),
    }))
  );

  return versionsWithUrls;
}

export async function deleteScoreVersion(versionId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const version = await prisma.scoreVersion.findUnique({
    where: { id: versionId },
    include: { score: { include: { folder: true } } },
  });

  if (!version) {
    throw new NotFoundError('Version not found');
  }

  // Verify user has access
  if (version.score.folderId) {
    await validateFolderAccess(version.score.folderId, userGroupId);
  }

  // Verify user is admin or conductor
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isAuthorized =
    user?.role === 'ADMIN' || user?.role === 'CONDUCTOR';

  if (!isAuthorized) {
    throw new BadRequestError('Only admins or conductors can delete versions');
  }

  // First, delete all concert pieces that reference this version
  await prisma.concertPiece.deleteMany({
    where: { versionId: versionId },
  });

  // Delete from S3
  await deleteFile(version.filePath);

  // Delete from database
  await prisma.scoreVersion.delete({
    where: { id: versionId },
  });
}

export async function pinScoreVersion(versionId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const version = await prisma.scoreVersion.findUnique({
    where: { id: versionId },
    include: { score: { include: { folder: true } } },
  });

  if (!version) {
    throw new NotFoundError('Version not found');
  }

  // Verify user has access
  if (version.score.folderId) {
    await validateFolderAccess(version.score.folderId, userGroupId);
  }

  // Verify user is admin or conductor
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isAuthorized =
    user?.role === 'ADMIN' || user?.role === 'CONDUCTOR';

  if (!isAuthorized) {
    throw new BadRequestError('Only admins or conductors can pin versions');
  }

  // Unpin all other versions for this score
  await prisma.scoreVersion.updateMany({
    where: { scoreId: version.scoreId },
    data: { pinned: false },
  });

  // Pin this version
  return prisma.scoreVersion.update({
    where: { id: versionId },
    data: { pinned: true },
  });
}

export async function getScore(scoreId: string) {
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!score) {
    throw new NotFoundError('Score not found');
  }

  return score;
}

export async function listScores(userGroupId: string, folderId?: string | null) {
  const where: any = {};

  if (folderId) {
    // Verify folder belongs to user's group
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.groupId !== userGroupId) {
      throw new BadRequestError('Folder not found');
    }

    where.folderId = folderId;
  } else {
    // Get all scores created by users in this group (includes root-level scores)
    where.createdBy = { groupId: userGroupId };
  }

  return prisma.score.findMany({
    where,
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Only latest version
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function searchScores(
  userGroupId: string,
  query?: string,
  tags?: string[]
) {
  // Search all scores created by users in this group (includes root-level scores)
  const where: any = {
    createdBy: { groupId: userGroupId },
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { composer: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  return prisma.score.findMany({
    where,
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateScore(
  scoreId: string,
  userId: string,
  data: {
    title?: string;
    composer?: string;
    tags?: string[];
    durationSeconds?: number;
    key?: string;
    tempo?: number;
    genre?: string;
    notes?: string;
  }
) {
  const userGroupId = await getUserGroup(userId);

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: { folder: true },
  });

  if (!score) {
    throw new NotFoundError('Score not found');
  }

  // Verify user has access
  if (score.folderId) {
    await validateFolderAccess(score.folderId, userGroupId);
  }

  return prisma.score.update({
    where: { id: scoreId },
    data: {
      title: data.title !== undefined ? data.title : score.title,
      composer: data.composer !== undefined ? data.composer : score.composer,
      tags: data.tags !== undefined ? data.tags : score.tags,
      durationSeconds: data.durationSeconds !== undefined ? data.durationSeconds : score.durationSeconds,
      key: data.key !== undefined ? data.key : score.key,
      tempo: data.tempo !== undefined ? data.tempo : score.tempo,
      genre: data.genre !== undefined ? data.genre : score.genre,
      notes: data.notes !== undefined ? data.notes : score.notes,
    },
  });
}

export async function deleteScore(scoreId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: {
      folder: true,
      versions: true,
    },
  });

  if (!score) {
    throw new NotFoundError('Score not found');
  }

  // Verify user has access
  if (score.folderId) {
    await validateFolderAccess(score.folderId, userGroupId);
  }

  // Verify user is admin/conductor
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isAuthorized =
    user?.role === 'ADMIN' || user?.role === 'CONDUCTOR';

  if (!isAuthorized) {
    throw new BadRequestError('Only admins or conductors can delete scores');
  }

  // Delete all versions from S3
  await Promise.all(score.versions.map((v) => deleteFile(v.filePath)));

  // Delete score from database
  await prisma.score.delete({
    where: { id: scoreId },
  });
}
