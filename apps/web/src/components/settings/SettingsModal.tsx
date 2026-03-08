import { useState } from 'react';
import { X, User, Palette, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiFetch } from '../../lib/api';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<'profile' | 'preferences' | 'account'>('profile');
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSaveProfile = async () => {
    await updateProfile({ name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess(false);
    try {
      const res = await apiFetch('/api/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        setPwSuccess(true);
        setCurrentPw('');
        setNewPw('');
      } else {
        const data = await res.json();
        setPwError(data.error || 'Failed to change password');
      }
    } catch {
      setPwError('Failed to connect to server');
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
    { id: 'account' as const, label: 'Account', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 border border-border rounded-lg w-[560px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar tabs */}
          <div className="w-40 border-r border-border p-2 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${
                  tab === t.id
                    ? 'bg-accent-blue/15 text-accent-blue'
                    : 'text-gray-400 hover:text-white hover:bg-surface-700'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {tab === 'profile' && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Profile
                </h3>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-surface-900 border border-border rounded px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-700 border border-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-1.5 bg-accent-blue text-white text-xs rounded hover:bg-accent-blue/80"
                >
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </>
            )}

            {tab === 'preferences' && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Canvas Preferences
                </h3>
                <p className="text-xs text-gray-500">
                  Canvas preferences will be added in a future update.
                </p>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-4">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    ['Ctrl+Z', 'Undo'],
                    ['Ctrl+Shift+Z', 'Redo'],
                    ['Ctrl+S', 'Save architecture'],
                    ['Ctrl+E', 'Toggle export modal'],
                    ['Escape', 'Close modal / Deselect node'],
                    ['Backspace / Delete', 'Remove selected node'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-400">{desc}</span>
                      <kbd className="px-2 py-0.5 bg-surface-700 border border-border rounded text-gray-300 font-mono">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'account' && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Change Password
                </h3>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full bg-surface-700 border border-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full bg-surface-700 border border-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
                {pwError && <p className="text-xs text-red-400">{pwError}</p>}
                {pwSuccess && <p className="text-xs text-green-400">Password changed successfully</p>}
                <button
                  onClick={handleChangePassword}
                  disabled={!currentPw || !newPw || newPw.length < 6}
                  className="px-4 py-1.5 bg-accent-blue text-white text-xs rounded hover:bg-accent-blue/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Change Password
                </button>

                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-6">
                  Danger Zone
                </h3>
                <p className="text-xs text-gray-500">Account deletion is not yet available.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
