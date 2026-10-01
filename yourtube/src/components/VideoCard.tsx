import Link from 'next/link';
import { MoreVertical, Play, Users } from 'lucide-react';
import type { ReactNode } from 'react';
export default function VideoCard({video,badge}:{video:any,badge?:ReactNode}) {
 return <Link href={`/watch/${video.id}`} className="group block">
   <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-xl transition duration-300 group-hover:-translate-y-0.5 group-hover:border-cyan-400/20">
     <img src={`/thumbs/${video.id}.svg`} className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100" alt=""/>
     <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent"/>
     <div className="absolute bottom-3 left-3 flex items-center gap-2"><span className="rounded-lg bg-black/70 px-2 py-1 text-[11px] font-bold">{video.duration}</span>{badge}</div>
     <div className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur group-hover:opacity-100"><Play size={15} fill="currentColor"/></div>
   </div>
   <div className="mt-3 flex gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${video.color} text-xs font-black`}>{video.channel[0]}</div><div className="min-w-0 flex-1"><div className="line-clamp-2 text-sm font-semibold leading-5 text-white">{video.title}</div><div className="mt-1 text-xs text-slate-500">{video.channel}</div><div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600"><span>{Intl.NumberFormat('en-IN',{notation:'compact'}).format(video.views)} views</span><span>•</span><span>{video.category}</span></div></div><MoreVertical size={17} className="text-slate-600"/></div>
 </Link>
}
