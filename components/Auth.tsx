
import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, isGCPConfigured } from '../services/googleCloud';

interface AuthProps {
  onContinueAsGuest: () => void;
}

const Auth: React.FC<AuthProps> = ({ onContinueAsGuest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!auth || !isGCPConfigured) {
      setError("Firebase is not configured. Please add your VITE_FIREBASE_API_KEY.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed. Check your Firebase API key permissions.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl mb-8 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Decision Council</h2>
        <p className="text-slate-400 mb-10 text-sm">{UI_CONTENT.APP_TAGLINE}</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-left">
            <div className="font-bold mb-1">Configuration Error</div>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading || !isGCPConfigured}
            className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                Sign in with Account
              </>
            )}
          </button>

          <button
            onClick={onContinueAsGuest}
            className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 border border-slate-700"
          >
            Continue as Guest
          </button>
        </div>

        {!isGCPConfigured && (
          <p className="mt-8 text-[10px] text-amber-500/70 uppercase font-bold tracking-widest leading-relaxed">
            Firebase unconfigured. Cloud sync disabled.
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
