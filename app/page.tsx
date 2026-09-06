'use client';

import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  // Authentication & User State
  const [isAuth, setIsAuth] = useState(false);
  const [nickname, setNickname] = useState('');
  
  // File Configuration State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  
  // Upload Metrics State
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('0.00');
  const [statusText, setStatusText] = useState('');
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  // 1. Simple Gatekeeper (No Google OAuth required)
  useEffect(() => {
    const savedName = localStorage.getItem('vaultNickname');
    if (savedName) {
      setNickname(savedName);
      setIsAuth(true);
    }
  }, []);

  // 2. Login Flow (Saves name and unlocks dashboard)
  const handleLogin = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname first!');
      return;
    }
    
    localStorage.setItem('vaultNickname', nickname);
    setIsAuth(true);
  };

  // 3. Main Upload Handler (Now points to our backend API)
  const executeUpload = async () => {
    if (!videoFile) return;

    setUploading(true);
    setProgress(25); // Simulated progress while sending to server
    setSpeed('Routing...');
    setStatusText('Transmitting to secure backend...');

    try {
      const baseName = customName.trim() || videoFile.name.replace(/\.[^/.]+$/, "");

      // Package the files to send to your Next.js server
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      formData.append('baseName', baseName);
      formData.append('nickname', nickname);

      // Send to the backend route we are going to build next
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Backend upload failed');
      }

      setProgress(100);
      setStatusText('Transfer Complete!');

      // Trigger Celebration
      const messages = [
        `Woah ${nickname}, that's fast! 🚀`,
        `That's good, ${nickname}! 🎉`,
        `Good one, ${nickname}! 🔥`,
        `Nailed it, ${nickname}! 🎯`
      ];
      setCelebrationMsg(messages[Math.floor(Math.random() * messages.length)]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 6000); // Hide after 6s

      // Reset form
      setVideoFile(null);
      setThumbnailFile(null);
      setCustomName('');
      setTimeout(() => setStatusText(''), 2000);
      
    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatusText(`❌ Failed: ${err.message}`);
      setProgress(0);
    }
    setUploading(false);
  };

  // --- UI RENDER: LOGIN SCREEN ---
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white p-8">
        <div className="max-w-md w-full bg-[#18181f] border border-gray-800 p-8 rounded-xl text-center shadow-2xl">
          <h1 className="text-3xl font-bold mb-6">Enter The Vault</h1>
          <input
            type="text"
            placeholder="Enter your nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-3 mb-6 text-white focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- UI RENDER: DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-[#0f0f13] text-white p-8 font-sans relative overflow-hidden">
      
      {/* Celebration Popup */}
      {showCelebration && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-[0_0_40px_rgba(34,197,94,0.6)] z-50 animate-bounce">
          {celebrationMsg}
        </div>
      )}

      <div className="max-w-3xl mx-auto mt-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {nickname}</h1>
          <p className="text-gray-400 text-sm">Configure your asset and initialize transfer.</p>
        </div>

        <div className="bg-[#13131a] border border-gray-800 rounded-xl p-8 shadow-xl">
          
          {/* Form Inputs */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Custom File Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Leave blank to use original name"
                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Video Thumbnail (Image)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Video Asset (MP4 Only)</label>
              <input
                type="file"
                accept="video/mp4"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={executeUpload}
            disabled={!videoFile || uploading}
            className={`w-full py-4 rounded-md font-bold text-lg transition-all ${
              !videoFile ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : uploading ? 'bg-blue-800 text-white cursor-wait' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
            }`}
          >
            {uploading ? 'TRANSMITTING...' : 'INITIALIZE TRANSFER'}
          </button>

          {/* Upload Metrics Terminal */}
          {uploading && (
            <div className="mt-8 bg-black p-6 rounded border border-gray-800 font-mono text-sm">
              <div className="flex justify-between text-yellow-400 mb-2">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              
              <div className="w-full bg-gray-900 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="bg-yellow-400 h-2.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              
              <div className="flex justify-between text-gray-500">
                <span>Status: {speed}</span>
                <span>Target: Secure Backend</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
