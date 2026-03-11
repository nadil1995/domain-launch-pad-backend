import { prisma } from '../lib/db.js';
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

async function validateFolderAccess(
  folderId: string | undefined | null,
  userGroupId: string
) {
  if (!folderId) {
    return; // Null is allowed for root level
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.groupId !== userGroupId) {
    throw new BadRequestError('Folder not found or access denied');
  }
}

export async function createFolder(
  userId: string,
  name: string,
  parentId?: string | null
) {
  const userGroupId = await getUserGroup(userId);

  // If parent folder specified, validate access
  if (parentId) {
    await validateFolderAccess(parentId, userGroupId);

    // Verify parent folder is in same group
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId },
    });

    if (!parentFolder || parentFolder.groupId !== userGroupId) {
      throw new BadRequestError('Parent folder not found or access denied');
    }
  }

  return prisma.folder.create({
    data: {
      name,
      parentId: parentId || null,
      groupId: userGroupId,
    },
    include: {
      parent: true,
      children: true,
    },
  });
}

export async function getFolder(folderId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      parent: true,
      children: {
        include: {
          children: true, // 2 levels deep for tree view
        },
      },
      scores: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!folder || folder.groupId !== userGroupId) {
    throw new NotFoundError('Folder not found');
  }

  return folder;
}

export async function listFolders(userId: string, parentId?: string | null) {
  const userGroupId = await getUserGroup(userId);

  if (parentId) {
    await validateFolderAccess(parentId, userGroupId);
  }

  return prisma.folder.findMany({
    where: {
      groupId: userGroupId,
      parentId: parentId || null,
    },
    include: {
      children: {
        select: {
          id: true,
          name: true,
        },
      },
      scores: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getFolderTree(userId: string) {
  const userGroupId = await getUserGroup(userId);

  // Get all root folders
  const rootFolders = await prisma.folder.findMany({
    where: {
      groupId: userGroupId,
      parentId: null,
    },
    include: {
      children: {
        include: {
          children: {
            include: {
              children: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return rootFolders;
}

export async function updateFolder(
  folderId: string,
  userId: string,
  data: { name?: string; parentId?: string | null }
) {
  const userGroupId = await getUserGroup(userId);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.groupId !== userGroupId) {
    throw new NotFoundError('Folder not found');
  }

  // If changing parent, validate new parent
  if (data.parentId !== undefined) {
    if (data.parentId) {
      await validateFolderAccess(data.parentId, userGroupId);

      // Prevent folder from being its own parent
      if (data.parentId === folderId) {
        throw new BadRequestError('Folder cannot be its own parent');
      }

      // Prevent circular references (check if new parent is a descendant)
      const isDescendant = await isDescendantOf(folderId, data.parentId);
      if (isDescendant) {
        throw new BadRequestError(
          'Cannot move folder to its own descendant'
        );
      }
    }
  }

  return prisma.folder.update({
    where: { id: folderId },
    data: {
      name: data.name !== undefined ? data.name : folder.name,
      parentId: data.parentId !== undefined ? data.parentId : folder.parentId,
    },
    include: {
      parent: true,
      children: true,
    },
  });
}

async function isDescendantOf(parentId: string, potentialDescendant: string): Promise<boolean> {
  let currentFolder = await prisma.folder.findUnique({
    where: { id: potentialDescendant },
    select: { parentId: true },
  });

  while (currentFolder?.parentId) {
    if (currentFolder.parentId === parentId) {
      return true;
    }

    currentFolder = await prisma.folder.findUnique({
      where: { id: currentFolder.parentId },
      select: { parentId: true },
    });
  }

  return false;
}

export async function deleteFolder(folderId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      scores: true,
      children: true,
    },
  });

  if (!folder || folder.groupId !== userGroupId) {
    throw new NotFoundError('Folder not found');
  }

  // Check if folder has scores
  if (folder.scores.length > 0) {
    throw new BadRequestError(
      'Cannot delete folder with scores. Move scores first or delete them individually.'
    );
  }

  // Check if folder has children
  if (folder.children.length > 0) {
    throw new BadRequestError(
      'Cannot delete folder with subfolders. Move or delete subfolders first.'
    );
  }

  await prisma.folder.delete({
    where: { id: folderId },
  });
}

export async function getFolderWithScores(folderId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      scores: {
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!folder || folder.groupId !== userGroupId) {
    throw new NotFoundError('Folder not found');
  }

  return folder;
}
