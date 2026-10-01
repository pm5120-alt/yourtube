import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import userroutes from './routes/auth.js';
import videoroutes from './routes/video.js';
import likeroutes from './routes/like.js';
import watchlaterroutes from './routes/watchlater.js';
import historyrroutes from './routes/history.js';
import commentroutes from './routes/comment.js';
import taskApi from './task_routes/taskApi.js';

dotenv.config();
const app = express();
const rooms = new Map();
const streams = new Map();
const locks = new Map();
app.use(cors({ origin: '*', methods: ['GET','POST','OPTIONS'] }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json());
app.get('/', (_req,res)=>res.json({ok:true,service:'YourTube backend',realtime:'SSE + WebRTC signaling'}));
app.use('/user', userroutes); app.use('/video', videoroutes); app.use('/like', likeroutes); app.use('/watch', watchlaterroutes); app.use('/history', historyrroutes); app.use('/comment', commentroutes);
app.use('/tasks', taskApi);

function ensureRoom(room){ if(!rooms.has(room)) rooms.set(room,new Map()); if(!streams.has(room)) streams.set(room,new Set()); }
function sendStream(res,event,payload){ res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`); }
function broadcast(room,event,payload,exceptId){ const roomStreams=streams.get(room)||new Set(); for(const item of roomStreams){if(item.id!==exceptId) sendStream(item.res,event,payload);} }

app.get('/signal/:roomId/:clientId', (req,res)=>{
 const room=String(req.params.roomId).toUpperCase(); const id=req.params.clientId; ensureRoom(room);
 res.setHeader('Content-Type','text/event-stream'); res.setHeader('Cache-Control','no-cache'); res.setHeader('Connection','keep-alive'); res.flushHeaders?.();
 const set=streams.get(room); const holder={id,res}; set.add(holder); res.write(': connected\n\n');
 req.on('close',()=>{set.delete(holder); const users=rooms.get(room); if(users?.has(id)){users.delete(id); broadcast(room,'user-left',{id},id);} if(users?.size===0){rooms.delete(room);streams.delete(room);locks.delete(room);}});
});

app.post('/signal/:roomId/join', (req,res)=>{
 const room=String(req.params.roomId).toUpperCase(); const {id,name}=req.body||{}; ensureRoom(room); if(locks.get(room)){return res.status(423).json({message:'Room is locked'});} const users=rooms.get(room); if(users.size>=8)return res.status(429).json({message:'Room full'}); const existing=[...users.entries()].map(([uid,u])=>({id:uid,name:u.name,isHost:!!u.isHost})); const isHost=users.size===0; users.set(id,{name:name||'Guest',isHost}); broadcast(room,'user-joined',{id,name:name||'Guest',isHost},id); res.json({users:existing,hostId:isHost?id:[...users.entries()].find(([,u])=>u.isHost)?.[0]||id,locked:!!locks.get(room)});
});
app.post('/signal/:roomId/message', (req,res)=>{const room=String(req.params.roomId).toUpperCase(); const {event,payload,exceptId}=req.body||{}; if(!event)return res.status(400).end(); broadcast(room,event,payload,exceptId); res.json({ok:true});});
app.post('/signal/:roomId/leave', (req,res)=>{const room=String(req.params.roomId).toUpperCase(); const {id}=req.body||{}; const users=rooms.get(room); if(users?.has(id)){users.delete(id); broadcast(room,'user-left',{id},id);} res.json({ok:true});});
app.post('/signal/:roomId/lock', (req,res)=>{const room=String(req.params.roomId).toUpperCase();locks.set(room,!!req.body?.value); broadcast(room,'host-command',{type:'lock',value:!!req.body?.value});res.json({ok:true});});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log(`YourTube backend running on ${PORT}`));
if(process.env.DB_URL)mongoose.connect(process.env.DB_URL).then(()=>console.log('MongoDB connected')).catch(e=>console.log('MongoDB connection error:',e.message)); else console.log('DB_URL not set — MongoDB persistence is optional for demo mode.');
