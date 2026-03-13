// User Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'CONDUCTOR' | 'MUSICIAN' | 'GUEST';
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  adminId: string;
  admin: User;
  members: User[];
  createdAt: string;
}

// Folder Types
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  groupId: string;
  parent?: Folder | null;
  children?: Folder[];
  scores?: Score[];
  createdAt: string;
}

// Score Types
export interface ScoreVersion {
  id: string;
  scoreId: string;
  versionNumber: number;
  fileType: 'PDF' | 'MUSICXML' | 'IMAGE';
  filePath: string;
  pinned: boolean;
  changeNotes?: string | null;
  tags: string[];
  downloadUrl?: string;
  createdAt: string;
}

export interface Score {
  id: string;
  title: string;
  composer?: string | null;
  tags: string[];
  durationSeconds?: number | null;
  key?: string | null;
  tempo?: number | null;
  genre?: string | null;
  notes?: string | null;
  folderId?: string | null;
  createdById: string;
  folder?: Folder | null;
  createdBy?: User;
  versions?: ScoreVersion[];
  createdAt: string;
  updatedAt: string;
}

// Concert Member Types
export type ConcertMemberPermission = 'VIEWER' | 'PERFORMER';
export type ConcertMemberStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ConcertMember {
  id: string;
  concertId: string;
  userId: string;
  permission: ConcertMemberPermission;
  status: ConcertMemberStatus;
  createdAt: string;
  respondedAt?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: 'ADMIN' | 'CONDUCTOR' | 'MUSICIAN' | 'GUEST';
  };
}

// Concert Types
export interface ConcertPiece {
  id: string;
  concertId: string;
  scoreId: string;
  versionId: string;
  order: number;
  score: {
    id: string;
    title: string;
    composer?: string;
    key?: string | null;
    tempo?: number | null;
    durationSeconds?: number | null;
    notes?: string | null;
    genre?: string | null;
  };
  version: {
    id: string;
    versionNumber: number;
    fileType: 'PDF' | 'MUSICXML' | 'IMAGE';
    filePath?: string;
  };
}

export interface Concert {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  createdById: string;
  groupId: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  pieces: ConcertPiece[];
  members?: ConcertMember[];
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  user: User;
}

// Instrument & Performance Types
export type InstrumentType = 'VIOLIN' | 'VIOLA' | 'CELLO' | 'BASS' | 'FLUTE' | 'OBOE' | 'CLARINET' | 'BASSOON' | 'HORN' | 'TRUMPET' | 'TROMBONE' | 'TUBA' | 'HARP' | 'PIANO' | 'PERCUSSION' | 'VOCALS' | 'OTHER';
export type PerformerRole = 'SOLOIST' | 'FEATURED' | 'ENSEMBLE';

export interface InstrumentAssignment {
  id: string;
  concertMemberId: string;
  concertPieceId: string;
  instrument: InstrumentType;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedPerformer {
  id: string;
  concertMemberId: string;
  concertPieceId: string;
  role: PerformerRole;
  description?: string | null;
  createdAt: string;
}
