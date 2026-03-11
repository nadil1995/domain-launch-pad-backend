'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Folder } from '@/lib/types';

interface UploadModalProps {
  folders: Folder[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ folders, onClose, onSuccess }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'uploading'>('form');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // File type validation
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

    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('uploading');

    try {
      // Step 1: Create the score
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const scoreResponse = await api.createScore(
        title,
        composer || undefined,
        folderId || undefined,
        tags.length > 0 ? tags : undefined
      );

      // Step 2: Upload the file
      await api.uploadScoreVersion(scoreResponse.id, file);

      // Success!
      setTitle('');
      setComposer('');
      setFolderId('');
      setTagsInput('');
      setFile(null);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('form');
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
          <h2 className="text-2xl font-bold text-white">📤 Upload Score</h2>
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

          {step === 'form' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Moonlight Sonata"
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Composer
                </label>
                <input
                  type="text"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="e.g., Ludwig van Beethoven"
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Folder
                </label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={loading}
                >
                  <option value="" className="bg-brand-card text-white">Root (no folder)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id} className="bg-brand-card text-white">
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g., classical, piano, romantic"
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  File *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.xml,.musicxml,.png,.jpg,.jpeg"
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition file:text-slate-300 file:bg-brand-border file:border-0 file:px-2 file:py-1 file:rounded"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Supported: PDF, MusicXML, PNG, JPG
                </p>
                {file && <p className="text-sm text-green-400 mt-2">✓ {file.name}</p>}
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
                  disabled={loading || !title.trim() || !file}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="inline-block">
                <div className="animate-spin">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              </div>
              <p className="mt-4 text-slate-400">Uploading your score...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
