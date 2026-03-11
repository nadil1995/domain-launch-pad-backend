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
  downloadUrl?: string;
  createdAt: string;
}

export interface Score {
  id: string;
  title: string;
  composer?: string | null;
  tags: string[];
  folderId?: string | null;
  createdById: string;
  folder?: Folder | null;
  createdBy?: User;
  versions?: ScoreVersion[];
  createdAt: string;
  updatedAt: string;
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
