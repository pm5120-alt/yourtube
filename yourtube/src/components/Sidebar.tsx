import Link from 'next/link';
import { Download, FolderClock, History, Home, MessageSquare, ShieldCheck, Sparkles, Star, Video, WalletCards } from 'lucide-react';
import { useRouter } from 'next/router';
import { useUser } from '@/lib/AuthContext';

export default function Sidebar({ mobile=false, onNavigate }: { mobile?: boolean; onNavigate?: ()=>void }) {
  const router = useRouter(); const { user } = useUser();
  const links = [
    ['/','Home',Home],['/subscriptions','Membership',WalletCards],['/downloads','Downloads',Download],['/security','Security',ShieldCheck],['/calls','Video Calls',Video],['/moderation','Moderation',MessageSquare],['/upload','Upload Studio',Sparkles],['/history','History',History],['/watch-later','Watch later',FolderClock],['/liked','Liked videos',Star]
  ] as any[];
  return <aside className={`${mobile ? 'block w-72' : 'hidden w-64 lg:block'} shrink-0 border-r border-white/10 bg-slate-950/50 px-3 py-5`}>
    <div className="px-3 pb-3 text-[11px] uppercase tracking-[.25em] text-slate-600">Your library</div>
    <nav className="space-y-1">{links.map(([href,label,Icon])=>{const active=router.pathname===href||(href!=='/'&&router.pathname.startsWith(href));return <Link key={href} href={href} onClick={onNavigate} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${active?'bg-white text-slate-950 shadow-lg shadow-white/5':'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={18}/><span>{label}</span></Link>})}</nav>
    <div className="mt-6 rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-blue-500/5 to-violet-500/10 p-4"><div className="flex items-center gap-2 text-xs font-bold text-cyan-300"><Sparkles size={14}/> Training build</div><p className="mt-2 text-xs leading-5 text-slate-400">Six internship modules are integrated into one YouTube-style application.</p><Link href="/subscriptions" onClick={onNavigate} className="mt-3 inline-flex text-xs font-semibold text-white hover:text-cyan-300">Explore plans →</Link></div>
    {user&&<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400"><div className="font-semibold text-white">{user.channelname}</div><div className="mt-1">{user.location}</div></div>}
  </aside>
}
