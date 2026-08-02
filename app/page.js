'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, ScanFace, Users, BarChart3, UserPlus, ClipboardList, Home,
  Clock, AlertTriangle, CheckCircle2, Radar, Sparkles, TrendingUp,
  Loader2, Zap, ShieldCheck, XCircle, Search, Filter, Download,
  RefreshCw, Cpu, Video, Trash2, Award, MailWarning, Wifi, WifiOff,
  Database, FileText, Send, Rocket
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS'];
const YEARS = ['1', '2', '3', '4'];
const MODEL_URL = 'https://vladmandic.github.io/face-api/model';
const MATCH_THRESHOLD = 0.5;

const api = {
  get: async (path) => (await fetch(`/api/${path}`)).json(),
  post: async (path, body) => (await fetch(`/api/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })).json(),
  del: async (path) => (await fetch(`/api/${path}`, { method: 'DELETE' })).json(),
};

const euclidean = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
};

const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const formatTimeShort = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

let faceapi = null;
let modelsLoaded = false;
let modelsLoadingPromise = null;

const FACE_API_SCRIPT = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js';

async function loadFaceApi(onProgress) {
  if (modelsLoaded) return faceapi;
  if (modelsLoadingPromise) return modelsLoadingPromise;
  modelsLoadingPromise = (async () => {
    onProgress?.(10, 'Loading face-api engine…');
    // Dynamic import from URL (not bundled by webpack)
    const mod = await import(/* webpackIgnore: true */ FACE_API_SCRIPT);
    faceapi = mod;
    onProgress?.(30, 'Loading tiny face detector…');
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    onProgress?.(60, 'Loading 68-point landmark model…');
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    onProgress?.(90, 'Loading face recognition model…');
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    onProgress?.(100, 'Ready');
    modelsLoaded = true;
    return faceapi;
  })();
  return modelsLoadingPromise;
}

function Header({ view, setView, cutoff }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const cutoffH = Math.floor(cutoff / 60);
  const cutoffM = cutoff % 60;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const isLateNow = now && nowMinutes > cutoff;

  const nav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scanner', label: 'Live Scanner', icon: ScanFace },
    { id: 'register', label: 'Register', icon: UserPlus },
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'logs', label: 'Late Logs', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => setView('home')} className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-md opacity-60 group-hover:opacity-100 transition" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <ScanFace className="w-5 h-5 text-black" />
            </div>
          </div>
          <div className="text-left">
            <div className="font-bold text-sm sm:text-base leading-none">LateTrack AI</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Smart Campus AI</div>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1 order-3 lg:order-2 w-full lg:w-auto">
          {nav.map((n) => {
            const Ic = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Ic className="w-3.5 h-3.5" />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 order-2 lg:order-3">
          <div className="text-right">
            <div className="font-mono text-sm sm:text-base font-semibold tabular-nums" suppressHydrationWarning>
              {now ? formatTime(now) : '--:--:-- --'}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end" suppressHydrationWarning>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLateNow ? 'bg-rose-500 blink' : 'bg-emerald-500 blink'}`} />
              Cutoff: {String(cutoffH).padStart(2, '0')}:{String(cutoffM).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden border-t border-white/5 overflow-x-auto">
        <div className="flex gap-1 px-4 py-2 min-w-max">
          {nav.map((n) => {
            const Ic = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                  active ? 'bg-emerald-500/15 text-emerald-400' : 'text-muted-foreground'
                }`}
              >
                <Ic className="w-3 h-3" />
                {n.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function HomeView({ setView, stats }) {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
              <Sparkles className="w-3 h-3 mr-1" /> Real-Time Face Recognition · On-Device AI
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
              Detect Late-Comers <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 text-glow-emerald">
                In Milliseconds.
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl">
              LateTrack AI recognises registered students at the campus gate using browser-based
              facial recognition, calculates exact late minutes, and delivers HOD-ready analytics — instantly.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => setView('scanner')}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold neon-emerald"
              >
                <Radar className="w-4 h-4 mr-2" /> Launch AI Live Scanner
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView('register')}
                className="border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Register New Student
              </Button>
            </div>
          </motion.div>

          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Registered Students" value={stats?.totalStudents ?? '—'} icon={Users} color="emerald" />
            <StatCard label="Today's Late" value={stats?.todayLate ?? '—'} icon={AlertTriangle} color="rose" />
            <StatCard label="Peak Arrival" value={stats?.peakArrivalTime ?? '--:--'} icon={Clock} color="amber" />
            <StatCard label="Repeat Offenders" value={stats?.repeatOffenders ?? '—'} icon={Award} color="purple" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-4">
        <FeatureCard icon={ScanFace} title="AI Face Recognition" desc="Vladmandic face-api runs on-device — 128-D embeddings, sub-second matching, no cloud upload." />
        <FeatureCard icon={Clock} title="Exact Late Minutes" desc="Cutoff-time engine calculates precise late duration ('Late by 24 mins') and colour-codes each entry." />
        <FeatureCard icon={BarChart3} title="HOD Analytics" desc="Weekly trends, department breakdowns, repeat-offender leaderboards, and export-ready reports." />
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
  };
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className={`glass rounded-xl p-4 sm:p-5 border bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">{value}</div>
        </div>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="glass rounded-xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all">
      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function CutoffPicker({ cutoff, setCutoff }) {
  const h = Math.floor(cutoff / 60);
  const m = cutoff % 60;
  const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return (
    <div className="flex items-center gap-2 glass border border-white/10 rounded-lg px-3 py-2">
      <Clock className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-xs text-muted-foreground">Cutoff</span>
      <input
        type="time"
        value={val}
        onChange={(e) => {
          const [hh, mm] = e.target.value.split(':').map(Number);
          setCutoff(hh * 60 + mm);
        }}
        className="bg-transparent text-xs font-mono border-none outline-none w-[80px]"
      />
    </div>
  );
}

function StatusRow({ label, ok, okText = 'OK', failText = 'Offline' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 font-medium ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
        {ok ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        {ok ? okText : failText}
      </span>
    </div>
  );
}

function RecognitionPanel({ match }) {
  if (!match) {
    return (
      <div className="glass rounded-xl p-5 border border-white/10 min-h-[240px] flex flex-col items-center justify-center text-center">
        <Cpu className="w-8 h-8 text-muted-foreground mb-2" />
        <div className="text-sm text-muted-foreground">Awaiting face detection…</div>
        <div className="text-[11px] text-muted-foreground/60 mt-1">Match results will appear here</div>
      </div>
    );
  }
  if (match.unknown) {
    return (
      <div className="glass rounded-xl p-5 border border-amber-500/40 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Unknown Face Detected</span>
        </div>
        <p className="text-xs text-muted-foreground">Distance: {match.distance?.toFixed(3)} · Not registered. Please enroll or use manual override.</p>
      </div>
    );
  }
  const s = match.student;
  const log = match.log;
  const isLate = log?.status === 'LATE';
  const isAlready = match.alreadyLogged;
  return (
    <motion.div key={s.id + (match.arrival?.toISOString?.() || '')} initial={false} animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-xl p-4 border ${
        isAlready ? 'border-white/10 opacity-70'
        : isLate ? 'border-rose-500/40 bg-rose-500/5'
        : 'border-emerald-500/40 bg-emerald-500/5'}`}>
      <div className="flex items-center gap-3 mb-2">
        {s.photoUrl ? (
          <img src={s.photoUrl} alt={s.fullName} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-lg font-bold">{s.fullName?.[0] || '?'}</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate text-sm">{s.fullName}</div>
          <div className="text-[11px] text-muted-foreground">{s.rollNumber} · {s.department} · Y{s.year}</div>
        </div>
        {match.manual && <Badge variant="outline" className="text-[10px]">MANUAL</Badge>}
      </div>
      {isAlready ? (
        <div className="text-[11px] text-muted-foreground">Recently logged (cooling down 15s)</div>
      ) : (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Arrival</span>
            <span className="font-mono font-semibold">{match.arrival && formatTimeShort(new Date(match.arrival))}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
            <span className="text-muted-foreground">Status</span>
            {isLate ? (
              <Badge className="bg-rose-500 hover:bg-rose-500 text-white neon-rose text-[10px]">LATE by {log.lateDurationMinutes} min</Badge>
            ) : (
              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-black text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-1" /> ON TIME
              </Badge>
            )}
          </div>
          {match.duplicate && <div className="text-[10px] text-amber-400">Already logged today</div>}
          {typeof match.distance === 'number' && !match.manual && (
            <div className="text-[10px] text-muted-foreground/70 font-mono">
              conf {(100 - match.distance * 100).toFixed(1)}% · d {match.distance.toFixed(3)}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ScannerView({ cutoff, setCutoff, refreshStats }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectingRef = useRef(false);
  const studentsRef = useRef([]);
  const lastLoggedRef = useRef({}); // { [studentId]: timestamp }

  const [modelStatus, setModelStatus] = useState({ loaded: false, progress: 0, msg: 'Idle' });
  const [cameraOn, setCameraOn] = useState(false);
  const [students, setStudents] = useState([]);
  const [lastMatches, setLastMatches] = useState([]); // array of { student, distance, arrival, log, duplicate } / { unknown, distance }
  const [manualOpen, setManualOpen] = useState(false);
  const [manualRoll, setManualRoll] = useState('');

  const loadStudents = useCallback(async () => {
    const { students } = await api.get('students');
    setStudents(students || []);
    studentsRef.current = students || [];
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const startCamera = async () => {
    try {
      await loadFaceApi((p, m) => setModelStatus({ loaded: p === 100, progress: p, msg: m }));
      setModelStatus({ loaded: true, progress: 100, msg: 'Models loaded' });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      toast.success('Camera activated', { description: 'AI face detection is running' });
      loopDetect();
    } catch (e) {
      toast.error('Camera failed', { description: e.message });
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const cutoffRef = useRef(cutoff);
  useEffect(() => { cutoffRef.current = cutoff; }, [cutoff]);

  const loopDetect = () => {
    const tick = async () => {
      if (!videoRef.current || !faceapi || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (!detectingRef.current) {
        detectingRef.current = true;
        try {
          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
          const results = await faceapi.detectAllFaces(videoRef.current, options).withFaceLandmarks().withFaceDescriptors();

          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && videoRef.current.videoWidth) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          const studs = studentsRef.current;
          const frameMatches = [];

          for (const result of results) {
            // Match this face
            let best = null;
            if (studs.length > 0) {
              for (const s of studs) {
                if (!s.faceDescriptor || s.faceDescriptor.length !== 128) continue;
                const dist = euclidean(result.descriptor, s.faceDescriptor);
                if (!best || dist < best.distance) best = { student: s, distance: dist };
              }
            }
            const matched = best && best.distance < MATCH_THRESHOLD;

            // Draw
            if (ctx) {
              const box = result.detection.box;
              const color = matched ? '#10b981' : '#f59e0b';
              ctx.strokeStyle = color;
              ctx.lineWidth = 3;
              ctx.shadowColor = color;
              ctx.shadowBlur = 15;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              const cl = Math.min(box.width, box.height) * 0.18;
              ctx.lineWidth = 5;
              const corners = [
                [box.x, box.y, 1, 1],
                [box.x + box.width, box.y, -1, 1],
                [box.x, box.y + box.height, 1, -1],
                [box.x + box.width, box.y + box.height, -1, -1],
              ];
              corners.forEach(([x, y, dx, dy]) => {
                ctx.beginPath();
                ctx.moveTo(x + dx * cl, y);
                ctx.lineTo(x, y);
                ctx.lineTo(x, y + dy * cl);
                ctx.stroke();
              });
              // Label
              ctx.shadowBlur = 0;
              ctx.font = 'bold 16px Inter, sans-serif';
              const label = matched ? `${best.student.fullName} · ${best.student.rollNumber}` : 'UNKNOWN';
              const tw = ctx.measureText(label).width;
              ctx.fillStyle = matched ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)';
              ctx.fillRect(box.x, box.y - 26, tw + 12, 24);
              ctx.fillStyle = matched ? '#000' : '#fff';
              ctx.fillText(label, box.x + 6, box.y - 8);
            }

            if (matched) {
              const now = Date.now();
              const lastAt = lastLoggedRef.current[best.student.id] || 0;
              if (now - lastAt > 15000) {
                lastLoggedRef.current[best.student.id] = now;
                // Capture image snapshot
                const snap = document.createElement('canvas');
                snap.width = 240; snap.height = 180;
                snap.getContext('2d').drawImage(videoRef.current, 0, 0, 240, 180);
                const capturedImage = snap.toDataURL('image/jpeg', 0.55);
                const arrival = new Date();
                const res = await api.post('attendance', {
                  studentId: best.student.id,
                  arrivalTime: arrival.toISOString(),
                  cutoffMinutes: cutoffRef.current,
                  capturedImage,
                });
                frameMatches.push({ ...best, arrival, log: res.log, duplicate: res.duplicate });
                if (res.duplicate) {
                  toast.info(`Already logged: ${best.student.fullName}`);
                } else if (res.log?.status === 'LATE') {
                  toast.error(`LATE by ${res.log.lateDurationMinutes} min`, { description: `${best.student.fullName} · ${best.student.rollNumber}` });
                } else {
                  toast.success(`On Time: ${best.student.fullName}`, { description: `Roll ${best.student.rollNumber}` });
                }
              } else {
                frameMatches.push({ ...best, alreadyLogged: true });
              }
            } else if (best) {
              frameMatches.push({ unknown: true, distance: best.distance });
            } else {
              frameMatches.push({ unknown: true, distance: 999 });
            }
          }
          if (frameMatches.length > 0) {
            setLastMatches(frameMatches);
            if (frameMatches.some((m) => m.log && !m.duplicate)) refreshStats?.();
          }
        } catch (e) {
          console.error(e);
        }
        detectingRef.current = false;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const handleManualOverride = async () => {
    const s = studentsRef.current.find((x) => x.rollNumber === manualRoll.trim());
    if (!s) return toast.error('Roll number not found');
    const arrival = new Date();
    const res = await api.post('attendance', {
      studentId: s.id, arrivalTime: arrival.toISOString(), cutoffMinutes: cutoffRef.current,
    });
    setLastMatches([{ student: s, distance: 0, arrival, log: res.log, duplicate: res.duplicate, manual: true }]);
    setManualOpen(false);
    setManualRoll('');
    if (res.log?.status === 'LATE') toast.error(`LATE by ${res.log.lateDurationMinutes} min`, { description: s.fullName });
    else toast.success(`On Time: ${s.fullName}`);
    refreshStats?.();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Radar className="w-6 h-6 text-emerald-400" /> Live AI Face Detection Terminal
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time <span className="text-emerald-400 font-medium">multi-face</span> recognition · On-device 128-D embeddings · Zero cloud face uploads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CutoffPicker cutoff={cutoff} setCutoff={setCutoff} />
          {!cameraOn ? (
            <Button onClick={startCamera} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold neon-emerald">
              <Video className="w-4 h-4 mr-2" /> Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive"><XCircle className="w-4 h-4 mr-2" />Stop</Button>
          )}
          <Button variant="outline" onClick={() => setManualOpen(true)}>Manual Override</Button>
        </div>
      </div>

      {!modelStatus.loaded && modelStatus.progress > 0 && (
        <div className="glass rounded-xl p-4 mb-4 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span className="text-sm font-medium">{modelStatus.msg}</span>
          </div>
          <Progress value={modelStatus.progress} className="h-1.5" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black aspect-video corner-bracket">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 to-black/95">
                <div className="grid-bg absolute inset-0 opacity-40" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500 pulse-ring" />
                    <ScanFace className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Terminal Standby</h3>
                  <p className="text-sm text-muted-foreground mt-1">Click &quot;Start Camera&quot; to begin face detection</p>
                </div>
              </div>
            )}

            {cameraOn && (
              <>
                <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none">
                  <div className="radar-line absolute inset-x-0" />
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2 glass px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 blink" />
                  <span className="text-[11px] font-medium text-emerald-400">MULTI-FACE SCANNING</span>
                </div>
                <div className="absolute top-3 right-3 glass px-3 py-1.5 rounded-full">
                  <span className="text-[11px] font-mono text-emerald-400">{students.length} enrolled</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {lastMatches.length === 0 ? (
            <RecognitionPanel match={null} />
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Frame Matches ({lastMatches.length})
              </div>
              {lastMatches.map((m, i) => <RecognitionPanel key={i} match={m} />)}
            </div>
          )}
          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">System Status</div>
            <div className="space-y-2 text-sm">
              <StatusRow label="AI Model" ok={modelStatus.loaded} okText="Loaded" />
              <StatusRow label="Camera" ok={cameraOn} okText="Live" />
              <StatusRow label="Enrolled Students" ok={students.length > 0} okText={`${students.length}`} failText="0 — Register first" />
              <StatusRow label="Multi-Face Mode" ok={true} okText="Enabled" />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader><DialogTitle>Manual Override</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Roll Number</Label>
            <Input value={manualRoll} onChange={(e) => setManualRoll(e.target.value)} placeholder="e.g. CSE21B045" />
            <Button onClick={handleManualOverride} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black">Log Attendance</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegisterView({ onRegistered }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', rollNumber: '', department: 'CSE', year: '1', parentEmail: '', parentMobile: '' });
  const [photo, setPhoto] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [modelStatus, setModelStatus] = useState({ loaded: false, progress: 0, msg: '' });
  const [capturing, setCapturing] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCam = async () => {
    try {
      await loadFaceApi((p, m) => setModelStatus({ loaded: p === 100, progress: p, msg: m }));
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCapturing(true);
    } catch (e) {
      toast.error('Camera error', { description: e.message });
    }
  };

  const stopCam = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCapturing(false);
  };

  useEffect(() => () => stopCam(), []);

  const captureFace = async () => {
    if (!videoRef.current || !faceapi) return toast.error('Camera not ready');
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceLandmarks().withFaceDescriptor();
    if (!result) return toast.error('No face detected. Face the camera clearly.');
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 320;
    const ctx = canvas.getContext('2d');
    const vw = videoRef.current.videoWidth, vh = videoRef.current.videoHeight;
    const size = Math.min(vw, vh);
    ctx.drawImage(videoRef.current, (vw - size) / 2, (vh - size) / 2, size, size, 0, 0, 320, 320);
    setPhoto(canvas.toDataURL('image/jpeg', 0.85));
    setDescriptor(Array.from(result.descriptor));
    stopCam();
    toast.success('Face captured', { description: 'AI embedding created (128-D vector)' });
  };

  const submit = async () => {
    if (!descriptor) return toast.error('Please capture your face first');
    const res = await api.post('students', { ...form, faceDescriptor: descriptor, photoUrl: photo });
    if (res.error) return toast.error(res.error);
    setSubmitted(res.student);
    setStep(3);
    onRegistered?.();
    toast.success('Student registered!', { description: `${res.student.fullName} · ${res.student.rollNumber}` });
  };

  const canNext1 = form.fullName && form.rollNumber && form.department && form.year;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-emerald-400" /> Student Registration
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Enroll a student and train the AI face embedding</p>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= n ? 'bg-emerald-500 text-black' : 'bg-white/10 text-muted-foreground'}`}>{n}</div>
            {n < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > n ? 'bg-emerald-500' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <Card className="glass border-white/10 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1 · Personal Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Aditi Sharma" /></div>
              <div><Label>Roll Number *</Label><Input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} placeholder="e.g. CSE21B045" /></div>
              <div>
                <Label>Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year *</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Parent Email</Label><Input value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@example.com" /></div>
              <div><Label>Parent Mobile</Label><Input value={form.parentMobile} onChange={(e) => setForm({ ...form, parentMobile: e.target.value })} placeholder="+91 98765 43210" /></div>
            </div>
            <Button onClick={() => setStep(2)} disabled={!canNext1} className="bg-emerald-500 hover:bg-emerald-400 text-black">
              Continue → Face Capture
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2 · AI Face Enrolment</h3>
            {!modelStatus.loaded && modelStatus.progress > 0 && (
              <div className="text-xs text-muted-foreground">{modelStatus.msg} — {modelStatus.progress}%</div>
            )}
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black aspect-video">
              {photo ? (
                <img src={photo} alt="captured" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {!capturing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <Button onClick={startCam} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                        <Video className="w-4 h-4 mr-2" /> Enable Camera
                      </Button>
                    </div>
                  )}
                  {capturing && <div className="radar-line absolute inset-x-0" />}
                </>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {!photo ? (
                <Button onClick={captureFace} disabled={!capturing} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                  <Camera className="w-4 h-4 mr-2" /> Capture Face
                </Button>
              ) : (
                <>
                  <Button onClick={() => { setPhoto(null); setDescriptor(null); startCam(); }} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                  <Button onClick={submit} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                    <ShieldCheck className="w-4 h-4 mr-2" /> Register Student
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            </div>
          </div>
        )}

        {step === 3 && submitted && (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center neon-emerald mb-4">
              <CheckCircle2 className="w-8 h-8 text-black" />
            </motion.div>
            <h3 className="text-xl font-bold">Enrolment Successful!</h3>
            <p className="text-sm text-muted-foreground mt-1">AI embedding trained · 128-D vector stored</p>

            <div className="mt-6 max-w-xs mx-auto glass rounded-xl overflow-hidden border border-emerald-500/40">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-3 text-black text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider">Smart Campus AI · Student ID</div>
              </div>
              <div className="p-4 flex items-center gap-3">
                {submitted.photoUrl && <img src={submitted.photoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />}
                <div className="text-left">
                  <div className="font-bold">{submitted.fullName}</div>
                  <div className="text-xs text-muted-foreground">{submitted.rollNumber}</div>
                  <div className="text-xs text-muted-foreground">{submitted.department} · Year {submitted.year}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-center">
              <Button onClick={() => { setStep(1); setForm({ fullName: '', rollNumber: '', department: 'CSE', year: '1', parentEmail: '', parentMobile: '' }); setPhoto(null); setDescriptor(null); setSubmitted(null); }} variant="outline">
                Register Another
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function DirectoryView({ refreshKey, refresh }) {
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('all');
  const [year, setYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (dept !== 'all') params.set('department', dept);
    if (year !== 'all') params.set('year', year);
    const { students } = await api.get(`students?${params.toString()}`);
    setStudents(students || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [q, dept, year, refreshKey]);

  const openDetail = async (id) => {
    const res = await api.get(`students/${id}`);
    setDetail(res);
  };

  const del = async (id) => {
    if (!confirm('Delete this student and all logs?')) return;
    await api.del(`students/${id}`);
    setDetail(null);
    load();
    refresh?.();
    toast.success('Deleted');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-emerald-400" /> Student Directory
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">{students.length} registered students</p>

      <div className="glass rounded-xl border border-white/10 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or roll" className="pl-9" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map((y) => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Photo</th><th className="p-3">Name</th><th className="p-3">Roll No</th>
                <th className="p-3">Dept</th><th className="p-3">Year</th><th className="p-3">Late Record</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No students found. Register one first.</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/5 transition">
                  <td className="p-3">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold">{s.fullName?.[0]}</div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{s.fullName}</td>
                  <td className="p-3 font-mono text-xs">{s.rollNumber}</td>
                  <td className="p-3"><Badge variant="outline">{s.department}</Badge></td>
                  <td className="p-3">Year {s.year}</td>
                  <td className="p-3">
                    {s.lateCount > 0 ? (
                      <Badge className={s.lateCount >= 3 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}>{s.lateCount} late</Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">Clean</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => openDetail(s.id)}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="bg-card border-white/10 max-w-lg max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
              <div className="flex gap-4 items-center">
                {detail.student.photoUrl && <img src={detail.student.photoUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />}
                <div>
                  <div className="font-bold text-lg">{detail.student.fullName}</div>
                  <div className="text-sm text-muted-foreground font-mono">{detail.student.rollNumber}</div>
                  <div className="text-xs text-muted-foreground">{detail.student.department} · Year {detail.student.year}</div>
                  {detail.student.parentEmail && <div className="text-xs text-muted-foreground mt-1">{detail.student.parentEmail}</div>}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Attendance History ({detail.history.length})</div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {detail.history.length === 0 && <div className="text-sm text-muted-foreground">No entries yet</div>}
                  {detail.history.map((h) => (
                    <div key={h.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5 text-xs">
                      <span className="font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                      {h.status === 'LATE' ? (
                        <Badge className="bg-rose-500 text-white">LATE {h.lateDurationMinutes}m</Badge>
                      ) : (
                        <Badge className="bg-emerald-500 text-black">ON TIME</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="destructive" onClick={() => del(detail.student.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Student
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogsView({ refreshKey }) {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('all');
  const [dept, setDept] = useState('all');

  const load = async () => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (dept !== 'all') params.set('department', dept);
    const { logs } = await api.get(`attendance?${params.toString()}`);
    setLogs(logs || []);
  };
  useEffect(() => { load(); }, [status, dept, refreshKey]);

  const exportCSV = () => {
    const rows = [['Timestamp', 'Roll', 'Name', 'Dept', 'Year', 'Status', 'Late Minutes']];
    logs.forEach((l) => {
      rows.push([new Date(l.timestamp).toLocaleString(), l.student?.rollNumber || '', l.student?.fullName || '', l.student?.department || '', l.student?.year || '', l.status, l.lateDurationMinutes]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `late-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const exportPDF = async () => {
    const [{ default: jsPDF }, autoTableMod] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = autoTableMod.default || autoTableMod;
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Date();
    // Branded header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, doc.internal.pageSize.width, 18, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('LateTrack AI · Smart Campus Late Report', 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 25);
    doc.text(`Total Entries: ${logs.length}  ·  Late: ${logs.filter((l) => l.status === 'LATE').length}  ·  On Time: ${logs.filter((l) => l.status === 'ON_TIME').length}`, 14, 31);

    const body = logs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      l.student?.rollNumber || '—',
      l.student?.fullName || '—',
      l.student?.department || '—',
      `Y${l.student?.year || '-'}`,
      l.status,
      l.lateDurationMinutes > 0 ? `${l.lateDurationMinutes} min` : '—',
    ]);
    autoTable(doc, {
      startY: 36,
      head: [['Timestamp', 'Roll No', 'Name', 'Dept', 'Year', 'Status', 'Late By']],
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [16, 185, 129], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 250, 250] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.raw === 'LATE') {
            data.cell.styles.textColor = [244, 63, 94];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'ON_TIME') {
            data.cell.styles.textColor = [16, 185, 129];
          }
        }
      },
    });
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`LateTrack AI · Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 6);
    }
    doc.save(`LateTrack-Report-${now.toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF report downloaded');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" /> Attendance Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{logs.length} entries (latest 500)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button onClick={exportPDF} className="bg-emerald-500 hover:bg-emerald-400 text-black">
            <FileText className="w-4 h-4 mr-2" /> Download PDF Report
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl border border-white/10 p-4 mb-4 flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="LATE">Late Only</SelectItem>
            <SelectItem value="ON_TIME">On Time Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Time</th><th className="p-3">Student</th><th className="p-3">Roll</th>
                <th className="p-3">Dept</th><th className="p-3">Status</th><th className="p-3">Late By</th><th className="p-3">Snap</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No logs yet. Fire up the scanner!</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-3 font-mono text-xs whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-medium">{l.student?.fullName || '—'}</td>
                  <td className="p-3 font-mono text-xs">{l.student?.rollNumber}</td>
                  <td className="p-3"><Badge variant="outline">{l.student?.department}</Badge></td>
                  <td className="p-3">
                    {l.status === 'LATE' ? (
                      <Badge className="bg-rose-500 text-white">LATE</Badge>
                    ) : (
                      <Badge className="bg-emerald-500 text-black">ON TIME</Badge>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{l.lateDurationMinutes > 0 ? `${l.lateDurationMinutes} min` : '—'}</td>
                  <td className="p-3">{l.capturedImage ? <img src={l.capturedImage} alt="" className="w-10 h-10 rounded object-cover" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ refreshKey, refresh }) {
  const [data, setData] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTarget, setAlertTarget] = useState(null); // { student, lateCount }
  const [alertMsg, setAlertMsg] = useState('');
  const [alertChannel, setAlertChannel] = useState('sms');
  const [sending, setSending] = useState(false);

  const load = () => api.get('analytics').then(setData);
  useEffect(() => { load(); }, [refreshKey]);

  const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

  const populateDemo = async () => {
    if (!confirm('This will WIPE existing students & logs and populate 12 demo students with 7 days of realistic late-arrival data. Continue?')) return;
    setSeeding(true);
    try {
      const res = await api.post('seed', {});
      if (res.ok) {
        toast.success('Demo data populated!', { description: `${res.students} students · ${res.logs} attendance logs` });
        load();
        refresh?.();
      } else toast.error(res.error || 'Seed failed');
    } catch (e) {
      toast.error('Seed failed', { description: e.message });
    } finally {
      setSeeding(false);
    }
  };

  const openAlert = (student, lateCount) => {
    setAlertTarget({ student, lateCount });
    setAlertMsg(`Dear Parent, this is an alert from Smart Campus AI. Your ward ${student.fullName} (Roll: ${student.rollNumber}, ${student.department} Year ${student.year}) has been marked LATE ${lateCount} times. Please ensure timely arrival before 09:00 AM. — LateTrack AI`);
    setAlertChannel('sms');
    setAlertOpen(true);
  };

  const sendAlert = async () => {
    if (!alertTarget) return;
    const to = alertTarget.student.parentMobile;
    if (!to) return toast.error('No parent mobile on record for this student');
    setSending(true);
    try {
      const res = await api.post('notifications', {
        to, message: alertMsg, channel: alertChannel, studentId: alertTarget.student.id,
      });
      if (res.ok) {
        toast.success(`${alertChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent!`, { description: `SID: ${res.sid}` });
        setAlertOpen(false);
      } else if (res.error?.includes('not configured')) {
        toast.error('Twilio not configured', { description: 'Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to /app/.env' });
      } else {
        toast.error(res.error || 'Send failed');
      }
    } catch (e) {
      toast.error('Send failed', { description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" /> HOD Analytics Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Weekly trends · Department breakdown · Repeat offenders · Parent alerts</p>
        </div>
        <Button onClick={populateDemo} disabled={seeding} variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10">
          {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
          Populate Demo Data
        </Button>
      </div>

      {!data ? (
        <div className="text-center py-16 text-muted-foreground">Loading analytics…</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="glass border-white/10 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold">Last 7 Days · Late vs On Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="late" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} name="Late" />
                <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="On Time" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass border-white/10 p-5">
            <h3 className="font-semibold mb-4">Late Arrivals by Department</h3>
            {data.departmentData.length === 0 ? (
              <div className="text-sm text-muted-foreground py-10 text-center">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.departmentData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                    {data.departmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff20', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="glass border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-rose-400" />
              <h3 className="font-semibold">Top Repeat Latecomers</h3>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {data.topOffenders.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">No offenders yet</div>
              ) : data.topOffenders.map((o, i) => (
                <div key={o.student.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-rose-500 text-white' : i < 3 ? 'bg-amber-500 text-black' : 'bg-white/10'}`}>#{i + 1}</div>
                  {o.student.photoUrl ? (
                    <img src={o.student.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">{o.student.fullName?.[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{o.student.fullName}</div>
                    <div className="text-[11px] text-muted-foreground">{o.student.rollNumber} · {o.student.department}</div>
                  </div>
                  <Badge className="bg-rose-500 text-white">{o.lateCount}</Badge>
                  {o.lateCount >= 3 && (
                    <button onClick={() => openAlert(o.student, o.lateCount)} title="Send parent alert"
                      className="p-1.5 rounded-md hover:bg-amber-500/20 transition">
                      <MailWarning className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" /> Send Parent Alert
            </DialogTitle>
          </DialogHeader>
          {alertTarget && (
            <div className="space-y-3">
              <div className="glass rounded-lg p-3 border border-white/10 flex items-center gap-3">
                {alertTarget.student.photoUrl && <img src={alertTarget.student.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <div className="font-semibold">{alertTarget.student.fullName}</div>
                  <div className="text-xs text-muted-foreground">{alertTarget.student.rollNumber} · {alertTarget.lateCount} late arrivals</div>
                  <div className="text-xs text-muted-foreground font-mono">{alertTarget.student.parentMobile || '⚠ no mobile'}</div>
                </div>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={alertChannel} onValueChange={setAlertChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Message</Label>
                <textarea
                  value={alertMsg}
                  onChange={(e) => setAlertMsg(e.target.value)}
                  rows={5}
                  className="w-full mt-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
                />
                <div className="text-[10px] text-muted-foreground mt-1">{alertMsg.length} chars</div>
              </div>
              <Button onClick={sendAlert} disabled={sending} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send {alertChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} via Twilio
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function App() {
  const [view, setView] = useState('home');
  const [cutoff, setCutoff] = useState(540);
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshStats = useCallback(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((s) => { setStats(s); setRefreshKey((k) => k + 1); })
      .catch((e) => console.error('[LateTrack] stats err:', e));
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((s) => { setStats(s); })
      .catch((e) => console.error('[LateTrack] stats err:', e));
  }, []);

  return (
    <div className="min-h-screen">
      <Header view={view} setView={setView} cutoff={cutoff} />

      <main>
        {view === 'home' && <HomeView setView={setView} stats={stats} />}
        {view === 'scanner' && <ScannerView cutoff={cutoff} setCutoff={setCutoff} refreshStats={refreshStats} />}
        {view === 'register' && <RegisterView onRegistered={refreshStats} />}
        {view === 'directory' && <DirectoryView refreshKey={refreshKey} refresh={refreshStats} />}
        {view === 'logs' && <LogsView refreshKey={refreshKey} />}
        {view === 'analytics' && <AnalyticsView refreshKey={refreshKey} refresh={refreshStats} />}
      </main>

      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          LateTrack AI · Smart Campus Late Detection System · Face recognition runs 100% on-device
        </div>
      </footer>
    </div>
  );
}

export default App;
