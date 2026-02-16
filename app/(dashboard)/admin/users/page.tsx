'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/auth-context';
import { useAuth } from '@/lib/auth-context';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

export default function UserManagementPage() {
  const { profile: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Deactivate confirm
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast('Failed to load users', 'error');
      return;
    }
    setUsers((data || []) as UserProfile[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Invite user
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);

    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite user');

      toast(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('staff');
      fetchUsers();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setInviting(false);
    }
  }

  // Edit role
  function openEdit(user: UserProfile) {
    setEditUser(user);
    setEditRole(user.role);
    setEditOpen(true);
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: editRole })
      .eq('id', editUser.id);

    if (error) {
      toast('Failed to update role', 'error');
    } else {
      toast(`Updated ${editUser.full_name} to ${editRole}`, 'success');
      setEditOpen(false);
      fetchUsers();
    }
    setSaving(false);
  }

  // Toggle active/inactive
  function openDeactivate(user: UserProfile) {
    setDeactivateUser(user);
    setDeactivateOpen(true);
  }

  async function handleToggleActive() {
    if (!deactivateUser) return;

    const newStatus = !deactivateUser.is_active;
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: newStatus })
      .eq('id', deactivateUser.id);

    if (error) {
      toast('Failed to update user status', 'error');
    } else {
      toast(
        `${deactivateUser.full_name} ${newStatus ? 'activated' : 'deactivated'}`,
        'success',
      );
      fetchUsers();
    }
    setDeactivateOpen(false);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    staff: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">User Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Invite users and manage roles
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
          style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite User
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
                        >
                          {user.full_name
                            ?.split(' ')
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '??'}
                        </div>
                        <span className="text-xs font-medium text-navy">{user.full_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-3 text-right">
                      {user.id !== currentUser?.id && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            title="Edit role"
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeactivate(user)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                              user.is_active
                                ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                            }`}
                          >
                            {user.is_active ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite User" subtitle="Send an email invitation to join the dashboard" size="sm">
        <form onSubmit={handleInvite} className="space-y-5">
          <FormField label="Full Name" required>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="John Doe"
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Role" required>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className={selectClass}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-primary/25"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit User Role" subtitle={editUser?.full_name || ''} size="sm">
        <form onSubmit={handleSaveRole} className="space-y-5">
          <FormField label="Current Email">
            <input type="text" value={editUser?.email || ''} disabled className={inputClass} />
          </FormField>

          <FormField label="Role" required>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className={selectClass}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-primary/25"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Activate Confirm */}
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleToggleActive}
        title={deactivateUser?.is_active ? 'Deactivate User' : 'Activate User'}
        message={
          deactivateUser?.is_active
            ? `Are you sure you want to deactivate ${deactivateUser?.full_name}? They will no longer be able to sign in.`
            : `Are you sure you want to activate ${deactivateUser?.full_name}? They will be able to sign in again.`
        }
        confirmLabel={deactivateUser?.is_active ? 'Deactivate' : 'Activate'}
        variant={deactivateUser?.is_active ? 'danger' : 'default'}
      />
    </div>
  );
}
