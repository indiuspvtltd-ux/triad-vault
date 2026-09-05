'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabase';

export default function AuthPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Initialize the Next.js router for redirection
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`❌ ${error.message}`);
      } else {
        setMessage('✅ Successfully authenticated! Redirecting to Core...');
        // Instantly redirect to the new dashboard on success
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(`❌ ${error.message}`);
      } else {
        setMessage('✅ Vault provisioned! Check your email for the confirmation link.');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-radial from-[#120a21] to-[#050508] text-white flex flex-col items-center justify-center p-6">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent mb-8 text-center">
          TRIAD VAULT
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Node Identification (Email)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Security Key (Password)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? '⚡ Authenticate Node' : '🚀 Provision Vault')}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-3 bg-black/40 border border-white/10 rounded-lg text-sm text-center text-cyan-300">
            {message}
          </div>
        )}

        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage('');
          }}
          className="w-full mt-6 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {isLogin ? 'Need an account? Provision Node (New User)' : 'Already have an account? Login Portal'}
        </button>
      </div>
    </main>
  );
}