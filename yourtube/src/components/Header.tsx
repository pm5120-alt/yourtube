import Link from 'next/link';
import { Bell, LogOut, Menu, Plus, Search, ShieldCheck, Sparkles, UserCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/lib/AuthContext';

export default function Header({ onMenu }: { onMenu?: () => void }) {
  const { user, login, logout } = useUser();
  const [q, setQ] = useState('');
  const router = useRouter();
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); };
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl text-white">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 lg:px-6">
        <button onClick={onMenu} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden"><Menu size={21}/></button>
        <Link href="/" className="group flex items-center gap-3 min-w-fit">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-[0_0_30px_rgba(34,211,238,.25)] group-hover:scale-105 transition">
            <Sparkles size={20}/>
          </div>
          <div><div className="font-black tracking-tight">YourTube<span className="text-cyan-300">.lab</span></div><div className="text-[10px] uppercase tracking-[.24em] text-slate-500">training build</div></div>
        </Link>
        <form onSubmit={submit} className="mx-auto hidden w-full max-w-2xl items-center rounded-2xl border border-white/10 bg-white/5 md:flex">
          <Search size={18} className="ml-4 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search videos, channels, topics..." className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-500"/><button className="mr-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">Search</button>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/moderation" title="Moderation center" className="hidden rounded-xl p-2 text-slate-300 hover:bg-white/10 sm:block"><ShieldCheck size={20}/></Link>
          <Link href="/calls" title="Video calls" className="hidden rounded-xl p-2 text-slate-300 hover:bg-white/10 sm:block">🎥</Link>
          <button className="rounded-xl p-2 text-slate-300 hover:bg-white/10"><Bell size={20}/></button>
          {user ? <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 pl-2 pr-1 py-1"><div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 font-bold text-slate-950">{user.name?.[0] || 'U'}</div><span className="hidden max-w-28 truncate text-xs font-semibold lg:block">{user.name}</span><button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={15}/></button></div> : <button onClick={login} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-950 shadow-sm hover:bg-cyan-50"><UserCircle size={17}/> Demo sign in</button>}
        </div>
      </div>
    </header>
  );
}
