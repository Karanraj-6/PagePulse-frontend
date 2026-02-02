import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

type AuthMode = 'signup' | 'login';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, signup, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await signup(username, email, password);
      } else {
        await login(email, password);
      }
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div 
            className="absolute inset-0 bg-cover bg-center opacity-60 blur-sm scale-105"
            style={{ backgroundImage: 'url(/src/assets/lp.jpg)' }}
         ></div>

         <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/20 to-black/90"></div>
      </div>

      {/* ================= BACK BUTTON ================= */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-8 left-8 z-20 text-zinc-400 hover:text-[#d4af37] transition-all flex items-center gap-2 group"
      >
        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-[#d4af37]/50 transition-colors">
            <ArrowLeft className="w-10 h-10" />
        </div>
      </button>

      

      {/* ================= MAIN CARD ================= */}
      <div 
        className="relative z-10 w-full max-w-lg bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-500 ease-in-out"
        // FIXED: Inline style forces the gap you need
        style={{ padding: '60px 50px' }}
      > 
      {/* Error Message */}
        {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium text-center animate-pulse" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                {error}
            </div>
        )}

       <h1 className="text-4xl font-bold text-white text-center mb-30 tracking-tight" style={{ marginBottom: '2rem' }}>
            {isLogin ? 'Login' : 'Sign Up'}
        </h1>
        
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-black/60 p-1 mb-8 rounded-xl border border-white/5 h-14 relative" >
             {/* Sliding Background Indicator */}
             <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#d4af37] rounded-lg shadow-md transition-all duration-500 ease-in-out ${
                    isLogin ? 'left-1' : 'left-[calc(50%+4px)]'
                }`}
             ></div>

            <button
                onClick={() => setMode('login')}
                className={`relative z-10 h-full text-base font-bold rounded-lg transition-colors duration-300 ${
                    isLogin ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Login
            </button>
            <button
                onClick={() => setMode('signup')}
                className={`relative z-10 h-full text-base font-bold rounded-lg transition-colors duration-300 ${
                    !isLogin ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Sign Up
            </button>
        </div>

        

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* USERNAME FIELD (Collapsible) */}
            <div 
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    !isLogin ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="space-y-1 pb-4">
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 z-10 pointer-events-none" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required={!isLogin}
                                className="w-full bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                                style={{ height: '56px', paddingLeft: '3.5rem', paddingRight: '1rem', fontSize: '16px' }}
                                placeholder="username"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* EMAIL FIELD (Always Visible) */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Email</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 z-10 pointer-events-none" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                        style={{ height: '56px', paddingLeft: '3.5rem', paddingRight: '1rem', fontSize: '16px' }}
                        placeholder="name@example.com"
                    />
                </div>
            </div>

            {/* PASSWORD FIELD (Always Visible) */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 z-10 pointer-events-none" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                        style={{ height: '56px', paddingLeft: '3.5rem', paddingRight: '3.5rem', fontSize: '16px' }}
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer z-20"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* CONFIRM PASSWORD FIELD (Collapsible) */}
            <div 
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    !isLogin ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="space-y-1 pt-4">
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 z-10 pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required={!isLogin}
                                className="w-full bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                                style={{ height: '56px', paddingLeft: '3.5rem', paddingRight: '1rem', fontSize: '16px' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-[#d4af37] text-black hover:bg-[#b8960c] text-lg font-bold shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ height: '3rem', marginTop: '2rem' }}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        isLogin ? 'Login' : 'Create Account'
                    )}
                </Button>
            </div>
            
        </form>
      </div>
    </div>
  );
};

export default AuthPage;