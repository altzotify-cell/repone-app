import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, collection, doc, onSnapshot, 
  addDoc, deleteDoc, persistentLocalCache, persistentMultipleTabManager 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip 
} from 'recharts';
import { 
  Plus, Play, History, BarChart2, Check, 
  Clock, Dumbbell, Trash2, X, PlusCircle, 
  ChevronLeft, Layout, Zap, Timer as TimerIcon, 
  Flame, Award, Search, Pause, SkipForward, SkipBack, Info, Sparkles, Settings as SettingsIcon,
  Wand2, Loader2, Target, BarChart, AlertCircle, CheckCircle2, Coffee, ChevronRight, Youtube, TimerReset, Edit3
} from 'lucide-react';

// --- Environment Variable Protection ---
const getViteEnv = (key, fallback = "") => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}
  return fallback;
};

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: getViteEnv('VITE_FIREBASE_API_KEY', "AIzaSyAvy4jug71xa8qov61wUk49zFR_eEzCx1A"),
  authDomain: getViteEnv('VITE_FIREBASE_AUTH_DOMAIN', "repone-app-9d87d.firebaseapp.com"),
  projectId: getViteEnv('VITE_FIREBASE_PROJECT_ID', "repone-app-9d87d"),
  storageBucket: getViteEnv('VITE_FIREBASE_STORAGE_BUCKET', "repone-app-9d87d.firebasestorage.app"),
  messagingSenderId: getViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', "129924312319"),
  appId: getViteEnv('VITE_FIREBASE_APP_ID', "1:129924312319:web:3706d88be6a5cc0ea0f0ca")
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalAutoDetectLongPolling: true
});
const appId = 'repone-pro-v11';

// --- MASSIVE Exercise Library (Basic & Pro Movements) ---
const EXERCISE_LIBRARY = [
  // CHEST
  { id: 'ch1', name: 'Regular Push-Ups', muscle: 'Chest', icon: '💪', type: 'reps', count: 15, duration: 0, videoId: 'IODxDxX7oi4' },
  { id: 'ch2', name: 'Wide Push-Ups', muscle: 'Chest', icon: '↔️', type: 'reps', count: 12, duration: 0, videoId: 'rr6eFNNDQdc' },
  { id: 'ch3', name: 'Decline Push-Ups', muscle: 'Chest', icon: '📉', type: 'reps', count: 12, duration: 0, videoId: 'SKPab2YC8BE' },
  { id: 'ch4', name: 'Incline Push-Ups', muscle: 'Chest', icon: '📈', type: 'reps', count: 15, duration: 0, videoId: 'Me9bHFAxn8c' },
  { id: 'ch5', name: 'Diamond Push-Ups', muscle: 'Chest', icon: '💎', type: 'reps', count: 10, duration: 0, videoId: 'J0DnG1_S92I' },
  { id: 'ch6', name: 'Archer Push-Ups', muscle: 'Chest', icon: '🏹', type: 'reps', count: 8, duration: 0, videoId: '3m9p_0tU_kM' },
  { id: 'ch7', name: 'Hindu Push-Ups', muscle: 'Chest', icon: '🧘', type: 'reps', count: 10, duration: 0, videoId: 'p5LhC6_7KVs' },
  { id: 'ch8', name: 'Explosive Push-Ups', muscle: 'Chest', icon: '👏', type: 'reps', count: 8, duration: 0, videoId: '8223v8i8-kE' },
  { id: 'ch9', name: 'Pseudo Planche Push-Ups', muscle: 'Chest', icon: '🤸', type: 'reps', count: 8, duration: 0, videoId: 'Wunidm38-iM' },
  
  // SHOULDERS
  { id: 'sh1', name: 'Pike Push-Ups', muscle: 'Shoulders', icon: '🔺', type: 'reps', count: 10, duration: 0, videoId: 'spOsLQlbSRE' },
  { id: 'sh2', name: 'Elevated Pike Push-Ups', muscle: 'Shoulders', icon: '🪜', type: 'reps', count: 8, duration: 0, videoId: '1pG0LOnpU_Q' },
  { id: 'sh3', name: 'Handstand Holds', muscle: 'Shoulders', icon: '🤸', type: 'time', count: 0, duration: 30, videoId: 'vV_6Y99XF_E' },
  { id: 'sh4', name: 'Shoulder Taps', muscle: 'Shoulders', icon: '🖐️', type: 'time', count: 0, duration: 45, videoId: 'geSshv9EovM' },
  { id: 'sh5', name: 'Handstand Push-Ups', muscle: 'Shoulders', icon: '🤸‍♂️', type: 'reps', count: 5, duration: 0, videoId: 'hP7W_G_fJ8Q' },
  
  // BACK
  { id: 'ba1', name: 'Pull-Ups', muscle: 'Back', icon: '🔝', type: 'reps', count: 8, duration: 0, videoId: 'eGo4IYlbE5g' },
  { id: 'ba2', name: 'Chin-Ups', muscle: 'Back', icon: '🤏', type: 'reps', count: 8, duration: 0, videoId: 'brhRXlOhsAM' },
  { id: 'ba3', name: 'Australian Rows', muscle: 'Back', icon: '↔️', type: 'reps', count: 12, duration: 0, videoId: 'hXTc1mdnZCw' },
  { id: 'ba4', name: 'Superman Holds', muscle: 'Back', icon: '🦸', type: 'time', count: 0, duration: 30, videoId: 'z6PJMT2y8GQ' },
  { id: 'ba5', name: 'Archer Pull-Ups', muscle: 'Back', icon: '🏹', type: 'reps', count: 6, duration: 0, videoId: '3m9p_0tU_kM' },

  // ARMS
  { id: 'ar1', name: 'Bench Dips', muscle: 'Arms', icon: '🪑', type: 'reps', count: 15, duration: 0, videoId: '0326dy_-CzM' },
  { id: 'ar2', name: 'Close-Grip Pushups', muscle: 'Arms', icon: '💎', type: 'reps', count: 12, duration: 0, videoId: 'Me9bHFAxn8c' },
  { id: 'ar3', name: 'Tricep Extensions', muscle: 'Arms', icon: '🦴', type: 'reps', count: 12, duration: 0, videoId: 'nS8mY_hS-rQ' },

  // CORE
  { id: 'co1', name: 'Plank', muscle: 'Core', icon: '📏', type: 'time', count: 0, duration: 60, videoId: 'pSHjTRCQxIw' },
  { id: 'co2', name: 'Russian Twists', muscle: 'Core', icon: '🌀', type: 'reps', count: 20, duration: 0, videoId: 'wkD8rjkS_R8' },
  { id: 'co3', name: 'Leg Raises', muscle: 'Core', icon: '🦿', type: 'reps', count: 15, duration: 0, videoId: 'HD1Q267V2EE' },
  { id: 'co4', name: 'Hollow Body Hold', muscle: 'Core', icon: '🌙', type: 'time', count: 0, duration: 45, videoId: 'LlV8_fGhb-0' },
  { id: 'co5', name: 'Bicycle Crunches', muscle: 'Core', icon: '🚲', type: 'reps', count: 20, duration: 0, videoId: 'Iwyvozckjak' },
  { id: 'co6', name: 'L-Sit Hold', muscle: 'Core', icon: '🅻', type: 'time', count: 0, duration: 15, videoId: '6UIs0K-hXmU' },
  
  // LEGS
  { id: 'le1', name: 'Bodyweight Squats', muscle: 'Legs', icon: '🦵', type: 'reps', count: 20, duration: 0, videoId: 'aclHkVaku9U' },
  { id: 'le2', name: 'Walking Lunges', muscle: 'Legs', icon: '🚶', type: 'reps', count: 20, duration: 0, videoId: 'L8fyJhZoQn8' },
  { id: 'le3', name: 'Bulgarian Split Squats', muscle: 'Legs', icon: '🇧🇬', type: 'reps', count: 12, duration: 0, videoId: '2C-uNgKwPLE' },
  { id: 'le4', name: 'Pistol Squats', muscle: 'Legs', icon: '🔫', type: 'reps', count: 5, duration: 0, videoId: 'qDcniqWRXjc' },
  { id: 'le5', name: 'Glute Bridges', muscle: 'Legs', icon: '🌉', type: 'reps', count: 20, duration: 0, videoId: 'wPM8icPu6H8' },
  { id: 'le6', name: 'Calf Raises', muscle: 'Legs', icon: '🦶', type: 'reps', count: 25, duration: 0, videoId: 'gwLzBJYoWlM' },
  
  // FULL BODY
  { id: 'fb1', name: 'Burpees', muscle: 'Full Body', icon: '🔥', type: 'reps', count: 10, duration: 0, videoId: 'dZfeV_pLpGg' },
  { id: 'fb2', name: 'Jump Squats', muscle: 'Full Body', icon: '⬆️', type: 'reps', count: 15, duration: 0, videoId: '72BSZupb-1I' },
  { id: 'fb3', name: 'Muscle-Ups', muscle: 'Full Body', icon: '🚀', type: 'reps', count: 5, duration: 0, videoId: 'Yvj_6N8_0V0' },
  { id: 'fb4', name: 'Mountain Climbers', muscle: 'Full Body', icon: '⛰️', type: 'time', count: 0, duration: 30, videoId: 'zT-9L37Re_8' },
];

const geminiKey = getViteEnv('VITE_GEMINI_API_KEY', "");
// Universal Failsafe: Using stable v1 endpoint
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

const callGemini = async (prompt, system) => {
  if (!geminiKey) throw new Error("Missing VITE_GEMINI_API_KEY in Vercel settings.");
  
  // Combine system instruction into prompt to avoid naming mismatches (camelCase vs snake_case)
  const combinedPrompt = `SYSTEM INSTRUCTION: ${system}\n\nUSER REQUEST: ${prompt}`;

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      contents: [{ 
        parts: [{ text: combinedPrompt }] 
      }]
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.log("FULL API ERROR:", JSON.stringify(errorData));
    throw new Error(errorData.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Clean up any markdown blocks (removes ```json and ```)
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [routines, setRoutines] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [aiTips, setAiTips] = useState(null);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tutorialVideoId, setTutorialVideoId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try { await signInAnonymously(auth); } catch (e) { console.error("Auth init error"); }
      }
      setUser(auth.currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const qR = collection(db, 'artifacts', appId, 'users', user.uid, 'routines');
      const qH = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
      const unsubR = onSnapshot(qR, (s) => setRoutines(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubH = onSnapshot(qH, (s) => setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.date - a.date)));
      return () => { unsubR(); unsubH(); };
    } catch (e) { console.error("Firestore access error"); }
  }, [user]);

  const notify = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 5000); };

  const startWorkout = (routine) => {
    setActiveWorkout({
      ...routine,
      startTime: Date.now(),
      currentExIndex: 0,
      exercises: routine.exercises.map(ex => ({ ...ex, completed: false }))
    });
    setAiTips(null);
    setView('live');
    if (geminiKey) {
       setIsGeneratingTips(true);
       callGemini(`Give 3 short trainer tips for a workout called ${routine.name}.`, "Fitness Pro. Max 20 words.")
       .then(t => setAiTips(t)).catch(() => setAiTips("Focus on form!")).finally(() => setIsGeneratingTips(false));
    }
  };

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-[#e8ff47] font-bebas text-7xl animate-pulse tracking-tighter">REPONE</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#e8ff47] selection:text-black pb-24 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;800&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>

      {tutorialVideoId && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setTutorialVideoId(null)}>
           <button className="absolute top-8 right-8 p-3 bg-zinc-900 rounded-full text-white z-[110] active:scale-90 transition-transform"><X /></button>
           <div className="w-full max-w-2xl aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${tutorialVideoId}?autoplay=1&rel=0`} frameBorder="0" allowFullScreen />
           </div>
        </div>
      )}

      {notification && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl font-bold text-xs uppercase animate-bounce shadow-2xl ${notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#e8ff47] text-black'}`}>{notification.msg}</div>
      )}

      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-40">
        <h1 className="font-bebas text-5xl tracking-widest leading-none">REP<span className="text-[#e8ff47]">ONE</span></h1>
        <button onClick={() => setView('stats')} className="text-zinc-600 hover:text-white transition-colors p-2"><BarChart2 size={24} /></button>
      </header>

      <main className="px-6 max-w-lg mx-auto">
        {view === 'home' && <Home routines={routines} setView={setView} setSelectedRoutine={setSelectedRoutine} />}
        {view === 'preview' && <RoutinePreview routine={selectedRoutine} onStart={() => startWorkout(selectedRoutine)} onDelete={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'routines', selectedRoutine.id)); setView('home'); }} onBack={() => setView('home')} onShowTutorial={setTutorialVideoId} />}
        {view === 'live' && <LiveWorkout workout={activeWorkout} setWorkout={setActiveWorkout} onFinish={async () => {
            const duration = Math.floor((Date.now() - activeWorkout.startTime) / 60000);
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
              name: activeWorkout.name, date: Date.now(), duration, calories: (duration * 8.5).toFixed(0), exercises: activeWorkout.exercises.length
            });
            notify("Workout logged! 🔥");
            setActiveWorkout(null); setView('home');
        }} onCancel={() => setView('home')} aiTips={aiTips} isGenerating={isGeneratingTips} onShowTutorial={setTutorialVideoId} />}
        {view === 'history' && <HistoryView history={history} />}
        {view === 'stats' && <Stats history={history} />}
        {view === 'builder' && <Builder user={user} setView={setView} notify={notify} generateWithAi={async (opts) => {
            const prompt = `Generate a JSON array of exercises for a ${opts.level} level ${opts.focus} workout. 
            Use only these names: ${EXERCISE_LIBRARY.map(e=>e.name).join(', ')}.
            Return ONLY a raw JSON array. No introduction, no markdown.
            Format: [{"name": "Exercise Name", "value": 15}]`;

            const text = await callGemini(prompt, "You are a fitness API that only returns JSON arrays. No conversational text.");
            
            try {
              const parsed = JSON.parse(text);
              return parsed.map(item => {
                const libMatch = EXERCISE_LIBRARY.find(ex => 
                  ex.name.toLowerCase() === item.name.toLowerCase()
                );
                if (!libMatch) return null;
                return { 
                  ...libMatch, 
                  duration: libMatch.type === 'time' ? (item.value || 30) : 0, 
                  count: libMatch.type === 'reps' ? (item.value || 10) : 0, 
                  id: Math.random().toString(36).substr(2, 9) 
                };
              }).filter(Boolean);
            } catch (e) {
              console.error("Parsing error:", e);
              return [];
            }
        }} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-zinc-900 px-10 py-5 flex justify-between items-center z-50">
        <NavIcon icon={<Layout />} active={view === 'home'} onClick={() => setView('home')} />
        <NavIcon icon={<History />} active={view === 'history'} onClick={() => setView('history')} />
        <NavIcon icon={<PlusCircle />} active={view === 'builder'} onClick={() => setView('builder')} size={32} />
        <NavIcon icon={<BarChart2 />} active={view === 'stats'} onClick={() => setView('stats')} />
      </nav>
    </div>
  );
}

function NavIcon({ icon, active, onClick, size = 22 }) {
  return <button onClick={onClick} className={`transition-all duration-300 ${active ? 'text-[#e8ff47] scale-110' : 'text-zinc-600'}`}>{React.cloneElement(icon, { size })}</button>;
}

function Home({ routines, setView, setSelectedRoutine }) {
  return (
    <div className="space-y-8 mt-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><h2 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Active Routines</h2></div>
      <div className="space-y-4">
        {routines.map(r => (
          <div key={r.id} onClick={() => { setSelectedRoutine(r); setView('preview'); }} className="bg-[#141414] rounded-[28px] border border-zinc-800/50 p-6 flex gap-6 cursor-pointer active:scale-95 transition-all">
              <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center text-4xl shrink-0">{r.exercises[0]?.icon || '🔥'}</div>
              <div className="flex flex-col justify-center flex-1">
                <h3 className="text-xl font-bold mb-1 tracking-tight">{r.name}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{r.exercises.length} Exercises</p>
              </div>
              <div className="self-center text-zinc-700"><ChevronRight size={24} /></div>
          </div>
        ))}
        <button onClick={() => setView('builder')} className="w-full py-10 border-2 border-dashed border-zinc-800 rounded-[28px] text-zinc-600 font-bold uppercase text-xs flex flex-col items-center gap-3 active:border-zinc-500 transition-all shadow-lg"><Plus size={24} /> Build New Routine</button>
      </div>
    </div>
  );
}

function RoutinePreview({ routine, onStart, onDelete, onBack, onShowTutorial }) {
  return (
    <div className="space-y-6 pt-4 animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4"><button onClick={onBack} className="p-2 text-zinc-500"><ChevronLeft size={24} /></button><h2 className="font-bebas text-5xl tracking-widest">PREVIEW</h2></div>
      <div className="bg-[#141414] border border-zinc-800 rounded-[32px] p-6 space-y-8 shadow-2xl">
        <div className="flex justify-between items-start">
          <h3 className="text-3xl font-bold leading-none tracking-tight">{routine.name}</h3>
          <button onClick={() => { if(confirm("Delete routine?")) onDelete(); }} className="p-3 text-rose-500 bg-rose-500/10 rounded-2xl active:bg-rose-500 active:text-white transition-all"><Trash2 size={20} /></button>
        </div>
        <div className="space-y-3 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
          {routine.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
              <span className="text-2xl">{ex.icon}</span>
              <div className="flex-1 font-bold text-sm tracking-tight">{ex.name}</div>
              <button onClick={() => onShowTutorial(ex.videoId)} className="p-2 text-zinc-600 hover:text-[#e8ff47] transition-colors"><Youtube size={18}/></button>
              <div className="text-xs font-bebas text-[#e8ff47] tracking-widest min-w-[50px] text-right">{ex.type === 'time' ? `${ex.duration}S` : `${ex.count}R`}</div>
            </div>
          ))}
        </div>
        <button onClick={onStart} className="w-full py-6 bg-[#e8ff47] text-black rounded-[28px] font-black text-xl uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Play size={24} fill="currentColor" /> Start Workout</button>
      </div>
    </div>
  );
}

function LiveWorkout({ workout, setWorkout, onFinish, onCancel, aiTips, isGenerating, onShowTutorial }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const currentEx = workout.exercises[workout.currentExIndex];

  useEffect(() => {
    if (isResting) setTimeLeft(15);
    else if (currentEx.type === 'time') setTimeLeft(currentEx.duration);
    else setTimeLeft(0); 
  }, [workout.currentExIndex, isResting]);

  useEffect(() => {
    if (isPaused) return;
    if (currentEx.type === 'reps' && !isResting) return; 
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          if (isResting) setIsResting(false);
          else if (workout.currentExIndex < workout.exercises.length - 1) setIsResting(true);
          else onFinish();
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isResting, workout.currentExIndex, onFinish]);

  const skip = (dir) => {
     setIsResting(false);
     const next = Math.max(0, Math.min(workout.exercises.length - 1, workout.currentExIndex + dir));
     if (dir === 1 && workout.currentExIndex === workout.exercises.length - 1) onFinish();
     else setWorkout({...workout, currentExIndex: next});
  };

  const progress = isResting ? (timeLeft/15)*100 : currentEx.type === 'time' ? (timeLeft/currentEx.duration)*100 : 100;

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col p-8 pb-16 animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <div className="flex justify-between items-start">
        <button onClick={onCancel} className="text-zinc-600 active:text-white p-2 transition-colors"><X size={28} /></button>
        <div className="text-center">
          <h2 className="font-bold text-xl tracking-tight">{isResting ? "RECOVERY" : currentEx.name}</h2>
          <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mt-1">{workout.currentExIndex + 1} / {workout.exercises.length}</p>
        </div>
        <button onClick={() => onShowTutorial(currentEx.videoId)} className="text-[#e8ff47] p-2 bg-[#e8ff47]/10 rounded-full active:scale-90 transition-transform"><Youtube size={24} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="text-zinc-800 font-black text-[120px] absolute opacity-10 leading-none tracking-tighter uppercase blur-[1px]">{isResting ? "REST" : currentEx.muscle}</div>
        <div className="text-[150px] font-bebas leading-none tabular-nums tracking-widest text-white">{isResting || currentEx.type === 'time' ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : currentEx.count}</div>
        
        {isResting && (
          <button onClick={() => setTimeLeft(p => p+10)} className="mt-8 px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-[#e8ff47] text-xs font-black uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl"><TimerReset size={18} /> +10 Sec Rest</button>
        )}
      </div>

      <div className="flex items-center justify-center gap-12">
        <button onClick={() => skip(-1)} className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center active:scale-90 transition-all text-white"><SkipBack size={28} fill="currentColor" /></button>
        <button onClick={() => (currentEx.type === 'reps' && !isResting) ? (workout.currentExIndex < workout.exercises.length-1 ? setIsResting(true) : onFinish()) : setIsPaused(!isPaused)} className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${currentEx.type === 'reps' && !isResting ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-[#007AFF] shadow-blue-500/30'}`}>{currentEx.type === 'reps' && !isResting ? <Check size={48} strokeWidth={4} /> : (isPaused ? <Play size={48} fill="currentColor" /> : <Pause size={48} fill="currentColor" />)}</button>
        <button onClick={() => skip(1)} className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center active:scale-90 transition-all text-white"><SkipForward size={28} fill="currentColor" /></button>
      </div>

      <div className="mt-16 w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ease-linear ${isResting ? 'bg-[#e8ff47]' : 'bg-[#007AFF]'}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function SelectionGroup({ label, options, active, onChange }) {
  return (
    <div className="space-y-4">
      <div className="px-1 flex justify-between items-center border-b border-zinc-800/50 pb-2">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] font-black text-[#e8ff47] uppercase">{active}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} className={`px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${active === opt ? 'bg-[#e8ff47] text-black border-[#e8ff47]' : 'bg-black/50 text-zinc-500 border-zinc-800'}`}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

function Builder({ user, setView, generateWithAi, notify }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiL, setAiL] = useState('Beginner');
  const [aiF, setAiF] = useState('Full Body');

  const handleAi = async () => {
    setIsAiLoading(true);
    try {
      const res = await generateWithAi({ level: aiL, focus: aiF, duration: 15 });
      setSelected(res); setName(`${aiF} Build`);
      notify("AI Routine Sync Successful");
    } catch (e) { 
        notify(`AI Error: ${e.message}`, "error"); 
    } finally { setIsAiLoading(false); }
  };

  const updateEx = (id, val) => {
    setSelected(prev => prev.map(ex => ex.id === id ? { ...ex, [ex.type === 'time' ? 'duration' : 'count']: parseInt(val) || 0 } : ex));
  };

  const filteredItems = EXERCISE_LIBRARY.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-10 pt-4 animate-in slide-in-from-bottom duration-500 pb-24">
      <div className="flex items-center gap-4"><button onClick={() => setView('home')} className="p-2 text-zinc-500"><ChevronLeft size={24} /></button><h2 className="font-bebas text-5xl tracking-widest text-zinc-200">DESIGN</h2></div>
      
      <div className="bg-[#141414] border border-zinc-800 rounded-[32px] p-6 space-y-10 shadow-2xl border-t-2 border-t-[#007AFF]/20">
        <div className="flex items-center gap-2 text-[#e8ff47] text-[11px] uppercase font-black tracking-widest"><Sparkles size={18} fill="currentColor" /> Gemini Pro AI</div>
        
        <div className="grid gap-10">
            <SelectionGroup label="Expertise" options={['Beginner', 'Intermediate', 'Advanced']} active={aiL} onChange={setAiL} />
            <SelectionGroup label="Target" options={['Full Body', 'Core', 'Upper Body', 'Lower Body', 'Arms', 'Legs', 'Chest', 'Back']} active={aiF} onChange={setAiF} />
        </div>

        <button onClick={handleAi} disabled={isAiLoading} className="w-full py-6 bg-[#007AFF] rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-blue-500/20 shadow-xl border-b-4 border-b-blue-700">
            {isAiLoading ? <Loader2 className="animate-spin" /> : <Wand2 />} Generate Smart Plan
        </button>
      </div>

      <div className="bg-[#141414] border border-zinc-800 rounded-[32px] p-6 space-y-8 shadow-xl">
        <div className="space-y-2">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Plan Name</p>
            <input placeholder="Ex: Muscle Maker" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-6 rounded-2xl text-xl font-bold outline-none focus:border-[#e8ff47] transition-all" />
        </div>
        
        <div className="space-y-4">
          {selected.map((ex) => (
            <div key={ex.id} className="bg-black p-5 rounded-2xl flex flex-col gap-4 border border-zinc-800/50 shadow-inner">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3"><span className="text-2xl">{ex.icon}</span><span className="font-bold text-sm tracking-tight">{ex.name}</span></div>
                    <button onClick={() => setSelected(selected.filter(x => x.id !== ex.id))} className="text-rose-500 p-2 active:scale-90"><Trash2 size={18} /></button>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                    <Edit3 size={16} className="text-zinc-600" />
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">Set Target:</label>
                    <input 
                        type="number" 
                        value={ex.type === 'time' ? ex.duration : ex.count}
                        onChange={(e) => updateEx(ex.id, e.target.value)}
                        className="bg-transparent text-[#e8ff47] font-bebas text-3xl w-full outline-none leading-none"
                    />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{ex.type === 'time' ? 'Secs' : 'Reps'}</span>
                </div>
            </div>
          ))}
        </div>

        <div className="relative pt-4">
            <input placeholder="Add exercise manually..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 pl-14 rounded-2xl text-sm outline-none focus:border-[#e8ff47] transition-all" />
            <Search className="absolute left-6 top-[65%] -translate-y-1/2 text-zinc-500" size={18} />
        </div>
        
        {search && (
            <div className="grid gap-2 max-h-56 overflow-y-auto pt-2 custom-scrollbar">
                {filteredItems.map(ex => (
                <button key={ex.id} onClick={() => { setSelected([...selected, { ...ex, id: Math.random().toString() }]); setSearch(''); }} className="flex items-center justify-between p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl active:border-[#e8ff47] transition-colors">
                    <div className="flex items-center gap-3"><span className="text-xl">{ex.icon}</span><span className="text-sm font-bold tracking-tight">{ex.name}</span></div>
                    <Plus size={20} className="text-[#e8ff47]" />
                </button>
                ))}
            </div>
        )}
      </div>

      <button onClick={async () => { if(!name || !selected.length || !db) return; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'routines'), { name, exercises: selected, created: Date.now() }); setView('home'); }} className="w-full py-6 bg-[#e8ff47] text-black rounded-[28px] font-black text-xl uppercase active:scale-95 transition-all shadow-[#e8ff47]/10 shadow-xl border-b-4 border-b-lime-600 mb-10">
        Commit Plan
      </button>
    </div>
  );
}

function HistoryView({ history }) {
  return (<div className="space-y-6 pt-4 animate-in fade-in duration-500"><h2 className="font-bebas text-5xl tracking-widest text-zinc-200">LOGS</h2><div className="grid gap-4">{history.map(h => (<div key={h.id} className="bg-[#141414] p-6 rounded-[28px] border border-zinc-800/50 flex justify-between items-center shadow-lg"><div><h4 className="font-bold text-lg mb-1 tracking-tight">{h.name}</h4><p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{new Date(h.date).toLocaleDateString()} • {h.duration} MIN</p></div><div className="text-right text-[#e8ff47] font-bebas text-4xl">{h.calories} KCAL</div></div>))}</div></div>);
}

function Stats({ history }) {
  const data = useMemo(() => history.slice(0, 7).reverse().map(h => ({ d: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }), v: parseFloat(h.calories) || 0 })), [history]);
  return (
    <div className="space-y-8 pt-4 animate-in slide-in-from-bottom duration-500">
        <h2 className="font-bebas text-5xl tracking-widest text-zinc-200">ANALYTICS</h2>
        <div className="bg-[#141414] p-6 rounded-[32px] border border-zinc-800/50 shadow-2xl">
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8ff47" stopOpacity={0.2}/><stop offset="95%" stopColor="#e8ff47" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="d" hide /><Area type="monotone" dataKey="v" stroke="#e8ff47" strokeWidth={4} fillOpacity={1} fill="url(#p)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#141414] p-6 rounded-[28px] border border-zinc-800/50 text-center shadow-lg"><p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-1">Total Burn</p><p className="font-bebas text-4xl text-[#e8ff47]">{history.reduce((a,c)=>a+parseFloat(c.calories||0),0).toFixed(0)}</p></div>
            <div className="bg-[#141414] p-6 rounded-[28px] border border-zinc-800/50 text-center shadow-lg"><p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-1">Active Days</p><p className="font-bebas text-4xl text-[#e8ff47]">{[...new Set(history.map(h => new Date(h.date).toDateString()))].length}</p></div>
        </div>
    </div>
  );
}
