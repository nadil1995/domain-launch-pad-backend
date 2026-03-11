import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create groups
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await bcryptjs.hash('password123', 10),
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const conductorUser = await prisma.user.create({
    data: {
      email: 'conductor@example.com',
      password: await bcryptjs.hash('password123', 10),
      name: 'John Conductor',
      role: 'CONDUCTOR',
    },
  });

  const musician1 = await prisma.user.create({
    data: {
      email: 'musician1@example.com',
      password: await bcryptjs.hash('password123', 10),
      name: 'Alice Violinist',
      role: 'MUSICIAN',
    },
  });

  const musician2 = await prisma.user.create({
    data: {
      email: 'musician2@example.com',
      password: await bcryptjs.hash('password123', 10),
      name: 'Bob Cellist',
      role: 'MUSICIAN',
    },
  });

  console.log('✓ Created 4 users');

  // Create groups
  const orchestraGroup = await prisma.group.create({
    data: {
      name: 'City Orchestra',
      adminId: adminUser.id,
      members: {
        connect: [
          { id: adminUser.id },
          { id: conductorUser.id },
          { id: musician1.id },
          { id: musician2.id },
        ],
      },
    },
  });

  const chamberGroup = await prisma.group.create({
    data: {
      name: 'Chamber Ensemble',
      adminId: conductorUser.id,
      members: {
        connect: [
          { id: conductorUser.id },
          { id: musician1.id },
          { id: musician2.id },
        ],
      },
    },
  });

  console.log('✓ Created 2 groups');

  // Create folders for City Orchestra
  const orchestraFolder = await prisma.folder.create({
    data: {
      name: 'Orchestra',
      groupId: orchestraGroup.id,
    },
  });

  const beethovenFolder = await prisma.folder.create({
    data: {
      name: 'Beethoven',
      parentId: orchestraFolder.id,
      groupId: orchestraGroup.id,
    },
  });

  const mozartFolder = await prisma.folder.create({
    data: {
      name: 'Mozart',
      parentId: orchestraFolder.id,
      groupId: orchestraGroup.id,
    },
  });

  // Create folders for Chamber Ensemble
  const chamberFolder = await prisma.folder.create({
    data: {
      name: 'Chamber Music',
      groupId: chamberGroup.id,
    },
  });

  const schubert = await prisma.folder.create({
    data: {
      name: 'Schubert',
      parentId: chamberFolder.id,
      groupId: chamberGroup.id,
    },
  });

  console.log('✓ Created 5 folders');

  // Create scores
  const beethovenScore1 = await prisma.score.create({
    data: {
      title: 'Symphony No. 5 in C Minor',
      composer: 'Ludwig van Beethoven',
      tags: ['symphony', 'classical'],
      folderId: beethovenFolder.id,
      createdById: conductorUser.id,
    },
  });

  const beethovenScore2 = await prisma.score.create({
    data: {
      title: 'Moonlight Sonata',
      composer: 'Ludwig van Beethoven',
      tags: ['sonata', 'piano'],
      folderId: beethovenFolder.id,
      createdById: conductorUser.id,
    },
  });

  const mozartScore1 = await prisma.score.create({
    data: {
      title: 'Symphony No. 40 in G Minor',
      composer: 'Wolfgang Amadeus Mozart',
      tags: ['symphony', 'classical'],
      folderId: mozartFolder.id,
      createdById: conductorUser.id,
    },
  });

  // Additional scores for Chamber Ensemble
  const schubert1 = await prisma.score.create({
    data: {
      title: 'Piano Trio No. 1 in B flat Major',
      composer: 'Franz Schubert',
      tags: ['chamber', 'piano'],
      folderId: schubert.id,
      createdById: conductorUser.id,
    },
  });

  const schubert2 = await prisma.score.create({
    data: {
      title: 'String Quartet No. 14 in D Minor',
      composer: 'Franz Schubert',
      tags: ['chamber', 'strings'],
      folderId: schubert.id,
      createdById: conductorUser.id,
    },
  });

  const beethoven3 = await prisma.score.create({
    data: {
      title: 'Für Elise',
      composer: 'Ludwig van Beethoven',
      tags: ['piano', 'solo'],
      folderId: beethovenFolder.id,
      createdById: conductorUser.id,
    },
  });

  const mozart2 = await prisma.score.create({
    data: {
      title: 'Violin Sonata No. 1 in G Major',
      composer: 'Wolfgang Amadeus Mozart',
      tags: ['violin', 'sonata'],
      folderId: mozartFolder.id,
      createdById: conductorUser.id,
    },
  });

  const mozart3 = await prisma.score.create({
    data: {
      title: 'Requiem in D Minor, K. 626',
      composer: 'Wolfgang Amadeus Mozart',
      tags: ['orchestral', 'choral'],
      folderId: mozartFolder.id,
      createdById: conductorUser.id,
    },
  });

  console.log('✓ Created 8 scores');

  // Create score versions
  const symphony5V1 = await prisma.scoreVersion.create({
    data: {
      scoreId: beethovenScore1.id,
      filePath: 'scores/orchestra-group/beethoven-5/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
      changeNotes: 'Original score',
    },
  });

  const symphony5V2 = await prisma.scoreVersion.create({
    data: {
      scoreId: beethovenScore1.id,
      filePath: 'scores/orchestra-group/beethoven-5/v2.pdf',
      fileType: 'PDF',
      versionNumber: 2,
      pinned: false,
      changeNotes: 'Updated with conductor markings',
    },
  });

  const moonlightV1 = await prisma.scoreVersion.create({
    data: {
      scoreId: beethovenScore2.id,
      filePath: 'scores/orchestra-group/moonlight-sonata/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  const mozartV1 = await prisma.scoreVersion.create({
    data: {
      scoreId: mozartScore1.id,
      filePath: 'scores/orchestra-group/mozart-40/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  // Score versions for new scores
  const schubert1V1 = await prisma.scoreVersion.create({
    data: {
      scoreId: schubert1.id,
      filePath: 'scores/chamber-group/schubert-trio/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  const schubert2V1 = await prisma.scoreVersion.create({
    data: {
      scoreId: schubert2.id,
      filePath: 'scores/chamber-group/schubert-quartet/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  const beethoven3V1 = await prisma.scoreVersion.create({
    data: {
      scoreId: beethoven3.id,
      filePath: 'scores/orchestra-group/fur-elise/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  const mozart2V1 = await prisma.scoreVersion.create({
    data: {
      scoreId: mozart2.id,
      filePath: 'scores/orchestra-group/mozart-violin-sonata/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  const mozart3V1 = await prisma.scoreVersion.create({
    data: {
      scoreId: mozart3.id,
      filePath: 'scores/orchestra-group/mozart-requiem/v1.pdf',
      fileType: 'PDF',
      versionNumber: 1,
      pinned: true,
    },
  });

  console.log('✓ Created 9 score versions');

  // Create concerts
  const winterGalaConcert = await prisma.concert.create({
    data: {
      title: 'Winter Gala 2026',
      date: new Date('2026-03-20T19:00:00Z'),
      location: 'Concert Hall',
      groupId: orchestraGroup.id,
      createdById: conductorUser.id,
    },
  });

  const springChamberConcert = await prisma.concert.create({
    data: {
      title: 'Spring Chamber Concert 2026',
      date: new Date('2026-05-15T19:00:00Z'),
      location: 'Chamber Hall',
      groupId: chamberGroup.id,
      createdById: conductorUser.id,
    },
  });

  console.log('✓ Created 2 concerts');

  // Add pieces to Winter Gala Concert
  const piece1 = await prisma.concertPiece.create({
    data: {
      concertId: winterGalaConcert.id,
      scoreId: beethovenScore1.id,
      versionId: symphony5V1.id,
      order: 1,
    },
  });

  const piece2 = await prisma.concertPiece.create({
    data: {
      concertId: winterGalaConcert.id,
      scoreId: mozartScore1.id,
      versionId: mozartV1.id,
      order: 2,
    },
  });

  const piece3 = await prisma.concertPiece.create({
    data: {
      concertId: winterGalaConcert.id,
      scoreId: beethovenScore2.id,
      versionId: moonlightV1.id,
      order: 3,
    },
  });

  // Add pieces to Spring Chamber Concert
  const springPiece1 = await prisma.concertPiece.create({
    data: {
      concertId: springChamberConcert.id,
      scoreId: schubert1.id,
      versionId: schubert1V1.id,
      order: 1,
    },
  });

  const springPiece2 = await prisma.concertPiece.create({
    data: {
      concertId: springChamberConcert.id,
      scoreId: schubert2.id,
      versionId: schubert2V1.id,
      order: 2,
    },
  });

  console.log('✓ Created 5 concert pieces');

  console.log('✨ Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
