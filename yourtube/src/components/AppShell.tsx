import Header from './Header';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/AuthContext';
import { getUser, saveUser } from '@/lib/demoStore';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen,setMobileOpen]=useState(false); const { user }=useUser();
  useEffect(()=>{if(!user)return;const h=Number(new Intl.DateTimeFormat('en-IN',{hour:'2-digit',hour12:false,timeZone:'Asia/Kolkata'}).format(new Date()));const existing=getUser();if(!localStorage.getItem('yourtube-theme-selected')){const theme=h>=5&&h<12?'light':'dark';saveUser({...existing,theme});document.documentElement.classList.toggle('light-mode',theme==='light')}},[user]);
  return <div className="min-h-screen bg-[#060814] text-slate-100"><Header onMenu={()=>setMobileOpen(v=>!v)}/><div className="mx-auto flex max-w-[1500px]"><Sidebar/>{mobileOpen&&<div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={()=>setMobileOpen(false)}><div className="h-full bg-slate-950 p-3" onClick={e=>e.stopPropagation()}><Sidebar mobile onNavigate={()=>setMobileOpen(false)}/></div></div>}<main className="min-w-0 flex-1">{children}</main></div></div>
}
