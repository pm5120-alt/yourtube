import { useEffect, useState } from 'react';
import { CheckCircle2, Laptop, LockKeyhole, Moon, ShieldCheck, Smartphone, Sun, Tablet, UserRoundCheck, XCircle } from 'lucide-react';
import { api, backendConfigured } from '@/lib/api';
import { DEFAULT_DEMO_USER, getLoginHistory, getTrustedDevices, getUser, saveLoginHistory, saveTrustedDevices, saveUser } from '@/lib/demoStore';

type ClientInfo = {
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  deviceModel: string;
};

const EMPTY_CLIENT_INFO: ClientInfo = {
  browser: 'Detecting…',
  os: 'Detecting…',
  deviceType: 'Desktop',
  deviceModel: 'Detecting…',
};

function detectClient(): ClientInfo {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Unknown';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : 'Linux/Other';
  const deviceType = /tablet|ipad/i.test(ua) ? 'Tablet' : /mobile|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, os, deviceType, deviceModel: navigator.platform || 'Unknown' };
}

function hourIST() {
  return Number(new Intl.DateTimeFormat('en-IN', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
}

function formatDate(value: string | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN');
}

export default function Security() {
  const [user, setUser] = useState(DEFAULT_DEMO_USER);
  const [client, setClient] = useState<ClientInfo>(EMPTY_CLIENT_INFO);
  const [ready, setReady] = useState(false);
  const [otp, setOtp] = useState('');
  const [expected, setExpected] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [trusted, setTrusted] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const info = detectClient();
    setClient(info);
    setUser(getUser());
    setHistory(getLoginHistory());
    setTrusted(getTrustedDevices());
    if (!localStorage.getItem('yourtube-device-id')) {
      localStorage.setItem('yourtube-device-id', crypto.randomUUID());
    }
    setReady(true);
  }, []);

  const simulateLogin = async () => {
    setBusy(true);
    const deviceId = localStorage.getItem('yourtube-device-id') || crypto.randomUUID();
    localStorage.setItem('yourtube-device-id', deviceId);
    const now = new Date();
    const hour = hourIST();
    const autoTheme = hour >= 5 && hour < 12 ? 'light' : 'dark';
    const known = trusted.some((t) => t.deviceId === deviceId && new Date(t.trustedUntil).getTime() > Date.now());
    const entry = {
      id: `l-${Date.now()}`,
      timestamp: now.toISOString(),
      browser: client.browser,
      os: client.os,
      deviceType: client.deviceType,
      deviceModel: client.deviceModel,
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      ip: 'Captured server-side when backend is enabled',
      otpVerified: known,
    };

    const nextHistory = [entry, ...history];
    setHistory(nextHistory);
    saveLoginHistory(nextHistory);

    const nextUser = { ...user, theme: autoTheme };
    saveUser(nextUser);
    setUser(nextUser);
    document.documentElement.classList.toggle('light-mode', autoTheme === 'light');

    try {
      if (backendConfigured()) {
        await api('/tasks/login/log', {
          method: 'POST',
          body: JSON.stringify({
            userId: user._id,
            publicIp: 'server-observed',
            browser: client.browser,
            operatingSystem: client.os,
            deviceType: client.deviceType,
            deviceModel: client.deviceModel,
            loginTimestamp: now.toISOString(),
            city: 'Chennai',
            state: 'Tamil Nadu',
            country: 'India',
            approximateLocation: 'demo region',
            otpRequired: !known,
            otpVerified: known,
            trustedDeviceId: deviceId,
          }),
        });

        if (!known) {
          const challenge = await api<any>('/tasks/security/otp/challenge', {
            method: 'POST',
            body: JSON.stringify({ userId: user._id, destination: user.email }),
          });
          setChallengeId(challenge.challengeId);
          setExpected(challenge.demoCode || '');
          setStatus(challenge.demoCode ? `New device detected. Demo OTP: ${challenge.demoCode}` : 'New device detected. OTP sent to the registered destination.');
        } else {
          setStatus('Trusted device recognized — no OTP required.');
        }
      } else if (!known) {
        const code = String(100000 + Math.floor(Math.random() * 900000));
        setExpected(code);
        setStatus(`New device detected. Demo OTP: ${code}`);
      } else {
        setStatus('Trusted device recognized — no OTP required.');
      }
    } catch (e: any) {
      setStatus(e.message || 'Security log failed.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      if (challengeId && backendConfigured()) {
        await api('/tasks/security/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ challengeId, code: otp }),
        });
      } else if (otp !== expected) {
        throw new Error('Invalid OTP.');
      }

      const id = localStorage.getItem('yourtube-device-id') || 'demo';
      const device = {
        deviceId: id,
        label: `${client.browser} on ${client.os}`,
        browser: client.browser,
        deviceType: client.deviceType,
        trustedUntil: new Date(Date.now() + 30 * 86400_000).toISOString(),
      };
      const nextTrusted = [device, ...trusted.filter((t) => t.deviceId !== id)];
      saveTrustedDevices(nextTrusted);
      setTrusted(nextTrusted);

      const nextHistory = history.map((item, index) => (index === 0 ? { ...item, otpVerified: true } : item));
      setHistory(nextHistory);
      saveLoginHistory(nextHistory);
      setChallengeId('');
      setExpected('');
      setOtp('');
      setStatus('OTP verified. Device trusted for 30 days.');
    } catch (e: any) {
      setStatus(e.message || 'OTP verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const setTheme = (theme: 'light' | 'dark') => {
    const next = { ...getUser(), theme };
    saveUser(next);
    setUser(next);
    localStorage.setItem('yourtube-theme-selected', '1');
    document.documentElement.classList.toggle('light-mode', theme === 'light');
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-xs uppercase tracking-[.24em] text-cyan-300">Task 4</div>
      <h1 className="mt-2 text-3xl font-black">Account security</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">Time-based themes, login intelligence, OTP challenges, and trusted-device records.</p>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-cyan-300"><ShieldCheck size={18}/><span className="text-sm font-bold">Simulated secure login</span></div>
          <div className="mt-3 text-xs text-slate-500">
            {ready ? `Current browser: ${client.browser} · ${client.os} · ${client.deviceType}` : 'Detecting browser and device…'}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={busy || !ready} onClick={simulateLogin} className="rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50">
              {busy ? 'Checking…' : 'Log in from this device'}
            </button>
            {(expected || challengeId) && (
              <>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs outline-none" placeholder="6-digit OTP" />
                <button disabled={busy} onClick={verify} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-xs font-bold text-cyan-100">Verify OTP</button>
              </>
            )}
          </div>
          {status && <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-3 text-xs text-cyan-100">{status}</div>}
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-5">
          <div className="text-sm font-bold">Automatic theme</div>
          <div className="mt-2 text-xs leading-5 text-slate-500">Between 05:00 and 12:00 IST → light. All other times → dark, unless manually overridden.</div>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setTheme('light')} className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${user.theme === 'light' ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-400'}`}><Sun size={14} className="mr-1 inline"/>Light</button>
            <button onClick={() => setTheme('dark')} className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${user.theme === 'dark' ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-400'}`}><Moon size={14} className="mr-1 inline"/>Dark</button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/[.025] p-5">
        <div className="flex items-center gap-2 text-slate-300"><LockKeyhole size={17}/><span className="text-sm font-bold">Login history</span></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="text-slate-600"><tr><th className="pb-3">Time</th><th>Browser</th><th>Device</th><th>OS</th><th>Location</th><th>OTP</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {history.map((h, index) => (
                <tr key={h.id || h._id || `${h.timestamp || h.loginTimestamp || 'login'}-${index}`} className="text-slate-400">
                  <td className="py-3">{formatDate(h.timestamp || h.loginTimestamp)}</td>
                  <td>{h.browser || '—'}</td>
                  <td>{h.deviceType || '—'}</td>
                  <td>{h.os || h.operatingSystem || '—'}</td>
                  <td>{h.city || '—'}{h.state ? `, ${h.state}` : ''}</td>
                  <td>{h.otpVerified ? <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 size={13}/>Verified</span> : <span className="inline-flex items-center gap-1 text-amber-300"><XCircle size={13}/>Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && <div className="py-8 text-center text-xs text-slate-600">No login records yet.</div>}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/[.025] p-5">
        <div className="flex items-center gap-2 text-cyan-300"><UserRoundCheck size={17}/><span className="text-sm font-bold">Trusted devices</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {trusted.map((t) => (
            <div key={t.deviceId} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center gap-2"><DeviceIcon type={t.deviceType}/><span className="text-sm font-bold">{t.label}</span></div>
              <div className="mt-2 text-xs text-slate-500">Trusted until {new Date(t.trustedUntil).toLocaleDateString('en-IN')}</div>
            </div>
          ))}
          {!trusted.length && <div className="text-xs text-slate-600">No trusted devices yet.</div>}
        </div>
      </section>
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  return type === 'Mobile' ? <Smartphone size={15} className="text-slate-500"/> : type === 'Tablet' ? <Tablet size={15} className="text-slate-500"/> : <Laptop size={15} className="text-slate-500"/>;
}
