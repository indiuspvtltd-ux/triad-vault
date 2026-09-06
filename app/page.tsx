'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  // 1. Initialize Session & Retrieve Data on Mount
  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Capture the token from a fresh login, or grab it from memory if the page was refreshed
      const token = session?.provider_token || sessionStorage.getItem('googleDriveToken');
      
      if (token) {
        sessionStorage.setItem('googleDriveToken', token);
        setIsAuth(true);
      }

      const savedName = localStorage.getItem('vaultNickname');
      if (savedName) setNickname(savedName);
    };
    
    initializeSession();
  }, []);

  // 2. Login Flow
  const handleLogin = async () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname first!');
      return;
    }
    
    localStorage.setItem('vaultNickname', nickname);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/drive',
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) console.error('Auth Error:', error.message);
  };

  // 3. Reusable Drive Upload Function (Used for both Video and Thumbnail)
  const uploadToDrive = async (file: File, finalName: string, token: string) => {
    const metadata = {
      name: finalName,
      parents: ['1CFgz4R75u7eq6k9dn9abeRYLfKkWlJ3W'], 
    };

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': file.size.toString(),
        'X-Upload-Content-Type': file.type || 'application/octet-stream',
      },
      body: JSON.stringify(metadata),
    });

    if (!initRes.ok) throw new Error(`Failed to open pipeline for ${file.name}`);
    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new Error('No upload URL returned.');

    const chunkSize = 1024 * 1024; // 1 MB chunks
    let start = 0;
    const startTime = Date.now();

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Range': `bytes ${start}-${end - 1}/${file.size}` },
        body: chunk,
      });

      if (!uploadRes.ok && uploadRes.status !== 308) {
        throw new Error(`Upload failed at chunk ${start}-${end}`);
      }

      start = end;
      
      // Calculate speed and progress
      const currentProgress = Math.round((start / file.size) * 100);
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const currentSpeed = elapsedSeconds > 0 ? ((start / (1024 * 1024)) / elapsedSeconds).toFixed(2) : '0.00';
      
      setProgress(currentProgress > 100 ? 100 : currentProgress);
      setSpeed(currentSpeed);
    }
  };

  // 4. Main Upload Handler
  const executeUpload = async () => {
    if (!videoFile) return;
    const token = sessionStorage.getItem('googleDriveToken');
    if (!token) {
      alert('Your Google session expired. Please refresh and log in again.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setSpeed('0.00');

    try {
      const baseName = customName.trim() || videoFile.name.replace(/\.[^/.]+$/, "");

      // Upload Thumbnail if selected
      if (thumbnailFile) {
        setStatusText('Uploading Thumbnail...');
        const thumbExt = thumbnailFile.name.split('.').pop();
        await uploadToDrive(thumbnailFile, `${baseName}-thumbnail.${thumbExt}`, token);
      }

      // Upload Video
      setStatusText('Transmitting Video...');
      await uploadToDrive(videoFile, `${baseName}.mp4`, token);

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
      setStatusText('');
      
    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatusText(`❌ Failed: ${err.message}`);
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
            Connect Google Drive
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
                <span>Speed: {speed} MB/s</span>
                <span>Target: Google Drive</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}