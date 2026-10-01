export type Plan = 'Free' | 'Bronze' | 'Silver' | 'Gold';

export const planConfig: Record<Plan, { price: number; yearly: number; dailyDownloads: number; quality: string; watchLimit: string; accent: string; features: string[] }> = {
  Free: {
    price: 0,
    yearly: 0,
    dailyDownloads: 1,
    quality: '720p',
    watchLimit: '2 hrs/day',
    accent: 'slate',
    features: ['Community videos', '720p streaming', '1 download/day', 'Ads'],
  },
  Bronze: {
    price: 99,
    yearly: 999,
    dailyDownloads: 3,
    quality: '1080p',
    watchLimit: '4 hrs/day',
    accent: 'amber',
    features: ['Premium videos', '1080p streaming', '3 downloads/day', 'Fewer ads'],
  },
  Silver: {
    price: 199,
    yearly: 1999,
    dailyDownloads: 7,
    quality: '1440p',
    watchLimit: '8 hrs/day',
    accent: 'cyan',
    features: ['All videos', '1440p streaming', '7 downloads/day', 'Ad-free viewing'],
  },
  Gold: {
    price: 349,
    yearly: 3499,
    dailyDownloads: 20,
    quality: '4K',
    watchLimit: 'Unlimited',
    accent: 'violet',
    features: ['All videos + courses', '4K streaming', '20 downloads/day', 'Priority content'],
  },
};

export const demoVideos = [
  { id: 'v1', title: 'Build a Modern YouTube Clone', channel: 'CodeCraft Lab', views: 128400, duration: '18:42', category: 'Coding', description: 'A practical build covering the ideas behind a modern streaming platform.', color: 'from-cyan-500 via-blue-600 to-violet-700', icon: '⌘', language: 'English' },
  { id: 'v2', title: 'WebRTC Video Calls Explained', channel: 'Realtime Dev', views: 78200, duration: '14:08', category: 'Technology', description: 'Understand signaling, peers, media tracks and reconnection.', color: 'from-violet-500 via-fuchsia-600 to-rose-600', icon: '◉', language: 'English' },
  { id: 'v3', title: 'JavaScript Promises Without the Confusion', channel: 'Frontend Forge', views: 221500, duration: '11:36', category: 'JavaScript', description: 'Async JavaScript explained with practical examples.', color: 'from-amber-400 via-orange-500 to-rose-500', icon: 'JS', language: 'English' },
  { id: 'v4', title: 'MongoDB Data Modeling for Beginners', channel: 'Backend Base', views: 98400, duration: '21:19', category: 'Database', description: 'Design collections, references and indexes for real apps.', color: 'from-emerald-400 via-teal-500 to-cyan-600', icon: 'DB', language: 'English' },
  { id: 'v5', title: 'CSS That Looks Expensive', channel: 'Pixel Foundry', views: 156300, duration: '09:51', category: 'Design', description: 'Small visual tricks that make interfaces feel polished.', color: 'from-pink-500 via-rose-500 to-orange-400', icon: '✦', language: 'English' },
  { id: 'v6', title: 'DSA: Stacks & Queues Visualized', channel: 'Algo Arcade', views: 64200, duration: '16:22', category: 'DSA', description: 'See stack and queue operations as they happen.', color: 'from-indigo-500 via-sky-500 to-cyan-400', icon: '[]', language: 'English' },
  { id: 'v7', title: 'How Login Security Actually Works', channel: 'Secure Stack', views: 110700, duration: '13:44', category: 'Security', description: 'OTP, trusted devices, session history and risk checks.', color: 'from-slate-700 via-slate-800 to-black', icon: '⌁', language: 'English' },
  { id: 'v8', title: 'Design a Better Dark Mode', channel: 'UI Theory', views: 48500, duration: '07:28', category: 'Design', description: 'A simple system for readable dark interfaces.', color: 'from-slate-500 via-indigo-700 to-slate-950', icon: '◐', language: 'English' },
  { id: 'v9', title: 'React State Patterns You Can Actually Use', channel: 'React Room', views: 132800, duration: '19:02', category: 'React', description: 'Clean patterns for forms, async state and UI feedback.', color: 'from-sky-400 via-blue-600 to-indigo-600', icon: 'R', language: 'English' },
];

export const sampleComments = [
  { id: 'c1', userId: 'u-demo', username: 'Priyanshu', name: 'Priyanshu', avatar: 'P', avatarUrl: '/avatars/priyanshu.svg', location: 'Chennai, India', text: 'This architecture makes the pieces much easier to understand 🔥', createdAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(), edited: false, likes: 24, dislikes: 1, parentId: null, language: 'English', reports: 0 },
  { id: 'c2', userId: 'u-ana', username: 'ananya.codes', name: 'Ananya', avatar: 'A', avatarUrl: '/avatars/ananya.svg', location: 'Bengaluru, India', text: 'The WebRTC section finally made signaling click for me.', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), edited: false, likes: 18, dislikes: 0, parentId: null, language: 'English', reports: 0 },
  { id: 'c3', userId: 'u-lee', username: 'lee_dev', name: 'Lee', avatar: 'L', avatarUrl: '/avatars/lee.svg', location: 'Singapore', text: 'Очень полезно! I translated this to English and it still reads naturally.', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), edited: false, likes: 12, dislikes: 0, parentId: null, language: 'Russian', reports: 0 },
  { id: 'c4', userId: 'u-raj', username: 'rajbuilds', name: 'Raj', avatar: 'R', avatarUrl: '/avatars/raj.svg', location: 'Pune, India', text: 'Replying to Priyanshu — the database model is the key part here.', createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(), edited: false, likes: 7, dislikes: 0, parentId: 'c1', language: 'English', reports: 0 },
];

export const translateMap: Record<string, Record<string, string>> = {
  English: {
    'Очень полезно! I translated this to English and it still reads naturally.': 'Very useful! I translated this to English and it still reads naturally.',
    'This architecture makes the pieces much easier to understand 🔥': 'This architecture makes the pieces much easier to understand 🔥',
    'The WebRTC section finally made signaling click for me.': 'The WebRTC section finally made signaling click for me.',
  },
  Hindi: {
    'This architecture makes the pieces much easier to understand 🔥': 'इस आर्किटेक्चर से पूरा सिस्टम समझना बहुत आसान हो गया 🔥',
    'The WebRTC section finally made signaling click for me.': 'WebRTC वाला सेक्शन पढ़कर signaling आखिरकार समझ आ गया।',
    'Очень полезно! I translated this to English and it still reads naturally.': 'बहुत उपयोगी! इसे अंग्रेज़ी में ट्रांसलेट करने पर भी यह स्वाभाविक लगता है।',
  },
  Tamil: {
    'This architecture makes the pieces much easier to understand 🔥': 'இந்த architecture முழு அமைப்பையும் புரிந்துகொள்ள மிகவும் உதவுகிறது 🔥',
    'The WebRTC section finally made signaling click for me.': 'WebRTC பகுதி signaling எப்படி வேலை செய்கிறது என்பதை புரிய வைத்தது.',
    'Очень полезно! I translated this to English and it still reads naturally.': 'மிகவும் பயனுள்ளது! ஆங்கிலத்திற்கு மாற்றிய பிறகும் இது இயல்பாக இருக்கிறது.',
  },
  Russian: {
    'This architecture makes the pieces much easier to understand 🔥': 'Эта архитектура помогает намного легче понять всю систему 🔥',
    'The WebRTC section finally made signaling click for me.': 'Раздел WebRTC наконец помог мне понять signaling.',
  },
};

export const blockedWords = ['idiot', 'stupid', 'hate you', 'abuseword'];
