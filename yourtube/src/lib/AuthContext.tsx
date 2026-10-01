import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getUser, saveUser, type DemoUser } from './demoStore';

const AuthContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('yourtube-user');
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const login = () => {
    const now = new Date();
    const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(now));
    const existing = getUser();
    const autoTheme = hour >= 5 && hour < 12 ? 'light' : 'dark';
    const selected = localStorage.getItem('yourtube-theme-selected') === '1';
    const next = { ...existing, theme: selected ? existing.theme : autoTheme };
    saveUser(next); setUser(next);
    document.documentElement.classList.toggle('light-mode', next.theme === 'light');
  };

  const updateUser = (patch: Partial<DemoUser>) => {
    const current = getUser();
    const next = { ...current, ...patch };
    saveUser(next); setUser(next);
  };

  const logout = () => { localStorage.removeItem('yourtube-user'); setUser(null); };
  const value = useMemo(() => ({ user, login, logout, updateUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUser = () => useContext(AuthContext);
