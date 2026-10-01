import express from 'express';
import crypto from 'crypto';
import Subscription from '../task_modals/Subscription.js';
import Download from '../task_modals/Download.js';
import LoginLog from '../task_modals/LoginLog.js';
import CommentReport from '../task_modals/CommentReport.js';
import CommentHistory from '../task_modals/CommentHistory.js';
import TaskComment from '../task_modals/TaskComment.js';
import ModerationLog from '../task_modals/ModerationLog.js';

const router = express.Router();

const limits = { Free: 1, Bronze: 3, Silver: 7, Gold: 20 };
const plans = ['Free', 'Bronze', 'Silver', 'Gold'];
const prices = {
  Bronze: { monthly: 99, quarterly: 249, yearly: 999 },
  Silver: { monthly: 199, quarterly: 499, yearly: 1999 },
  Gold: { monthly: 349, quarterly: 899, yearly: 3499 },
};
const memory = {
  subscriptions: [],
  downloads: [],
  loginLogs: [],
  reports: [],
  comments: [],
  commentHistory: [],
  moderationLogs: [],
  otp: new Map(),
};
const attempts = new Map();

function demoMode() { return String(process.env.DEMO_MODE || 'true').toLowerCase() !== 'false'; }
function dbReady() { return process.env.DB_URL && process.env.DB_URL.trim().length > 0; }
function now() { return new Date(); }
function iso(v) { return new Date(v).toISOString(); }
function id() { return crypto.randomUUID(); }

function rateLimit(key, max, windowMs) {
  const current = Date.now();
  const entry = attempts.get(key) || [];
  const fresh = entry.filter(ts => current - ts < windowMs);
  fresh.push(current);
  attempts.set(key, fresh);
  return fresh.length <= max;
}

function moderateComment(text, recentComments = [], userId = '') {
  const normalized = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const blocked = (process.env.BLOCKED_WORDS || 'idiot,stupid,abuseword').split(',').map(x => x.trim()).filter(Boolean);
  if (!normalized) return 'Comment cannot be empty.';
  if (normalized.length > 1000) return 'Comment is too long (maximum 1000 characters).';
  if (blocked.some(word => normalized.includes(word))) return 'Abusive language detected. Please rewrite the comment.';
  if (/https?:\/\/|www\.|javascript:|data:text\/html/i.test(normalized)) return 'Links are blocked in comments for safety.';
  if (/(.)\1{7,}/.test(normalized) || /[!?.,_\-~]{8,}/.test(normalized)) return 'Repeated special-character or spam pattern detected.';
  const emojiCount = (normalized.match(/[\u{1F300}-\u{1FAFF}❤️]/gu) || []).length;
  if (emojiCount > 8) return 'Repeated emoji flooding is blocked.';
  if (recentComments.some(c => c.userId === String(userId) && c.text?.trim().toLowerCase() === normalized)) return 'Duplicate comment blocked.';
  return null;
}

let currentUserId = '';

async function listComments(videoId) {
  if (dbReady()) return TaskComment.find({ videoId }).sort({ createdAt: -1 }).lean();
  return memory.comments.filter(c => c.videoId === videoId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function createHistory(data) {
  if (dbReady()) return CommentHistory.create(data);
  memory.commentHistory.unshift({ _id: id(), ...data, createdAt: now() });
}
async function createModeration(data) {
  if (dbReady()) return ModerationLog.create(data);
  memory.moderationLogs.unshift({ _id: id(), ...data, createdAt: now() });
}

async function sendReceiptEmail({ email, userName, plan, amount, invoiceNumber, orderId, paymentId, startDate, expiryDate }) {
  if (!process.env.RESEND_API_KEY || !email) return false;
  const from = process.env.MAIL_FROM || 'YourTube Lab <onboarding@resend.dev>';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px">
      <h2>YourTube Lab — payment confirmation</h2>
      <p>Hi ${userName || 'there'}, your subscription is active.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td>Plan</td><td><b>${plan}</b></td></tr>
        <tr><td>Amount</td><td>₹${amount}</td></tr>
        <tr><td>Invoice</td><td>${invoiceNumber}</td></tr>
        <tr><td>Order ID</td><td>${orderId}</td></tr>
        <tr><td>Payment ID</td><td>${paymentId}</td></tr>
        <tr><td>Validity</td><td>${new Date(startDate).toLocaleDateString('en-IN')} – ${new Date(expiryDate).toLocaleDateString('en-IN')}</td></tr>
      </table>
      <p>Thank you for using YourTube Lab. Support: ${process.env.SUPPORT_EMAIL || 'support@example.com'}</p>
    </div>`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject: `YourTube Lab receipt — ${invoiceNumber}`, html }),
    });
    return response.ok;
  } catch { return false; }
}

router.get('/health', (_req, res) => res.json({ ok: true, tasks: [1,2,3,4,5,6], database: dbReady() ? 'mongo' : 'demo-memory', demoMode: demoMode() }));
router.get('/plans', (_req, res) => res.json(plans.map(plan => ({ plan, dailyDownloads: limits[plan], prices: prices[plan] || { monthly: 0, quarterly: 0, yearly: 0 } }))));

router.post('/comments', async (req, res) => {
  const { commentId = id(), videoId, userId, username = 'Guest', avatar = '', location = '', text, language = 'English', parentId = null } = req.body || {};
  currentUserId = String(userId || '');
  const key = `comment:${currentUserId || req.ip}`;
  if (!rateLimit(key, 8, 60_000)) return res.status(429).json({ message: 'Too many comment attempts. Please wait a minute.' });
  const recent = await listComments(videoId);
  const moderation = moderateComment(text, recent, currentUserId);
  if (moderation) { await createModeration({ userId: currentUserId, action: 'blocked-comment', reason: moderation, textPreview: String(text || '').slice(0, 120) }); return res.status(422).json({ message: moderation }); }
  const record = { commentId, videoId: String(videoId), userId: currentUserId, username, avatar, location, text: String(text).trim(), language, parentId, likes: 0, dislikes: 0, edited: false, deleted: false, version: 1, createdAt: now(), updatedAt: now() };
  if (dbReady()) await TaskComment.create(record); else memory.comments.unshift(record);
  await createHistory({ commentId, userId: currentUserId, action: 'created', after: record.text, version: 1 });
  res.status(201).json(record);
});

router.get('/comments/:videoId', async (req, res) => {
  const result = await listComments(String(req.params.videoId));
  res.json(result);
});

router.patch('/comments/:commentId', async (req, res) => {
  const { userId, text, version } = req.body || {};
  const commentId = String(req.params.commentId);
  const existing = dbReady() ? await TaskComment.findOne({ commentId }) : memory.comments.find(c => c.commentId === commentId);
  if (!existing) return res.status(404).json({ message: 'Comment not found.' });
  if (String(existing.userId) !== String(userId)) return res.status(403).json({ message: 'You can only edit your own comment.' });
  if (new Date() - new Date(existing.createdAt) > 10 * 60_000) return res.status(403).json({ message: 'The 10-minute edit window has expired.' });
  if (version && Number(existing.version) !== Number(version)) return res.status(409).json({ message: 'This comment changed elsewhere. Reload before editing.' });
  currentUserId = String(userId);
  const moderation = moderateComment(text, await listComments(existing.videoId), userId);
  if (moderation && moderation !== 'Duplicate comment blocked.') return res.status(422).json({ message: moderation });
  const before = existing.text;
  const nextVersion = Number(existing.version || 1) + 1;
  const patch = { text: String(text).trim(), edited: true, version: nextVersion, updatedAt: now() };
  if (dbReady()) Object.assign(existing, patch) && await existing.save(); else Object.assign(existing, patch);
  await createHistory({ commentId, userId, action: 'edited', before, after: patch.text, version: nextVersion });
  res.json(existing);
});

router.delete('/comments/:commentId', async (req, res) => {
  const { userId } = req.body || {};
  const commentId = String(req.params.commentId);
  const existing = dbReady() ? await TaskComment.findOne({ commentId }) : memory.comments.find(c => c.commentId === commentId);
  if (!existing) return res.status(404).json({ message: 'Comment not found.' });
  if (String(existing.userId) !== String(userId)) return res.status(403).json({ message: 'You can only delete your own comment.' });
  if (new Date() - new Date(existing.createdAt) > 10 * 60_000) return res.status(403).json({ message: 'The 10-minute delete window has expired.' });
  existing.text = '[deleted by author]'; existing.deleted = true; existing.edited = true; existing.version = Number(existing.version || 1) + 1;
  if (dbReady()) await existing.save();
  await createHistory({ commentId, userId, action: 'deleted', before: existing.text, after: '[deleted by author]', version: existing.version });
  res.json({ ok: true });
});

router.post('/comments/:commentId/reaction', async (req, res) => {
  const { reaction = 'like' } = req.body || {};
  const field = reaction === 'dislike' ? 'dislikes' : 'likes';
  const commentId = String(req.params.commentId);
  const existing = dbReady() ? await TaskComment.findOne({ commentId }) : memory.comments.find(c => c.commentId === commentId);
  if (!existing) return res.status(404).json({ message: 'Comment not found.' });
  existing[field] = Number(existing[field] || 0) + 1;
  if (dbReady()) await existing.save();
  res.json(existing);
});

router.post('/comments/report', async (req, res) => {
  try {
    const { commentId, reporterId, reason = 'other' } = req.body || {};
    if (!commentId || !reporterId) return res.status(400).json({ message: 'commentId and reporterId are required.' });
    if (!rateLimit(`report:${reporterId}`, 10, 60_000)) return res.status(429).json({ message: 'Too many reports.' });
    const payload = { commentId: String(commentId), reporterId: String(reporterId), reason };
    if (dbReady()) {
      const record = await CommentReport.create(payload);
      await createModeration({ userId: reporterId, commentId, action: 'report-created', reason });
      return res.status(201).json(record);
    }
    if (memory.reports.some(r => r.commentId === payload.commentId && r.reporterId === payload.reporterId)) return res.status(409).json({ message: 'Duplicate report ignored.' });
    const record = { _id: id(), ...payload, status: 'flagged', createdAt: now() };
    memory.reports.unshift(record); await createModeration({ userId: reporterId, commentId, action: 'report-created', reason });
    return res.status(201).json(record);
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Duplicate report ignored.' });
    return res.status(500).json({ message: 'Could not create report.' });
  }
});

router.get('/moderation/reports', async (_req, res) => {
  const reports = dbReady() ? await CommentReport.find().sort({ createdAt: -1 }).lean() : memory.reports;
  const logs = dbReady() ? await ModerationLog.find().sort({ createdAt: -1 }).limit(100).lean() : memory.moderationLogs;
  res.json({ reports, logs });
});

router.patch('/moderation/reports/:id', async (req, res) => {
  const status = ['flagged','reviewed','dismissed'].includes(req.body?.status) ? req.body.status : 'reviewed';
  if (dbReady()) { const item = await CommentReport.findByIdAndUpdate(req.params.id, { status }, { new: true }); return res.json(item); }
  const item = memory.reports.find(r => r._id === req.params.id || r.id === req.params.id); if (!item) return res.status(404).json({ message: 'Report not found.' }); item.status = status; res.json(item);
});

async function resolveActivePlan(userId, requestedPlan) {
  if (!dbReady()) return requestedPlan;
  const latest = await Subscription.findOne({ userId: String(userId), status: 'paid', expiryDate: { $gt: now() } }).sort({ expiryDate: -1 }).lean();
  return latest?.plan || 'Free';
}

router.post('/downloads/authorize', async (req, res) => {
  const { userId, videoId, plan = 'Free', fileSize = '10 MB', deviceInfo = '', browser = '' } = req.body || {};
  if (!userId || !videoId || !plans.includes(plan)) return res.status(400).json({ message: 'Invalid download request.' });
  const effectivePlan = await resolveActivePlan(userId, plan);
  if (dbReady() && effectivePlan !== plan) return res.status(403).json({ message: 'The selected plan is not an active subscription.' });
  const premiumVideoIds = new Set(['v2','v4','v7','v9']);
  if (effectivePlan === 'Free' && premiumVideoIds.has(String(videoId))) return res.status(403).json({ message: 'This premium video requires an active paid plan.' });
  const today = new Date(); today.setHours(0,0,0,0);
  const records = dbReady() ? await Download.find({ userId: String(userId), downloadTimestamp: { $gte: today }, status: 'completed' }).lean() : memory.downloads.filter(d => d.userId === String(userId) && d.status === 'completed' && new Date(d.downloadTimestamp) >= today);
  const duplicate = (dbReady() ? await Download.findOne({ userId: String(userId), videoId: String(videoId), status: { $in: ['started','completed'] }, downloadTimestamp: { $gte: new Date(Date.now() - 24 * 60 * 60_000) } }) : memory.downloads.find(d => d.userId === String(userId) && d.videoId === String(videoId) && ['started','completed'].includes(d.status) && new Date(d.downloadTimestamp) >= new Date(Date.now() - 24 * 60 * 60_000)));
  if (duplicate) return res.status(409).json({ message: 'This video was already downloaded within the last 24 hours.', record: duplicate });
  const limit = limits[effectivePlan];
  if (records.length >= limit) return res.status(429).json({ message: `${plan} plan limit reached (${limit}/day).` });
  const quotaRemaining = Math.max(0, limit - records.length - 1);
  const record = { userId: String(userId), videoId: String(videoId), subscriptionPlan: effectivePlan, status: 'completed', fileSize, quotaRemaining, ipAddress: req.headers['x-forwarded-for'] || req.ip || '', deviceInfo, browser, downloadTimestamp: now() };
  if (dbReady()) { const created = await Download.create(record); return res.status(201).json(created); }
  memory.downloads.unshift({ _id: id(), ...record }); res.status(201).json(record);
});

router.get('/downloads/:userId', async (req, res) => {
  const items = dbReady() ? await Download.find({ userId: String(req.params.userId) }).sort({ downloadTimestamp: -1 }).lean() : memory.downloads.filter(d => d.userId === String(req.params.userId));
  res.json(items);
});

router.post('/payments/create-order', async (req, res) => {
  const { userId, plan = 'Bronze', billing = 'monthly', email = '', name = 'YourTube User' } = req.body || {};
  if (!userId || !plans.includes(plan) || !['monthly','quarterly','yearly'].includes(billing)) return res.status(400).json({ message: 'Invalid purchase payload.' });
  if (plan === 'Free') return res.status(400).json({ message: 'Free plan does not need a payment.' });
  const amount = prices[plan][billing] * 100;
  const receipt = `yt_${Date.now()}`;
  let orderId = `order_demo_${Date.now()}`;
  let real = false;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, currency: 'INR', receipt, notes: { plan, billing, userId: String(userId) } }) });
    if (!response.ok) return res.status(502).json({ message: 'Razorpay order creation failed.' });
    const order = await response.json(); orderId = order.id; real = true;
  }
  const days = billing === 'yearly' ? 365 : billing === 'quarterly' ? 90 : 30;
  const pending = { userId: String(userId), plan, billing, amount: amount / 100, currency: 'INR', orderId, status: 'pending', renewal: false, _meta: { email, name, days, real } };
  if (dbReady()) { const record = await Subscription.create(pending); return res.json({ keyId: process.env.RAZORPAY_KEY_ID || '', orderId, amount, currency: 'INR', record, mode: real ? 'razorpay-test' : 'demo' }); }
  memory.subscriptions.unshift({ _id: id(), createdAt: now(), ...pending });
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || '', orderId, amount, currency: 'INR', mode: real ? 'razorpay-test' : 'demo' });
});

router.post('/payments/verify', async (req, res) => {
  const { userId, email = '', name = 'YourTube User', plan, billing, orderId, paymentId, signature = '' } = req.body || {};
  if (!userId || !orderId || !paymentId || !plans.includes(plan)) return res.status(400).json({ message: 'Missing payment verification fields.' });
  let verified = false;
  if (process.env.RAZORPAY_KEY_SECRET && !String(orderId).startsWith('order_demo_')) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    const provided = String(signature); verified = provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } else {
    verified = demoMode() && String(signature).startsWith('demo_');
  }
  if (!verified) return res.status(400).json({ message: 'Payment signature verification failed.' });

  const start = now(); const days = billing === 'yearly' ? 365 : billing === 'quarterly' ? 90 : 30; const expiry = new Date(start.getTime() + days * 86400_000);
  const amount = prices[plan][billing]; const invoiceNumber = `INV-${start.getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const update = { userId: String(userId), plan, billing, amount, currency: 'INR', paymentId, orderId, invoiceNumber, status: 'paid', startDate: start, expiryDate: expiry, renewal: false };
  let record;
  if (dbReady()) record = await Subscription.findOneAndUpdate({ userId: String(userId), orderId }, update, { upsert: true, new: true }); else { const found = memory.subscriptions.find(s => s.orderId === orderId && s.userId === String(userId)); record = found ? Object.assign(found, update) : { _id: id(), ...update }; if (!found) memory.subscriptions.unshift(record); }
  const emailSent = await sendReceiptEmail({ email, userName: name, plan, amount, invoiceNumber, orderId, paymentId, startDate: start, expiryDate: expiry });
  if (dbReady() && record) { record.emailSent = emailSent; await record.save(); }
  res.json({ ok: true, verified: true, record, emailSent, message: emailSent ? 'Payment verified and receipt emailed.' : 'Payment verified. Configure RESEND_API_KEY to enable receipt email.' });
});

router.post('/login/log', async (req, res) => {
  const data = req.body || {};
  const record = { ...data, userId: String(data.userId || 'u-demo'), loginTimestamp: data.loginTimestamp ? new Date(data.loginTimestamp) : now() };
  if (dbReady()) { const created = await LoginLog.create(record); return res.status(201).json(created); }
  memory.loginLogs.unshift({ _id: id(), ...record }); res.status(201).json(record);
});

router.post('/security/otp/challenge', async (req, res) => {
  const { userId = 'u-demo', destination = 'registered email' } = req.body || {};
  const key = String(userId); if (!rateLimit(`otp:${key}`, 3, 10 * 60_000)) return res.status(429).json({ message: 'Too many OTP requests. Please wait.' });
  const code = String(100000 + crypto.randomInt(900000)); const challengeId = id(); memory.otp.set(challengeId, { userId: key, code, createdAt: Date.now(), attempts: 0 });
  let emailSent = false;
  if (process.env.RESEND_API_KEY && /@/.test(destination)) {
    try {
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.MAIL_FROM || 'YourTube Lab <onboarding@resend.dev>', to: [destination], subject: 'YourTube Lab security code', html: `<p>Your YourTube Lab verification code is <b>${code}</b>. It expires in 5 minutes.</p>` }) });
      emailSent = response.ok;
    } catch {}
  }
  const demo = demoMode();
  res.json({ challengeId, destination: emailSent ? 'registered email' : destination, expiresInSeconds: 300, emailSent, ...(demo ? { demoCode: code } : {}) });
});

router.post('/security/otp/verify', async (req, res) => {
  const { challengeId, code } = req.body || {}; const challenge = memory.otp.get(challengeId); if (!challenge) return res.status(404).json({ message: 'OTP challenge expired or not found.' });
  if (Date.now() - challenge.createdAt > 300_000) { memory.otp.delete(challengeId); return res.status(410).json({ message: 'OTP expired.' }); }
  challenge.attempts += 1; if (challenge.attempts > 5) { memory.otp.delete(challengeId); return res.status(429).json({ message: 'Too many OTP attempts.' }); }
  if (String(code) !== String(challenge.code)) return res.status(400).json({ message: 'Invalid OTP.' }); memory.otp.delete(challengeId); res.json({ verified: true });
});

router.get('/subscriptions/:userId', async (req, res) => {
  const items = dbReady() ? await Subscription.find({ userId: String(req.params.userId) }).sort({ createdAt: -1 }).lean() : memory.subscriptions.filter(s => s.userId === String(req.params.userId));
  res.json(items);
});

export default router;
