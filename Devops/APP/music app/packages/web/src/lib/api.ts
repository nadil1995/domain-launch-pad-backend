import { LoginResponse, RegisterResponse } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(contentType = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    contentType = 'application/json'
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(contentType),
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch {
        // Ignore JSON parse error
      }
      throw new ApiError(response.status, response.statusText, errorMessage);
    }

    const data = await response.json();
    return data;
  }

  // Auth endpoints
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<RegisterResponse> {
    return this.request('POST', '/auth/register', {
      email,
      password,
      name,
    });
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request('POST', '/auth/login', {
      email,
      password,
    });
  }

  async getMe(): Promise<{ user: any }> {
    return this.request('GET', '/auth/me');
  }

  // Folder endpoints
  async getFolders(parentId?: string): Promise<any[]> {
    const path = parentId ? `/folders?parentId=${parentId}` : '/folders';
    return this.request('GET', path);
  }

  async getFolderTree(): Promise<any[]> {
    return this.request('GET', '/folders/tree');
  }

  async getFolder(id: string): Promise<any> {
    return this.request('GET', `/folders/${id}`);
  }

  async createFolder(name: string, parentId?: string): Promise<any> {
    return this.request('POST', '/folders', {
      name,
      ...(parentId && { parentId }),
    });
  }

  async updateFolder(id: string, name?: string, parentId?: string): Promise<any> {
    return this.request('PATCH', `/folders/${id}`, {
      ...(name && { name }),
      ...(parentId !== undefined && { parentId }),
    });
  }

  async deleteFolder(id: string): Promise<void> {
    await this.request('DELETE', `/folders/${id}`);
  }

  // Score endpoints
  async getScores(): Promise<any[]> {
    return this.request('GET', '/scores');
  }

  async getScore(id: string): Promise<any> {
    return this.request('GET', `/scores/${id}`);
  }

  async createScore(
    title: string,
    composer?: string,
    folderId?: string,
    tags?: string[]
  ): Promise<any> {
    return this.request('POST', '/scores', {
      title,
      ...(composer && { composer }),
      ...(folderId && { folderId }),
      ...(tags && { tags }),
    });
  }

  async updateScore(
    id: string,
    title?: string,
    composer?: string,
    tags?: string[]
  ): Promise<any> {
    return this.request('PATCH', `/scores/${id}`, {
      ...(title && { title }),
      ...(composer && { composer }),
      ...(tags && { tags }),
    });
  }

  async deleteScore(id: string): Promise<void> {
    await this.request('DELETE', `/scores/${id}`);
  }

  async getScoreVersions(scoreId: string): Promise<any[]> {
    return this.request('GET', `/scores/${scoreId}/versions`);
  }

  async uploadScoreVersion(
    scoreId: string,
    file: File,
    changeNotes?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeNotes) {
      formData.append('changeNotes', changeNotes);
    }

    const response = await fetch(`${this.baseUrl}/api/v1/scores/${scoreId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        response.statusText,
        errorBody.error || response.statusText
      );
    }

    return response.json();
  }

  async getVersionDownloadUrl(versionId: string): Promise<{ url: string }> {
    return this.request('GET', `/scores/versions/${versionId}/url`);
  }

  async pinScoreVersion(versionId: string): Promise<any> {
    return this.request('PATCH', `/scores/versions/${versionId}/pin`);
  }

  async deleteScoreVersion(versionId: string): Promise<void> {
    await this.request('DELETE', `/scores/versions/${versionId}`);
  }

  // Concert endpoints
  async getConcerts(): Promise<any[]> {
    return this.request('GET', '/concerts');
  }

  async getConcert(id: string): Promise<any> {
    return this.request('GET', `/concerts/${id}`);
  }

  async createConcert(
    title: string,
    date: string,
    location?: string
  ): Promise<any> {
    return this.request('POST', '/concerts', {
      title,
      date,
      ...(location && { location }),
    });
  }

  async updateConcert(
    id: string,
    title?: string,
    date?: string,
    location?: string
  ): Promise<any> {
    return this.request('PATCH', `/concerts/${id}`, {
      ...(title && { title }),
      ...(date && { date }),
      ...(location !== undefined && { location }),
    });
  }

  async deleteConcert(id: string): Promise<void> {
    await this.request('DELETE', `/concerts/${id}`);
  }

  async addPieceToConcert(
    concertId: string,
    scoreId: string,
    versionId: string
  ): Promise<any> {
    return this.request('POST', `/concerts/${concertId}/pieces`, {
      scoreId,
      versionId,
    });
  }

  async removePieceFromConcert(concertId: string, pieceId: string): Promise<void> {
    await this.request('DELETE', `/concerts/${concertId}/pieces/${pieceId}`);
  }

  async reorderPieces(
    concertId: string,
    pieces: Array<{ pieceId: string; order: number }>
  ): Promise<any> {
    return this.request('PATCH', `/concerts/${concertId}/pieces/reorder`, { pieces });
  }
}

export const api = new ApiClient();
