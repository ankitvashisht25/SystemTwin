import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, FolderOpen, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export default function UserMenu({ onOpenSaved }: { onOpenSaved: () => void }) {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-600 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
          {initials}
        </div>
        <span className="text-xs text-gray-300 hidden sm:inline max-w-[100px] truncate">{user.name}</span>
        <ChevronDown size={12} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface-800 border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => { onOpenSaved(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-surface-700 hover:text-white transition-colors"
            >
              <FolderOpen size={13} />
              My Architectures
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-surface-700 hover:text-white transition-colors"
              onClick={() => { useUIStore.getState().setShowSettings(true); setOpen(false); }}
            >
              <User size={13} />
              Profile
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-surface-700 hover:text-white transition-colors"
              onClick={() => { useUIStore.getState().setShowSettings(true); setOpen(false); }}
            >
              <Settings size={13} />
              Settings
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
