'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

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
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name || user.email}</span>
            <button
              onClick={() => {
                api.setToken(null);
                router.push('/login');
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-2xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile</h3>

          {profileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{profileError}</p>
            </div>
          )}

          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-sm">Profile updated successfully</p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded border border-gray-200">
                {user.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={profileLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded border border-gray-200">
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                  {user.role}
                </span>
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-4">Change Password</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={profileLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={profileLoading}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Group Card */}
        {groupLoading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-2xl">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ) : group ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-4xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Group: {group.name}</h3>

            <p className="text-sm text-gray-600 mb-4">
              Admin: <span className="font-medium">{group.admin.name || group.admin.email}</span>
            </p>

            {groupError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{groupError}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.members.map((member: any) => (
                    <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{member.name || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                          {member.role}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          {member.id !== user.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                              disabled={memberActionLoading}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="Remove member"
                            >
                              🗑
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
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-2xl">
            <p className="text-gray-600">You are not in a group yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
