'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppLayout from '@/components/ui/AppLayout';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Profile state
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Group state
  const [group, setGroup] = useState<any>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  const isAdmin = user && user.role === 'ADMIN';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Set initial name
    if (user.name) {
      setName(user.name);
    }

    // Load group if user is in one
    loadGroup();
  }, [user, router]);

  const loadGroup = async () => {
    setGroupLoading(true);
    try {
      const result = await api.getMyGroup();
      setGroup(result.group);
      setGroupError(null);
    } catch (err) {
      // No group is ok
      setGroup(null);
    } finally {
      setGroupLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password if provided
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setProfileError('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setProfileError('Password must be at least 6 characters');
        return;
      }
    }

    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await api.updateProfile(name || undefined, newPassword || undefined);
      setNewPassword('');
      setConfirmPassword('');
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group) return;
    if (confirm(`Remove ${memberName} from the group?`)) {
      setMemberActionLoading(true);
      try {
        await api.updateGroupMembers(group.id, [memberId]);
        loadGroup();
      } catch (err) {
        setGroupError(err instanceof Error ? err.message : 'Failed to remove member');
      } finally {
        setMemberActionLoading(false);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout title="Settings" subtitle="Manage your profile and group settings">
      <div className="space-y-8 max-w-3xl">
        {/* Profile Card */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6">👤 Profile</h3>

          {profileError && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4 mb-4">
              <p className="text-sm">{profileError}</p>
            </div>
          )}

          {profileSuccess && (
            <div className="bg-green-900/20 border border-green-800 text-green-300 rounded-lg p-4 mb-4">
              <p className="text-sm">✓ Profile updated successfully</p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <p className="text-sm text-slate-300 bg-brand-card px-4 py-2 rounded border border-brand-border">
                {user.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                disabled={profileLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <p className="text-sm text-slate-300 bg-brand-card px-4 py-2 rounded border border-brand-border">
                <span className="inline-block bg-indigo-900/50 text-indigo-300 text-xs font-semibold px-2 py-1 rounded border border-indigo-800">
                  {user.role}
                </span>
              </p>
            </div>

            <div className="border-t border-brand-border pt-4">
              <h4 className="font-semibold text-white mb-4">🔐 Change Password</h4>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={profileLoading}
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={profileLoading}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Group Card */}
        {groupLoading ? (
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-brand-card rounded mb-4 w-1/4" />
              <div className="space-y-3">
                <div className="h-4 bg-brand-card rounded" />
                <div className="h-4 bg-brand-card rounded" />
              </div>
            </div>
          </div>
        ) : group ? (
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-4">👥 Group: {group.name}</h3>

            <p className="text-sm text-slate-400 mb-4">
              Admin: <span className="text-white font-medium">{group.admin.name || group.admin.email}</span>
            </p>

            {groupError && (
              <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4 mb-4">
                <p className="text-sm">{groupError}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left py-3 px-4 font-semibold text-white">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Role</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.members.map((member: any) => (
                    <tr key={member.id} className="border-b border-brand-border hover:bg-brand-card transition-colors">
                      <td className="py-3 px-4 text-white">{member.name || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-indigo-900/50 text-indigo-300 text-xs font-semibold px-2 py-1 rounded border border-indigo-800">
                          {member.role}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          {member.id !== user.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                              disabled={memberActionLoading}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                              title="Remove member"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-slate-400">👥 You are not in a group yet</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
