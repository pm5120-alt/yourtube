import { demoVideos, planConfig, sampleComments, type Plan } from './demoData';

export type DemoUser = {
  _id: string;
  name: string;
  email: string;
  image: string;
  channelname: string;
  location: string;
  preferredLanguage: string;
  plan: Plan;
  subscriptionStart: string | null;
  subscriptionExpiry: string | null;
  theme: 'light' | 'dark';
};

export type DemoComment = {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  location: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  editedAt?: string;
  deleted?: boolean;
  likes: number;
  dislikes: number;
  parentId: string | null;
  language: string;
  reports?: number;
  version?: number;
  videoId: string;
};

const KEYS = {
  user: 'yourtube-user', comments: 'yourtube-comments', reactions: 'yourtube-reactions', downloads: 'yourtube-downloads', payments: 'yourtube-payments', reports: 'yourtube-reports', history: 'yourtube-login-history', otp: 'yourtube-otp', trusted: 'yourtube-trusted-devices', progress: 'yourtube-progress', preferences: 'yourtube-preferences', moderation: 'yourtube-moderation', callMessages: 'yourtube-call-messages', watchComplete: 'yourtube-watch-complete', commentHistory: 'yourtube-comment-history',
};

export function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}
export function write<T>(key: string, value: T) { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value)); }

export const DEFAULT_DEMO_USER: DemoUser = { _id: 'u-demo', name: 'Priyanshu', email: 'priyanshu@demo.local', image: '', channelname: 'Priyanshu Builds', location: 'Chennai, India', preferredLanguage: 'English', plan: 'Free', subscriptionStart: null, subscriptionExpiry: null, theme: 'dark' };

export function getUser(): DemoUser {
  const existing = read<DemoUser | null>(KEYS.user, null);
  if (existing) return normalizeUser(existing);
  return { ...DEFAULT_DEMO_USER };
}

export function normalizeUser(user: DemoUser): DemoUser {
  if (user.plan !== 'Free' && user.subscriptionExpiry && new Date(user.subscriptionExpiry).getTime() <= Date.now()) {
    const next = { ...user, plan: 'Free' as Plan, subscriptionStart: null, subscriptionExpiry: null };
    saveUser(next);
    return next;
  }
  return user;
}
export function saveUser(user: DemoUser) { write(KEYS.user, user); }
export function getComments(): DemoComment[] { return read<DemoComment[]>(KEYS.comments, sampleComments.map(c => ({ ...c, version: 1 } as DemoComment))); }
export function saveComments(comments: DemoComment[]) { write(KEYS.comments, comments); }
export function getDownloads() { return read<any[]>(KEYS.downloads, []); }
export function saveDownloads(items: any[]) { write(KEYS.downloads, items); }
export function getPayments() { return read<any[]>(KEYS.payments, []); }
export function savePayments(items: any[]) { write(KEYS.payments, items); }
export function getReports() { return read<any[]>(KEYS.reports, []); }
export function saveReports(items: any[]) { write(KEYS.reports, items); }
export function getLoginHistory() { return read<any[]>(KEYS.history, []); }
export function saveLoginHistory(items: any[]) { write(KEYS.history, items); }
export function getTrustedDevices() { return read<any[]>(KEYS.trusted, []); }
export function saveTrustedDevices(items: any[]) { write(KEYS.trusted, items); }
export function getProgress(): Record<string, number> { return read<Record<string, number>>(KEYS.progress, {}); }
export function saveProgress(value: Record<string, number>) { write(KEYS.progress, value); }
export function getModerationLogs() { return read<any[]>(KEYS.moderation, []); }
export function saveModerationLogs(items: any[]) { write(KEYS.moderation, items); }
export function getCommentHistory() { return read<any[]>(KEYS.commentHistory, []); }
export function saveCommentHistory(items: any[]) { write(KEYS.commentHistory, items); }
export function getCallMessages(room: string) { return read<any[]>(`${KEYS.callMessages}:${room}`, []); }
export function saveCallMessages(room: string, items: any[]) { write(`${KEYS.callMessages}:${room}`, items); }

export function isActiveSubscription(user: DemoUser) { return user.plan === 'Free' || (!!user.subscriptionExpiry && new Date(user.subscriptionExpiry).getTime() > Date.now()); }
export function currentPlan(user: DemoUser): Plan { return normalizeUser(user).plan; }
export function todayKey() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); }
export function downloadUsage(userId: string) { return getDownloads().filter(d => d.userId === userId && d.status === 'completed' && d.downloadDate?.slice(0, 10) === todayKey()).length; }

export function canDownload(videoId: string, user: DemoUser) {
  const plan = currentPlan(user); const config = planConfig[plan]; const downloads = getDownloads();
  const existing = downloads.find(d => d.userId === user._id && d.videoId === videoId && ['completed', 'downloading', 'started'].includes(d.status) && new Date(d.downloadDate || d.downloadTimestamp).getTime() > Date.now() - 24 * 60 * 60_000);
  if (existing) return { ok: false, reason: 'This video was already downloaded within the last 24 hours and will not consume another quota slot.' };
  if (downloadUsage(user._id) >= config.dailyDownloads) return { ok: false, reason: `Your ${plan} plan has reached today’s ${config.dailyDownloads}-download limit.` };
  if (plan === 'Free' && videoId === 'v4') return { ok: false, reason: 'This premium video needs a paid plan.' };
  return { ok: true, reason: '' };
}

export function formatBytes(bytes: number) { if (!Number.isFinite(bytes)) return '—'; const units = ['B','KB','MB','GB']; let i=0; let n=bytes; while(n>=1024&&i<units.length-1){n/=1024;i++;} return `${n.toFixed(i ? 1 : 0)} ${units[i]}`; }

export function resetDemoData() {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach(k => Object.keys(localStorage).filter(key => key === k || key.startsWith(`${k}:`)).forEach(key => localStorage.removeItem(key)));
  localStorage.removeItem('yourtube-theme-selected');
  window.location.reload();
}

export { KEYS, demoVideos };
