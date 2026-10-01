import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Flag, Languages, MessageCircle, Pencil, Send, ShieldAlert, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import { blockedWords, translateMap } from '@/lib/demoData';
import { backendConfigured, api } from '@/lib/api';
import { getCommentHistory, getComments, getModerationLogs, getReports, getUser, saveCommentHistory, saveComments, saveModerationLogs, saveReports, type DemoComment } from '@/lib/demoStore';

const LANGS = ['English', 'Hindi', 'Tamil', 'Russian'];
const EDIT_WINDOW = 10 * 60_000;

type SortMode = 'relevant' | 'newest' | 'oldest' | 'liked';

function moderate(text: string, mine: DemoComment[]) {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Write something first.';
  if (normalized.length > 1000) return 'Comment is too long (maximum 1000 characters).';
  if (blockedWords.some(w => normalized.includes(w))) return 'Abusive language detected. Please rewrite the comment.';
  if (/https?:\/\/|www\.|javascript:|data:text\//i.test(normalized)) return 'Malicious or external links are blocked in comments.';
  if (/(.)\1{7,}/.test(normalized) || /[!?.,_\-~]{8,}/.test(normalized)) return 'Repeated special characters or spam patterns detected.';
  if ((normalized.match(/[\u{1F300}-\u{1FAFF}❤️]/gu) || []).length > 8) return 'Repeated emoji flooding is blocked.';
  if (mine.some(c => !c.deleted && c.text.trim().toLowerCase() === normalized)) return 'Duplicate comment blocked.';
  return null;
}

function translate(text: string, to: string) {
  if (to === 'English') return text;
  return translateMap[to]?.[text] || `Translation preview to ${to}: ${text}`;
}

export default function Comments({ videoId }: { videoId: string }) {
  const [items, setItems] = useState<DemoComment[]>([]);
  const [text, setText] = useState('');
  const [lang, setLang] = useState('English');
  const [sort, setSort] = useState<SortMode>('relevant');
  const [replyTo, setReplyTo] = useState<DemoComment | null>(null);
  const [editing, setEditing] = useState<DemoComment | null>(null);
  const [message, setMessage] = useState('');
  const [translateTo, setTranslateTo] = useState('English');
  const [reporting, setReporting] = useState<DemoComment | null>(null);
  const [reportReason, setReportReason] = useState('spam');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [postTimes, setPostTimes] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const local = getComments().filter(c => c.videoId === videoId || ['c1', 'c2', 'c3', 'c4'].includes(c.id));
      setItems(local);
      if (backendConfigured()) {
        try {
          const remote = await api<any[]>(`/tasks/comments/${videoId}`);
          if (active && remote?.length) {
            const normalized = remote.map((c: any) => ({ ...c, id: c.commentId, name: c.username, createdAt: c.createdAt || c.created_at }));
            setItems(normalized);
            saveComments([...normalized, ...getComments().filter(c => c.videoId !== videoId)]);
          }
        } catch { /* zero-config local mode is the fallback */ }
      }
    }
    load();
    return () => { active = false; };
  }, [videoId]);

  const roots = useMemo(() => {
    const base = items.filter(c => c.videoId === videoId || ['c1', 'c2', 'c3', 'c4'].includes(c.id)).filter(c => !c.parentId);
    const copy = [...base];
    if (sort === 'newest') return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === 'oldest') return copy.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    if (sort === 'liked') return copy.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return copy.sort((a, b) => ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)));
  }, [items, sort, videoId]);

  const childrenOf = (id: string) => items.filter(c => c.parentId === id).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const recordModeration = (reason: string, rawText: string) => {
    const logs = getModerationLogs();
    saveModerationLogs([{ at: new Date().toISOString(), action: 'blocked-comment', reason, text: rawText, user: getUser().name }, ...logs]);
  };

  const submit = async () => {
    const now = Date.now();
    const recent = postTimes.filter(t => now - t < 60_000);
    if (recent.length >= 4) setCaptchaRequired(true);
    if (captchaRequired && captcha.trim() !== '7') { setMessage('CAPTCHA required: enter 7 to confirm you are not flooding the thread.'); return; }
    const mine = items.filter(i => i.userId === 'u-demo');
    const reason = moderate(text, mine);
    if (reason) { recordModeration(reason, text); setMessage(reason); return; }
    setPostTimes([...recent, now]);
    const u = getUser();
    const nowIso = new Date().toISOString();
    if (editing) {
      if (editing.userId !== u._id) { setMessage('You can only edit your own comments.'); return; }
      if (Date.now() - new Date(editing.createdAt).getTime() > EDIT_WINDOW) { setMessage('The 10-minute edit window has expired.'); return; }
      const current = items.find(c => c.id === editing.id);
      if (current && editing.version && current.version && editing.version !== current.version) { setMessage('This comment changed elsewhere. Cancel and reload before editing.'); return; }
      const next = items.map(c => c.id === editing.id ? { ...c, text: text.trim(), edited: true, editedAt: nowIso, updatedAt: nowIso, version: (c.version || 1) + 1 } : c);
      setItems(next); saveComments(next); saveCommentHistory([{ commentId: editing.id, userId: u._id, action: 'edited', before: editing.text, after: text.trim(), at: nowIso }, ...getCommentHistory()]);
      if (backendConfigured()) { try { await api(`/tasks/comments/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ userId: u._id, text: text.trim(), version: editing.version || 1 }) }); } catch (e: any) { setMessage(e.message); return; } }
      setEditing(null); setText(''); setMessage('Comment updated and versioned in history.'); return;
    }

    const newComment: DemoComment = { id: `c-${Date.now()}`, userId: u._id, username: u.name.toLowerCase().replace(/\s+/g, '_'), name: u.name, avatar: u.name?.[0] || 'P', avatarUrl: '/avatars/priyanshu.svg', location: u.location, text: text.trim(), createdAt: nowIso, updatedAt: nowIso, edited: false, deleted: false, likes: 0, dislikes: 0, parentId: replyTo?.id || null, language: lang, reports: 0, version: 1, videoId };
    const next = [newComment, ...items]; setItems(next); saveComments(next); saveCommentHistory([{ commentId: newComment.id, userId: u._id, action: 'created', before: '', after: newComment.text, at: nowIso }, ...getCommentHistory()]);
    if (backendConfigured()) { try { await api('/tasks/comments', { method: 'POST', body: JSON.stringify({ commentId: newComment.id, videoId, userId: u._id, username: newComment.username, avatar: newComment.avatar, location: newComment.location, text: newComment.text, language: lang, parentId: newComment.parentId }) }); } catch { /* local state keeps demo usable */ } }
    setText(''); setReplyTo(null); setCaptcha(''); setCaptchaRequired(false); setMessage('Comment posted.');
  };

  const react = (id: string, key: 'likes' | 'dislikes') => { const next = items.map(c => c.id === id ? { ...c, [key]: (c[key] || 0) + 1 } : c); setItems(next); saveComments(next); };

  const remove = async (comment: DemoComment) => {
    if (comment.userId !== 'u-demo') { setMessage('You can only delete your own comments.'); return; }
    if (Date.now() - new Date(comment.createdAt).getTime() > EDIT_WINDOW) { setMessage('The 10-minute delete window has expired.'); return; }
    const next = items.map(c => c.id === comment.id ? { ...c, deleted: true, text: '[deleted by author]', edited: true, editedAt: new Date().toISOString() } : c); setItems(next); saveComments(next); setMessage('Comment deleted; replies remain visible in the thread.');
    if (backendConfigured()) { try { await api(`/tasks/comments/${comment.id}`, { method: 'DELETE', body: JSON.stringify({ userId: 'u-demo' }) }); } catch {} }
  };

  const submitReport = async () => {
    if (!reporting) return;
    const reports = getReports();
    if (reports.some(r => r.commentId === reporting.id && r.userId === 'u-demo')) { setMessage('Duplicate report ignored.'); setReporting(null); return; }
    const record = { id: `r-${Date.now()}`, commentId: reporting.id, userId: 'u-demo', reason: reportReason, status: 'flagged', createdAt: new Date().toISOString() };
    saveReports([record, ...reports]); setItems(items.map(c => c.id === reporting.id ? { ...c, reports: (c.reports || 0) + 1 } : c)); setMessage(`Reported as ${reportReason}. It has been flagged for administrator review.`); setReporting(null);
    if (backendConfigured()) { try { await api('/tasks/comments/report', { method: 'POST', body: JSON.stringify({ commentId: reporting.id, reporterId: 'u-demo', reason: reportReason }) }); } catch {} }
  };

  const startEdit = (c: DemoComment) => { if (c.userId !== 'u-demo') return setMessage('You can only edit your own comments.'); if (Date.now() - new Date(c.createdAt).getTime() > EDIT_WINDOW) return setMessage('The 10-minute edit window has expired.'); setEditing(c); setReplyTo(null); setText(c.text); };

  return <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-lg font-black">Comments</div><div className="mt-1 text-xs text-slate-500">Multilingual · moderated · auditable</div></div><div className="flex flex-wrap items-center gap-2"><Languages size={15} className="text-cyan-300"/><select value={translateTo} onChange={e=>setTranslateTo(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none">{LANGS.map(l=><option key={l} value={l} className="bg-slate-900">Translate to {l}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value as SortMode)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none"><option value="relevant">Most relevant</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="liked">Most liked</option></select><ChevronDown size={14} className="-ml-7 pointer-events-none text-slate-500"/></div></div>
    {message && <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-xs text-cyan-100">{message}</div>}
    {(editing || replyTo) && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-violet-400/10 bg-violet-400/5 px-3 py-2 text-xs text-slate-300"><span>{editing ? `Editing @${editing.username}` : `Replying to @${replyTo?.username}`}</span><button onClick={()=>{setEditing(null);setReplyTo(null);setText('')}} className="ml-auto rounded-lg p-1 hover:bg-white/10"><X size={14}/></button></div>}
    <div className="mt-5 flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 font-black text-slate-950">P</div><div className="min-w-0 flex-1"><textarea maxLength={1000} value={text} onChange={e=>setText(e.target.value)} placeholder={replyTo?`Replying to @${replyTo.username}`:'Add a comment… mention @username'} className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30"/><div className="mt-2 flex flex-wrap items-center gap-2"><select value={lang} onChange={e=>setLang(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 outline-none">{LANGS.map(l=><option key={l} className="bg-slate-900">{l}</option>)}</select><span className="text-[10px] text-slate-600">{text.length}/1000</span>{captchaRequired&&<input value={captcha} onChange={e=>setCaptcha(e.target.value)} inputMode="numeric" className="w-28 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs outline-none" placeholder="CAPTCHA: 7"/>}<button onClick={submit} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950"><Send size={14}/>{editing?'Save edit':'Post comment'}</button></div></div></div>
    <div className="mt-6 space-y-7">{roots.map(c=><CommentItem key={c.id} comment={c} translateTo={translateTo} onLike={id=>react(id,'likes')} onDislike={id=>react(id,'dislikes')} onReply={setReplyTo} onEdit={startEdit} onDelete={remove} onReport={setReporting}>{childrenOf(c.id)}</CommentItem>)}{!roots.length&&<div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No comments yet. Be the first one.</div>}</div>
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4 text-xs text-slate-400"><ShieldAlert size={16} className="mt-0.5 text-amber-300"/><div><div className="font-semibold text-slate-200">Moderation active</div><div className="mt-1 leading-5">Profanity, malicious links, duplicates, emoji flooding, comment bursts and reports are checked before content is accepted. Dislikes never auto-delete comments.</div></div></div>
    {reporting && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl"><div className="flex items-center justify-between"><div className="text-lg font-black">Report comment</div><button onClick={()=>setReporting(null)} className="rounded-xl p-2 text-slate-500 hover:bg-white/5"><X size={17}/></button></div><p className="mt-2 text-xs text-slate-500">Select a reason. The comment will be flagged for admin review.</p><div className="mt-5 grid gap-2">{['spam','harassment','offensive','other'].map(r=><button key={r} onClick={()=>setReportReason(r)} className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${reportReason===r?'bg-cyan-300/10 text-cyan-200':'bg-white/5 text-slate-400'}`}>{r[0].toUpperCase()+r.slice(1)}</button>)}</div><button onClick={submitReport} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950">Submit report</button></div></div>}
  </section>;
}

function CommentItem({ comment, children, translateTo, onLike, onDislike, onReply, onEdit, onDelete, onReport }: { comment: DemoComment; children: DemoComment[]; translateTo: string; onLike: (id:string)=>void; onDislike:(id:string)=>void; onReply:(c:DemoComment)=>void; onEdit:(c:DemoComment)=>void; onDelete:(c:DemoComment)=>void; onReport:(c:DemoComment)=>void }) {
  const text = comment.deleted ? '[deleted by author]' : translate(comment.text, translateTo);
  return <div><div className="group flex gap-3"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10"><img src={comment.avatarUrl || '/avatars/priyanshu.svg'} alt="Profile" className="h-full w-full object-cover"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-white">{comment.username}</span><span className="text-[10px] text-slate-600">{comment.location}</span><span className="text-[10px] text-slate-600">{new Date(comment.createdAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</span>{comment.edited&&<span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">edited</span>}</div><p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${comment.deleted?'italic text-slate-600':'text-slate-300'}`}>{text}</p><div className="mt-2 flex flex-wrap items-center gap-1"><button onClick={()=>onLike(comment.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><ThumbsUp size={14}/>{comment.likes||0}</button><button onClick={()=>onDislike(comment.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><ThumbsDown size={14}/>{comment.dislikes||0}</button><button onClick={()=>onReply(comment)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><MessageCircle size={14}/>Reply</button><button onClick={()=>onReport(comment)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><Flag size={14}/>Report</button>{comment.userId==='u-demo'&&!comment.deleted&&<><button onClick={()=>onEdit(comment)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><Pencil size={14}/>Edit</button><button onClick={()=>onDelete(comment)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><Trash2 size={14}/>Delete</button></>}</div></div></div>{children.length>0&&<div className="ml-12 mt-4 space-y-5 border-l border-white/10 pl-4">{children.map(child=><CommentItem key={child.id} comment={child} children={[]} translateTo={translateTo} onLike={onLike} onDislike={onDislike} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onReport={onReport}/>)}</div>}</div>;
}
