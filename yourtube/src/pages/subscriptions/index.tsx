import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Check, CreditCard, Gem, ReceiptText, ShieldCheck, Sparkles, X } from 'lucide-react';
import { planConfig, type Plan } from '@/lib/demoData';
import { api, backendConfigured } from '@/lib/api';
import { DEFAULT_DEMO_USER, getPayments, getUser, isActiveSubscription, savePayments, saveUser } from '@/lib/demoStore';

const plans:Plan[]=['Free','Bronze','Silver','Gold'];
type Billing='monthly'|'quarterly'|'yearly';
declare global { interface Window { Razorpay?: any } }

export default function Subscriptions() {
  const [billing,setBilling]=useState<Billing>('monthly');
  const [user,setUser]=useState(DEFAULT_DEMO_USER);
  const [selected,setSelected]=useState<Plan>('Free');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [payments,setPayments]=useState<any[]>([]);
  useEffect(()=>{const u=getUser();setUser(u);setSelected(u.plan);setPayments(getPayments());},[]);

  const activateDemo=(plan:Plan, amount:number)=>{
    const now = new Date(); const days=billing==='yearly'?365:billing==='quarterly'?90:30; const expiry=new Date(now.getTime()+days*86400_000);
    const payment={id:`pay_demo_${Date.now()}`,orderId:`order_demo_${Date.now()}`,invoiceNumber:`INV-${now.getFullYear()}-${Math.floor(Math.random()*9000+1000)}`,plan,billing,amount,currency:'INR',status:'paid_test',start:now.toISOString(),expiry:expiry.toISOString()};
    const next=[payment,...getPayments()]; savePayments(next); setPayments(next); const nextUser={...getUser(),plan,subscriptionStart:now.toISOString(),subscriptionExpiry:expiry.toISOString()}; saveUser(nextUser);setUser(nextUser);setSelected(plan);
    setNotice(`Demo payment verified. ${plan} is active until ${expiry.toLocaleDateString('en-IN')}.`);
  };

  const buy=async(plan:Plan)=>{
    if(plan==='Free'){saveUser({...getUser(),plan:'Free',subscriptionStart:null,subscriptionExpiry:null});setUser(getUser());setSelected('Free');setNotice('Switched to Free. Premium access is now disabled.');return;}
    const amount=planConfig[plan][billing==='yearly'?'yearly':'price']; setBusy(true);setNotice('');
    if(!backendConfigured()) { activateDemo(plan,amount); setBusy(false); return; }
    try {
      const order=await api<any>('/tasks/payments/create-order',{method:'POST',body:JSON.stringify({userId:getUser()._id,plan,billing,email:getUser().email,name:getUser().name})});
      if(!window.Razorpay || !order.keyId){ activateDemo(plan,amount); return; }
      const rzp=new window.Razorpay({ key:order.keyId, amount:order.amount, currency:order.currency, name:'YourTube Lab', description:`${plan} membership · ${billing}`, order_id:order.orderId, prefill:{name:getUser().name,email:getUser().email}, theme:{color:'#22d3ee'}, handler:async(response:any)=>{
        try { const result=await api<any>('/tasks/payments/verify',{method:'POST',body:JSON.stringify({userId:getUser()._id,email:getUser().email,name:getUser().name,plan,billing,orderId:response.razorpay_order_id,paymentId:response.razorpay_payment_id,signature:response.razorpay_signature})});
          const record=result.record; const nextUser={...getUser(),plan,subscriptionStart:new Date(record.startDate).toISOString(),subscriptionExpiry:new Date(record.expiryDate).toISOString()}; saveUser(nextUser);savePayments([{id:record.paymentId,orderId:record.orderId,invoiceNumber:record.invoiceNumber,plan,billing,amount:record.amount,currency:'INR',status:'paid',start:new Date(record.startDate).toISOString(),expiry:new Date(record.expiryDate).toISOString(),emailSent:result.emailSent},...getPayments()]); setUser(nextUser);setPayments(getPayments());setSelected(plan);setNotice(result.message);
        } catch(e:any){setNotice(e.message||'Payment verification failed.');}
        finally{setBusy(false);}
      }}); rzp.open();
    } catch(e:any) { setNotice(e.message||'Payment setup failed.'); setBusy(false); }
  };

  const cancel=()=>{const next={...getUser(),plan:'Free' as Plan,subscriptionStart:null,subscriptionExpiry:null};saveUser(next);setUser(next);setSelected('Free');setNotice('Subscription cancelled. Your account remains available on the Free plan.')};
  const active=isActiveSubscription(user);

  return <div className="px-4 py-6 sm:px-6 lg:px-8"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/10 via-blue-500/5 to-cyan-400/10 p-6 sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-violet-300/10 px-3 py-1 text-xs font-bold text-violet-200"><Gem size={14}/> Task 3 · Membership</div><h1 className="mt-4 text-3xl font-black sm:text-4xl">Plans, billing, and premium access.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Compare plans, activate test payments, preserve billing history, and automatically fall back to Free after expiry.</p></div><div className="flex rounded-xl border border-white/10 bg-black/10 p-1"><button onClick={()=>setBilling('monthly')} className={`rounded-lg px-3 py-2 text-xs font-bold ${billing==='monthly'?'bg-white text-slate-950':'text-slate-500'}`}>Monthly</button><button onClick={()=>setBilling('quarterly')} className={`rounded-lg px-3 py-2 text-xs font-bold ${billing==='quarterly'?'bg-white text-slate-950':'text-slate-500'}`}>Quarterly</button><button onClick={()=>setBilling('yearly')} className={`rounded-lg px-3 py-2 text-xs font-bold ${billing==='yearly'?'bg-white text-slate-950':'text-slate-500'}`}>Yearly</button></div></div></section>
    {notice&&<div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 text-xs text-cyan-100">{notice}</div>}
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map(p=>{const c=planConfig[p];const price=p==='Free'?0:(billing==='yearly'?c.yearly:billing==='quarterly'?Math.round(c.price*2.5):c.price);return <div key={p} className={`rounded-3xl border p-5 ${selected===p?'border-cyan-300/40 bg-cyan-300/[.05]':'border-white/10 bg-white/[.025]'}`}><div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.2em] text-slate-600">Plan</div><div className="mt-1 text-xl font-black">{p}</div></div>{selected===p&&<span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-cyan-300">Active</span>}</div><div className="mt-5 text-3xl font-black">₹{price}<span className="text-xs font-medium text-slate-500">/{billing==='yearly'?'yr':billing==='quarterly'?'qtr':'mo'}</span></div><div className="mt-2 text-xs text-slate-500">{c.quality} · {c.watchLimit} · {c.dailyDownloads}/day downloads</div><div className="mt-5 space-y-2">{c.features.map(f=><div key={f} className="flex items-start gap-2 text-xs text-slate-300"><Check size={14} className="mt-0.5 text-cyan-300"/>{f}</div>)}</div><button disabled={busy} onClick={()=>buy(p)} className={`mt-6 w-full rounded-xl px-4 py-2.5 text-xs font-black disabled:opacity-50 ${p==='Free'?'border border-white/10 bg-white/5 text-white':'bg-white text-slate-950 hover:bg-cyan-50'}`}>{p==='Free'?'Use Free plan':busy?'Opening checkout…':'Pay with Razorpay Test'}</button></div>})}</div>
    <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center gap-2 text-emerald-300"><ShieldCheck size={16}/><span className="text-sm font-bold">Current subscription</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-500">Plan</div><div className="mt-1 font-black text-white">{user.plan}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-500">Status</div><div className="mt-1 font-black text-emerald-300">{active?'Active':'Expired'}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-500">Expiry</div><div className="mt-1 font-black text-white">{user.subscriptionExpiry?new Date(user.subscriptionExpiry).toLocaleDateString('en-IN'):'—'}</div></div></div>{user.plan!=='Free'&&<button onClick={cancel} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300/10 bg-rose-300/5 px-3 py-2 text-xs font-bold text-rose-200"><X size={14}/> Cancel subscription</button>}</div><div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center gap-2 text-amber-300"><ReceiptText size={16}/><span className="text-sm font-bold">Billing history</span></div><div className="mt-4 space-y-3">{payments.slice(0,5).map(p=><div key={p.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-3 text-xs"><div><div className="font-bold text-white">{p.plan} · {p.billing}</div><div className="mt-1 text-slate-600">{p.invoiceNumber} · {p.orderId}</div></div><div className="text-right"><div className="font-bold text-emerald-300">₹{p.amount}</div><div className="mt-1 text-slate-600">{p.status}</div></div></div>)}{!payments.length&&<div className="py-8 text-center text-xs text-slate-600">No transactions yet.</div>}</div></div></section>
  </div>
}
