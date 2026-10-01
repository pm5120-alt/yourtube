import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, Download, Flame, Gem, MessageCircle, ShieldCheck, Sparkles, Video } from 'lucide-react';
import Link from 'next/link';
import VideoCard from '@/components/VideoCard';
import { demoVideos, planConfig, type Plan } from '@/lib/demoData';
import { getUser, currentPlan, DEFAULT_DEMO_USER } from '@/lib/demoStore';

const taskCards = [
  { label: 'Task 1', title: 'Smart comments', note: 'Multilingual + moderation', icon: MessageCircle },
  { label: 'Task 2', title: 'Controlled downloads', note: null, icon: Download },
  { label: 'Task 3', title: 'Memberships', note: null, icon: Gem },
  { label: 'Task 6', title: 'Realtime calls', note: 'WebRTC-ready room', icon: Video },
] as const;

export default function Home() {
  const [category, setCategory] = useState('All');
  const [user, setUser] = useState(DEFAULT_DEMO_USER);

  useEffect(() => setUser(getUser()), []);

  const cats = ['All', 'Coding', 'Technology', 'JavaScript', 'Database', 'Design', 'DSA', 'Security', 'React'];
  const videos = useMemo(
    () => (category === 'All' ? demoVideos : demoVideos.filter(v => v.category === category)),
    [category]
  );
  const plan = currentPlan(user) as Plan;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-400/10 via-blue-500/5 to-violet-500/10 p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
            <Sparkles size={13} /> Internship build · YourTube Lab
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            A YouTube-style platform, upgraded for real-world features.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Watch, comment, download, subscribe, track security, and jump into a real-time call — all inside the training project.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/watch/v1" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-50">
              Start watching <ArrowRight size={16} />
            </Link>
            <Link href="/subscriptions" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
              <Gem size={16} /> View plans
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {taskCards.map(card => {
          const Icon = card.icon;
          const note =
            card.note ??
            (card.label === 'Task 2'
              ? `${planConfig[plan].dailyDownloads}/day quota`
              : `${plan} plan active`);

          return (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2 text-cyan-300">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[.2em] text-slate-600">{card.label}</div>
                  <div className="text-sm font-bold text-white">{card.title}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">{note}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === c ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>

      <section className="mt-12 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex items-center gap-2 text-cyan-300"><Flame size={17} /><span className="text-sm font-bold">Build note</span></div>
          <p className="mt-3 text-sm leading-6 text-slate-400">The visual layer intentionally keeps the familiar YouTube feed structure while adding a small original neon-lab aesthetic.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex items-center gap-2 text-violet-300"><ShieldCheck size={17} /><span className="text-sm font-bold">Security demo</span></div>
          <p className="mt-3 text-sm leading-6 text-slate-400">Try Security and Moderation from the sidebar to see the audit logs, OTP flow and review queue.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex items-center gap-2 text-amber-300"><Clock3 size={17} /><span className="text-sm font-bold">Evaluation-friendly</span></div>
          <p className="mt-3 text-sm leading-6 text-slate-400">Every task is exposed as a visible workflow so reviewers can test the feature instead of hunting through the codebase.</p>
        </div>
      </section>
    </div>
  );
}
