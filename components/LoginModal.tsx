import React from 'react';
import { signInWithGoogle } from '../firebaseConfig';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please check your internet connection or try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-6">
            AI
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Sign In With Google</h2>
          <p className="text-slate-400 mb-8">Sign in to save your industrial trips, manage photo albums, and access your plans from any device.</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-transform active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign In with Google
          </button>
          
          <p className="mt-6 text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};