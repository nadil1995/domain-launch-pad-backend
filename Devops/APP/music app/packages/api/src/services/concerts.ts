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

async function verifyUserIsAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'CONDUCTOR')) {
    throw new BadRequestError('Only admins or conductors can manage concerts');
  }
}

export async function createConcert(
  userId: string,
  title: string,
  date: Date,
  location?: string
) {
  const userGroupId = await getUserGroup(userId);
  await verifyUserIsAdmin(userId);

  return prisma.concert.create({
    data: {
      title,
      date,
      location: location || null,
      groupId: userGroupId,
      createdById: userId,
    },
    include: {
      pieces: {
        orderBy: { order: 'asc' },
        include: {
          score: {
            select: {
              id: true,
              title: true,
              composer: true,
            },
          },
          version: {
            select: {
              id: true,
              versionNumber: true,
              fileType: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getConcert(concertId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);

  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
    include: {
      pieces: {
        orderBy: { order: 'asc' },
        include: {
          score: {
            select: {
              id: true,
              title: true,
              composer: true,
            },
          },
          version: {
            select: {
              id: true,
              versionNumber: true,
              fileType: true,
              filePath: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!concert || concert.groupId !== userGroupId) {
    throw new NotFoundError('Concert not found');
  }

  return concert;
}

export async function listConcerts(userId: string) {
  const userGroupId = await getUserGroup(userId);

  return prisma.concert.findMany({
    where: { groupId: userGroupId },
    include: {
      pieces: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          scoreId: true,
          order: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });
}

export async function updateConcert(
  concertId: string,
  userId: string,
  data: { title?: string; date?: Date; location?: string | null }
) {
  const userGroupId = await getUserGroup(userId);
  await verifyUserIsAdmin(userId);

  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
  });

  if (!concert || concert.groupId !== userGroupId) {
    throw new NotFoundError('Concert not found');
  }

  return prisma.concert.update({
    where: { id: concertId },
    data: {
      title: data.title !== undefined ? data.title : concert.title,
      date: data.date !== undefined ? data.date : concert.date,
      location: data.location !== undefined ? data.location : concert.location,
    },
    include: {
      pieces: {
        orderBy: { order: 'asc' },
        include: {
          score: {
            select: {
              id: true,
              title: true,
              composer: true,
            },
          },
          version: {
            select: {
              id: true,
              versionNumber: true,
              fileType: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteConcert(concertId: string, userId: string) {
  const userGroupId = await getUserGroup(userId);
  await verifyUserIsAdmin(userId);

  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
  });

  if (!concert || concert.groupId !== userGroupId) {
    throw new NotFoundError('Concert not found');
  }

  await prisma.concert.delete({
    where: { id: concertId },
  });
}

export async function addPieceToConcert(
  concertId: string,
  scoreId: string,
  versionId: string,
  userId: string
) {
  const userGroupId = await getUserGroup(userId);
  await verifyUserIsAdmin(userId);

  // Verify concert exists and belongs to group
  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
  });

  if (!concert || concert.groupId !== userGroupId) {
    throw new NotFoundError('Concert not found');
  }

  // Verify score exists and belongs to group
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: { folder: true },
  });

  if (!score) {
    throw new NotFoundError('Score not found');
  }

  // Verify version exists
  const version = await prisma.scoreVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.scoreId !== scoreId) {
    throw new BadRequestError('Version not found or does not belong to this score');
  }

  // Get next order number
  const maxOrderPiece = await prisma.concertPiece.findFirst({
    where: { concertId },
    orderBy: { order: 'desc' },
  });

  const nextOrder = (maxOrderPiece?.order || 0) + 1;

  // Add piece
  return prisma.concertPiece.create({
    data: {
      concertId,
      scoreId,
      versionId,
      order: nextOrder,
    },
    include: {
      score: {
        select: {
          id: true,
          title: true,
          composer: true,
        },
      },
      version: {
        select: {
          id: true,
          versionNumber: true,
          fileType: true,
        },
      },
    },
  });
}

export async function removePieceFromConcert(
  pieceId: string,
  userId: string
) {
  const userGroupId = await getUserGroup(userId);
  await verifyUserIsAdmin(userId);

  const piece = await prisma.concertPiece.findUnique({
    where: { id: pieceId },
    include: { concert: true },
  });

  if (!piece || piece.concert.groupId !== userGroupId) {
    throw new NotFoundError('Piece not found');
  }

  // Delete the piece
  await prisma.concertPiece.delete({
    where: { id: pieceId },
  });

  // Reorder remaining pieces to fill the gap
  const remainingPieces = await prisma.concertPiece.findMany({
    where: { concertId: piece.concertId },
    orderBy: { order: 'asc' },
  });

  // Update orders
  for (let i = 0; i < remainingPieces.length; i++) {
    await prisma.concertPiece.update({
      where: { id: remainingPieces[i].id },
      data: { order: i + 1 },
    });
  }
}

export async function reorderPieces(
  concertId: string,
  userId: string,
  pieceOrders: Array<{ pieceId: string; order: number }>
) {
  const userGroupId = await getUserGroup(userId);
  await verifyUserIsAdmin(userId);

  // Verify concert exists
  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
  });

  if (!concert || concert.groupId !== userGroupId) {
    throw new NotFoundError('Concert not found');
  }

  // Verify all pieces belong to this concert
  const pieces = await prisma.concertPiece.findMany({
    where: { concertId },
  });

  const pieceIds = pieces.map((p) => p.id);
  const orderPieceIds = pieceOrders.map((po) => po.pieceId);

  // Check that all pieces are accounted for
  if (
    orderPieceIds.length !== pieceIds.length ||
    !orderPieceIds.every((id) => pieceIds.includes(id))
  ) {
    throw new BadRequestError(
      'Invalid piece list - must include all pieces in concert'
    );
  }

  // Check that orders are sequential starting from 1
  const orders = pieceOrders.map((po) => po.order).sort((a, b) => a - b);
  if (!orders.every((o, i) => o === i + 1)) {
    throw new BadRequestError('Orders must be sequential starting from 1');
  }

  // Update all pieces with new orders
  const updates = pieceOrders.map((po) =>
    prisma.concertPiece.update({
      where: { id: po.pieceId },
      data: { order: po.order },
    })
  );

  await Promise.all(updates);

  // Return updated concert
  return prisma.concert.findUnique({
    where: { id: concertId },
    include: {
      pieces: {
        orderBy: { order: 'asc' },
        include: {
          score: {
            select: {
              id: true,
              title: true,
              composer: true,
            },
          },
          version: {
            select: {
              id: true,
              versionNumber: true,
              fileType: true,
            },
          },
        },
      },
    },
  });
}
