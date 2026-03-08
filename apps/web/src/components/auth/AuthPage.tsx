import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, register, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(email, name, password);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
  };

  return (
    <div className="min-h-screen bg-[#060a13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-[400px] relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit' }}>
            System<span className="text-cyan-400">Twin</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#0a0f1a]/80 border border-white/[0.06] rounded-2xl p-7 backdrop-blur-xl shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            {mode === 'login' ? 'Sign in to access your infrastructure lab' : 'Start building your infrastructure twin'}
          </p>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/15 text-xs text-red-400">
                  <AlertCircle size={13} />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name field (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[11px] text-gray-500 mb-1.5 font-medium">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required={mode === 'register'}
                      className="w-full bg-[#0d1320] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5 font-medium">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#0d1320] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter password'}
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  className="w-full bg-[#0d1320] border border-white/[0.06] rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/15"
              style={{ fontFamily: 'Outfit' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-xs text-gray-600 mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={switchMode} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-800 mt-6 font-mono">
          Infrastructure Architecture Lab
        </p>
      </motion.div>
    </div>
  );
}
