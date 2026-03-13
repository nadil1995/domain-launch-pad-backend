'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { parseDuration } from '@/lib/utils';
import TagInput from '@/components/ui/TagInput';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const KEY_OPTIONS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm',
];

const GENRE_OPTIONS = [
  'Classical', 'Baroque', 'Romantic', 'Contemporary',
  'Jazz', 'Pop', 'Rock', 'Folk', 'Other',
];

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [duration, setDuration] = useState('');
  const [key, setKey] = useState('');
  const [tempo, setTempo] = useState('');
  const [genre, setGenre] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'text/xml', 'application/xml'];
      const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.xml', '.musicxml'];

      const fileName = selectedFile.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      const isValidType = ALLOWED_TYPES.includes(selectedFile.type) || fileName.endsWith('.musicxml');
      const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

      if (!isValidType && !isValidExtension) {
        setError('Invalid file type. Supported: PDF, MusicXML, PNG, JPG');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!composer.trim()) {
      setError('Artist/Composer is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const durationSeconds = duration ? parseDuration(duration) : undefined;
      if (duration && !durationSeconds) {
        setError('Duration must be in mm:ss format (e.g., 4:33)');
        setLoading(false);
        return;
      }

      // Create the score with metadata
      const scoreResponse = await api.createScore(
        title,
        composer || undefined,
        undefined, // no folder
        tags.length > 0 ? tags : undefined,
        durationSeconds || undefined,
        key || undefined,
        tempo ? parseInt(tempo) : undefined,
        genre || undefined,
        notes || undefined
      );

      // If file is provided, upload it
      if (file) {
        await api.uploadScoreVersion(scoreResponse.id, file);
      }

      // Reset form
      setTitle('');
      setComposer('');
      setDuration('');
      setKey('');
      setTempo('');
      setGenre('');
      setNotes('');
      setTags([]);
      setFile(null);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add song');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-brand-surface border-b border-brand-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">🎵 Add New Song</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Artist *</label>
            <input
              type="text"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="Composer or artist name"
              className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration (mm:ss)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="3:45"
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Key</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                disabled={loading}
              >
                <option value="">Select key</option>
                {KEY_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tempo (BPM)</label>
              <input
                type="number"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="120"
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                disabled={loading}
              >
                <option value="">Select genre</option>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes about this song..."
              rows={3}
              className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
            <TagInput
              tags={tags}
              onChange={setTags}
              disabled={loading}
              placeholder="Add tags to organize your songs..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Audio/Score File (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.xml,.musicxml,.png,.jpg,.jpeg"
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-card file:text-slate-300 file:cursor-pointer hover:file:bg-brand-border transition"
              disabled={loading}
            />
            {file && (
              <p className="text-xs text-slate-400 mt-2">Selected: {file.name}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-brand-border text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-brand-card rounded-lg transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !composer.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
