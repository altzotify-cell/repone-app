import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, collection, doc, onSnapshot, 
  addDoc, deleteDoc, persistentLocalCache, persistentMultipleTabManager 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Plus, Play, History, BarChart2, Check, 
  Clock, Dumbbell, Trash2, X, PlusCircle, 
  ChevronLeft, Layout, Zap, Timer as TimerIcon, 
  Flame, Award, Search, Pause, SkipForward, SkipBack, Info, Sparkles, Settings as SettingsIcon,
  Wand2, Loader2, Target, BarChart, AlertCircle, CheckCircle2, Coffee, ChevronRight, Youtube, TimerReset
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalAutoDetectLongPolling: true
});
const appId = typeof __app_id !== 'undefined' ? __app_id : 'flex-pro-gemini';

// --- Constants: Exercise Library with Video IDs ---
const EXERCISE_LIBRARY = [
  { id: 'ch-1', name: 'Regular Push-Ups', muscle: 'Chest', icon: '💪', type: 'reps', count: 15, duration: 0, videoId: 'IODxDxX7oi4' },
  { id: 'ch-2', name: 'Wide Grip Push-Ups', muscle: 'Chest', icon: '↔️', type: 'reps', count: 12, duration: 0, videoId: 'rr6eFNNDQdc' },
  { id: 'ch-3', name: 'Decline Push-Ups', muscle: 'Chest', icon: '📉', type: 'reps', count: 12, duration: 0, videoId: 'SKPab2YC8BE' },
  { id: 'ch-4', name: 'Incline Push-Ups', muscle: 'Chest', icon: '📈', type: 'reps', count: 15, duration: 0, videoId: 'Me9bHFAxn8c' },
  { id: 'ch-5', name: 'Diamond Push-Ups', muscle: 'Chest', icon: '💎', type: 'reps', count: 10, duration: 0, videoId: 'J0DnG1_S92I' },
  { id: 'ch-6', name: 'Archer Push-Ups', muscle: 'Chest', icon: '🏹', type: 'reps', count: 8, duration: 0, videoId: '3m9p_0tU_kM' },
  { id: 'ch-7', name: 'Hindu Push-Ups', muscle: 'Chest', icon: '🧘', type: 'reps', count: 10, duration: 0, videoId: 'p5LhC6_7KVs' },
  { id: 'ch-8', name: 'Clapping Push-Ups', muscle: 'Chest', icon: '👏', type: 'reps', count: 8, duration: 0, videoId: '8223v8i8-kE' },
  { id: 'ch-11', name: 'Chest Dips', muscle: 'Chest', icon: '📉', type: 'reps', count: 10, duration: 0, videoId: '2z8JmcrW-As' },
  { id: 'sh-1', name: 'Pike Push-Ups', muscle: 'Shoulders', icon: '🔺', type: 'reps', count: 10, duration: 0, videoId: 'spOsLQlbSRE' },
  { id: 'sh-3', name: 'Handstand Push-Ups', muscle: 'Shoulders', icon: '🤸‍♂️', type: 'reps', count: 5, duration: 0, videoId: 'hP7W_G_fJ8Q' },
  { id: 'sh-4', name: 'Shoulder Taps', muscle: 'Shoulders', icon: '🖐️', type: 'time', count: 0, duration: 45, videoId: 'geSshv9EovM' },
  { id: 'ba-1', name: 'Pull-Ups', muscle: 'Back', icon: '🔝', type: 'reps', count: 8, duration: 0, videoId: 'eGo4IYlbE5g' },
  { id: 'ba-2', name: 'Chin-Ups', muscle: 'Back', icon: '🤏', type: 'reps', count: 8, duration: 0, videoId: 'brhRXlOhsAM' },
  { id: 'ba-4', name: 'Inverted Rows', muscle: 'Back', icon: '↔️', type: 'reps', count: 12, duration: 0, videoId: 'hXTc1mdnZCw' },
  { id: 'bi-1', name: 'Close-Grip Pull-Ups', muscle: 'Biceps', icon: '💪', type: 'reps', count: 8, duration: 0, videoId: 'iL3p0F8_kks' },
  { id: 'tr-1', name: 'Bench Dips', muscle: 'Triceps', icon: '🪑', type: 'reps', count: 15, duration: 0, videoId: '0326dy_-CzM' },
  { id: 'co-1', name: 'Plank', muscle: 'Core', icon: '📏', type: 'time', count: 0, duration: 60, videoId: 'pSHjTRCQxIw' },
  { id: 'co-4', name: 'Hanging Leg Raises', muscle: 'Core', icon: '🦵', type: 'reps', count: 12, duration: 0, videoId: 'HD1Q267V2EE' },
  { id: 'co-7', name: 'Russian Twists', muscle: 'Core', icon: '🌀', type: 'reps', count: 20, duration: 0, videoId: 'wkD8rjkS_R8' },
  { id: 'co-9', name: 'Mountain Climbers', muscle: 'Core', icon: '⛰️', type: 'time', count: 0, duration: 30, videoId: 'zT-9L37Re_8' },
  { id: 'le-1', name: 'Bodyweight Squats', muscle: 'Legs', icon: '🦵', type: 'reps', count: 20, duration: 0, videoId: 'aclHkVaku9U' },
  { id: 'le-3', name: 'Bulgarian Split Squats', muscle: 'Legs', icon: '🇧🇬', type: 'reps', count: 12, duration: 0, videoId: '2C-uNgKwPLE' },
  { id: 'le-4', name: 'Walking Lunges', muscle: 'Legs', icon: '🚶', type: 'reps', count: 20, duration: 0, videoId: 'L8fyJhZoQn8' },
  { id: 'le-5', name: 'Pistol Squats', muscle: 'Legs', icon: '🔫', type: 'reps', count: 5, duration: 0, videoId: 'qDcniqWRXjc' },
];

const apiKey = ""; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

const callGemini = async (prompt, systemPrompt = "") => {
  const fetchWithRetry = async (retries = 5, delay = 1000) => {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      if (!response.ok) throw new Error("Gemini API Error");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      }
      throw err;
    }
  };
  return fetchWithRetry();
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
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const qRoutines = collection(db, 'artifacts', appId, 'users', user.uid, 'routines');
    const qHistory = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    const unsubR = onSnapshot(qRoutines, (s) => setRoutines(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubH = onSnapshot(qHistory, (s) => setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.date - a.date)));
    return () => { unsubR(); unsubH(); };
  }, [user]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAiTips = async (workoutName, exercises) => {
    setIsGeneratingTips(true);
    try {
      const prompt = `Give me 3 short, professional, motivating fitness tips for a workout called "${workoutName}" which includes: ${exercises.map(e => e.name).join(', ')}. Keep it under 50 words total. Tone: Elite Coach.`;
      const text = await callGemini(prompt, "You are an elite personal trainer for a high-performance fitness app.");
      setAiTips(text);
    } catch (err) { console.error(err); } finally { setIsGeneratingTips(false); }
  };

  const generateWorkoutWithAi = async (options) => {
    const { level, focus, duration } = options;
    const prompt = `Create a ${duration} minute ${level} workout focusing on ${focus}. Use only these exercises: ${EXERCISE_LIBRARY.map(e => e.name).join(', ')}. Return ONLY a JSON array: [{"name": "Exercise Name", "value": 30}]. Value is reps or seconds. No preamble.`;
    try {
      const text = await callGemini(prompt, "You are a workout generator. You only output valid JSON arrays.");
      const match = text.match(/\[.*\]/s);
      if (!match) throw new Error("Invalid Format");
      const parsed = JSON.parse(match[0]);
      const valid = parsed.map(item => {
        const libraryMatch = EXERCISE_LIBRARY.find(ex => ex.name.toLowerCase() === item.name.toLowerCase());
        if (!libraryMatch) return null;
        return {
          ...libraryMatch,
          duration: libraryMatch.type === 'time' ? (Number(item.value) || 30) : 0,
          count: libraryMatch.type === 'reps' ? (Number(item.value) || 10) : 0
        };
      }).filter(Boolean);
      return valid;
    } catch (err) { throw new Error("AI failed to generate session."); }
  };

  const startWorkout = (routine) => {
    setActiveWorkout({
      ...routine,
      startTime: Date.now(),
      currentExIndex: 0,
      exercises: routine.exercises.map(ex => ({ ...ex, completed: false }))
    });
    setAiTips(null);
    fetchAiTips(routine.name, routine.exercises);
    setView('live');
  };

  const deleteRoutine = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'routines', id));
      notify("Routine deleted");
      setView('home');
    } catch (e) { notify("Error deleting routine", "error"); }
  };

  const finishWorkout = async () => {
    if (!user || !activeWorkout) return;
    const duration = Math.floor((Date.now() - activeWorkout.startTime) / 60000);
    const calories = (duration * 8.5).toFixed(1); 
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
        name: activeWorkout.name, date: Date.now(), duration, calories, exercises: activeWorkout.exercises.length
      });
      notify("Workout complete!");
      setActiveWorkout(null);
      setView('home');
    } catch (e) { notify("Could not save history.", "error"); }
  };

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-[#e8ff47] font-bebas text-4xl animate-pulse">REPONE</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24 selection:bg-[#e8ff47] selection:text-black overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;800&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>

      {/* Tutorial Video Overlay */}
      {tutorialVideoId && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
           <button onClick={() => setTutorialVideoId(null)} className="absolute top-6 right-6 p-3 bg-zinc-900 rounded-full text-white active:scale-90 transition-all z-[110]">
             <X size={24} />
           </button>
           <div className="w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950">
              <iframe 
                width="100%" height="100%" 
                src={`https://www.youtube.com/embed/${tutorialVideoId}?rel=0&modestbranding=1&autohide=1&showinfo=0&autoplay=1`} 
                title="Workout Tutorial" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
           </div>
           <p className="mt-8 text-zinc-500 font-bold uppercase tracking-widest text-xs">Closing in {tutorialVideoId ? '...' : ''}</p>
           <div className="fixed inset-0 -z-10" onClick={() => setTutorialVideoId(null)} />
        </div>
      )}

      {notification && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-8 duration-300 ${notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#e8ff47] text-black'}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-xs font-bold uppercase tracking-tight">{notification.msg}</span>
        </div>
      )}

      <header className="px-6 pt-12 pb-4 flex justify-between items-center">
        <h1 className="font-bebas text-4xl tracking-wider leading-none">REP<span className="text-[#e8ff47]">ONE</span></h1>
        <div className="flex gap-4">
           <button onClick={() => setView('stats')} className="text-zinc-500 hover:text-[#e8ff47] transition-colors"><BarChart2 size={20} /></button>
           {activeWorkout && view !== 'live' && (
            <button onClick={() => setView('live')} className="text-[#e8ff47] animate-pulse"><Zap size={20} fill="currentColor" /></button>
          )}
        </div>
      </header>

      <main className="px-6 max-w-lg mx-auto">
        {view === 'home' && <Home routines={routines} history={history} setView={setView} setSelectedRoutine={setSelectedRoutine} />}
        {view === 'preview' && <RoutinePreview routine={selectedRoutine} onStart={() => startWorkout(selectedRoutine)} onDelete={() => deleteRoutine(selectedRoutine.id)} onBack={() => setView('home')} onShowTutorial={setTutorialVideoId} />}
        {view === 'live' && <LiveWorkout workout={activeWorkout} setWorkout={setActiveWorkout} onFinish={finishWorkout} onCancel={() => setView('home')} aiTips={aiTips} isGenerating={isGeneratingTips} onShowTutorial={setTutorialVideoId} />}
        {view === 'history' && <HistoryView history={history} />}
        {view === 'stats' && <Stats history={history} />}
        {view === 'builder' && <Builder user={user} setView={setView} generateWithAi={generateWorkoutWithAi} notify={notify} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-zinc-900 px-10 py-5 flex justify-between items-center z-50">
        <NavIcon icon={<Layout />} active={view === 'home'} onClick={() => setView('home')} />
        <NavIcon icon={<History />} active={view === 'history'} onClick={() => setView('history')} />
        <NavIcon icon={<PlusCircle />} active={view === 'builder'} onClick={() => setView('builder')} size={30} />
        <NavIcon icon={<BarChart2 />} active={view === 'stats'} onClick={() => setView('stats')} />
      </nav>
    </div>
  );
}

function NavIcon({ icon, active, onClick, size = 22 }) {
  return (
    <button onClick={onClick} className={`transition-all duration-300 ${active ? 'text-[#e8ff47] scale-110' : 'text-zinc-600'}`}>
      {React.cloneElement(icon, { size, strokeWidth: active ? 2.5 : 2 })}
    </button>
  );
}

function Home({ routines, history, setView, setSelectedRoutine }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Dashboard</h2>
        <div className="text-zinc-500 text-xs font-medium">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
      <div className="space-y-4">
        {routines.map(r => (
          <div key={r.id} onClick={() => { setSelectedRoutine(r); setView('preview'); }} className="bg-[#141414] rounded-[24px] overflow-hidden border border-zinc-800/50 group active:scale-[0.98] transition-transform cursor-pointer">
            <div className="p-5 flex gap-5">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl shrink-0">{r.exercises[0]?.icon || '🔥'}</div>
              <div className="flex flex-col justify-center flex-1">
                <h3 className="text-lg font-bold leading-tight mb-1">{r.name}</h3>
                <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Clock size={12} /> {r.exercises.length * 2} MIN</span>
                  <span className="flex items-center gap-1"><Zap size={12} /> {r.exercises.length * 15} CAL</span>
                </div>
              </div>
              <div className="self-center p-2 text-zinc-700"><ChevronRight size={24} /></div>
            </div>
          </div>
        ))}
        <button onClick={() => setView('builder')} className="w-full py-8 border-2 border-dashed border-zinc-800 rounded-[24px] text-zinc-600 font-bold uppercase text-[10px] tracking-widest flex flex-col items-center gap-2 hover:border-zinc-600 transition-colors">
          <Plus size={20} /> Build New Routine
        </button>
      </div>
    </div>
  );
}

function RoutinePreview({ routine, onStart, onDelete, onBack, onShowTutorial }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"><ChevronLeft size={24} /></button>
        <h2 className="font-bebas text-4xl">Routine Preview</h2>
      </div>
      <div className="bg-[#141414] border border-zinc-800 rounded-[32px] p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-start">
          <div><h3 className="text-2xl font-bold text-white mb-1">{routine.name}</h3><p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{routine.exercises.length} Exercises total</p></div>
          <button onClick={() => { if(confirm("Delete routine?")) onDelete(); }} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors"><Trash2 size={20} /></button>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Workout Lineup</p>
          <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {routine.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                <span className="text-2xl">{ex.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-zinc-200">{ex.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{ex.muscle}</p>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={(e) => { e.stopPropagation(); onShowTutorial(ex.videoId); }} className="p-2 bg-zinc-800/50 text-zinc-500 hover:text-[#e8ff47] rounded-lg transition-colors">
                     <Youtube size={16} />
                   </button>
                   <p className="text-xs font-bebas text-[#e8ff47] tracking-wider min-w-[50px] text-right">
                     {ex.type === 'time' ? `${ex.duration}S` : `${ex.count}R`}
                   </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onStart} className="w-full py-5 bg-[#e8ff47] text-black rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl shadow-[#e8ff47]/10 active:scale-95 transition-all flex items-center justify-center gap-3">
          <Play size={20} fill="currentColor" /> Start Session
        </button>
      </div>
    </div>
  );
}

function LiveWorkout({ workout, setWorkout, onFinish, onCancel, aiTips, isGenerating, onShowTutorial }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const REST_DURATION = 15;
  const currentEx = workout.exercises[workout.currentExIndex];

  useEffect(() => {
    if (isResting) setTimeLeft(REST_DURATION);
    else if (currentEx.type === 'time') setTimeLeft(currentEx.duration);
    else setTimeLeft(0); 
  }, [workout.currentExIndex, isResting]);

  useEffect(() => {
    if (isPaused) return;
    if (currentEx.type === 'reps' && !isResting) return; 
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); handleTimerEnd(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, currentEx, isResting, workout.currentExIndex]);

  const handleTimerEnd = () => {
    if (isResting) setIsResting(false);
    else goToNextPhase();
  };

  const goToNextPhase = () => {
    if (workout.currentExIndex < workout.exercises.length - 1) {
      if (!isResting) setIsResting(true); 
      else { setIsResting(false); setWorkout({ ...workout, currentExIndex: workout.currentExIndex + 1 }); }
    } else onFinish();
  };

  const manualNext = () => {
    if (workout.currentExIndex < workout.exercises.length - 1) {
      setIsResting(false);
      setWorkout({ ...workout, currentExIndex: workout.currentExIndex + 1 });
    } else onFinish();
  };

  const manualPrev = () => {
    if (workout.currentExIndex > 0) {
      setIsResting(false);
      setWorkout({ ...workout, currentExIndex: workout.currentExIndex - 1 });
    }
  };

  const addRestTime = () => {
    setTimeLeft(prev => prev + 10);
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;
  const progress = isResting ? (timeLeft/REST_DURATION)*100 : currentEx.type === 'time' ? (timeLeft/currentEx.duration)*100 : 100;

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col p-8 pb-12 animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <div className="flex justify-between items-start mb-8">
        <button onClick={onCancel} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-1">{isResting ? "REST" : currentEx.name}</h2>
          <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{workout.currentExIndex + 1} / {workout.exercises.length}</span>
        </div>
        <button onClick={() => onShowTutorial(currentEx.videoId)} className="p-2 text-[#e8ff47] bg-[#e8ff47]/10 rounded-full active:scale-90 transition-all"><Youtube size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="text-zinc-800 font-black text-[100px] md:text-[140px] absolute opacity-10 blur-sm pointer-events-none uppercase tracking-tighter leading-none text-center">{isResting ? "RECOVER" : currentEx.muscle}</div>
        
        <div className={`text-[120px] font-bebas tracking-widest leading-none transition-colors ${isResting ? 'text-[#e8ff47]' : 'text-white'}`}>
          {currentEx.type === 'time' || isResting ? formatTime(timeLeft) : currentEx.count}
        </div>

        <div className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
          {isResting ? <><Coffee size={14} /> Next: {workout.exercises[workout.currentExIndex + 1]?.name}</> : (currentEx.type === 'time' ? `Time Remaining` : `Goal Reps`)}
        </div>

        {isResting && (
          <button 
            onClick={addRestTime}
            className="mt-8 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-full flex items-center gap-2 text-[#e8ff47] text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
          >
            <TimerReset size={14} /> +10 Sec Rest
          </button>
        )}

        {!isResting && (
          <div className="mt-12 w-full max-w-xs">
            <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-5 relative overflow-hidden min-h-[100px] flex flex-col justify-center shadow-2xl">
              <div className="flex items-center gap-2 text-[#e8ff47] text-[10px] font-black uppercase tracking-widest mb-2"><Sparkles size={14} fill="currentColor" /> AI Coach</div>
              {isGenerating ? (
                <div className="space-y-2 animate-pulse"><div className="h-2 bg-zinc-800 rounded w-full"></div><div className="h-2 bg-zinc-800 rounded w-3/4"></div></div>
              ) : aiTips ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 leading-relaxed italic">{aiTips}</p>
                  <button onClick={() => onShowTutorial(currentEx.videoId)} className="flex items-center gap-2 text-[10px] text-[#e8ff47] font-bold uppercase mt-2">
                    <Youtube size={12} /> Tutorial Video
                  </button>
                </div>
              ) : <p className="text-xs text-zinc-600 italic">Crush it!</p>}
            </div>
          </div>
        )}
      </div>

      {/* Nav Controls - Always Visible */}
      <div className="flex items-center justify-center gap-10 mt-12">
        <button onClick={manualPrev} className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white active:scale-90 transition-transform">
          <SkipBack size={24} fill="currentColor" />
        </button>
        
        <button 
          onClick={() => (currentEx.type === 'reps' && !isResting) ? goToNextPhase() : setIsPaused(!isPaused)} 
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all ${currentEx.type === 'reps' && !isResting ? 'bg-emerald-500' : 'bg-[#007AFF]'}`}
        >
          {currentEx.type === 'reps' && !isResting ? <Check size={40} strokeWidth={3} /> : (isPaused ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />)}
        </button>

        <button onClick={manualNext} className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white active:scale-90 transition-transform">
          <SkipForward size={24} fill="currentColor" />
        </button>
      </div>

      <div className="mt-12 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${isResting ? 'bg-[#e8ff47]' : 'bg-[#007AFF]'}`} 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}

function Builder({ user, setView, generateWithAi, notify }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLevel, setAiLevel] = useState('Beginner');
  const [aiFocus, setAiFocus] = useState('Full Body');
  const [aiDuration, setAiDuration] = useState('10');

  const save = async () => {
    if (!name || selected.length === 0) { notify("Add a name and exercises!", "error"); return; }
    const sanitizedExercises = selected.map(ex => ({
      name: ex.name, muscle: ex.muscle, icon: ex.icon, type: ex.type,
      duration: Number(ex.duration) || 0, count: Number(ex.count) || 0,
      videoId: ex.videoId, id: ex.id || Date.now().toString() + Math.random()
    }));
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'routines'), { name, exercises: sanitizedExercises, created: Date.now() });
      notify("Routine saved!");
      setView('home');
    } catch (e) { notify("Firestore error.", "error"); }
  };

  const handleAiGenerate = async () => {
    setIsAiLoading(true);
    try {
      const result = await generateWithAi({ level: aiLevel, focus: aiFocus, duration: aiDuration });
      setSelected(result);
      if (!name) setName(`${aiFocus} · ${aiLevel}`);
      notify("AI Session Generated!");
    } catch (e) { notify("AI generation failed.", "error"); } finally { setIsAiLoading(false); }
  };

  const filtered = EXERCISE_LIBRARY.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.muscle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-2"><button onClick={() => setView('home')}><ChevronLeft /></button><h2 className="font-bebas text-4xl">Builder</h2></div>
      <div className="bg-[#141414] border border-zinc-800 rounded-[32px] p-6 shadow-2xl space-y-6">
        <div className="flex items-center gap-2 text-[#e8ff47] text-[10px] font-black uppercase tracking-[0.2em]"><Sparkles size={14} fill="currentColor" /> Gemini AI Assist</div>
        <SelectionGroup label="Level" options={['Beginner', 'Intermediate', 'Advanced']} active={aiLevel} onChange={setAiLevel} />
        <SelectionGroup label="Focus" options={['Full Body', 'Lower Body', 'Upper Body', 'Core']} active={aiFocus} onChange={setAiFocus} />
        <SelectionGroup label="Minutes" options={['5', '10', '15', '20']} active={aiDuration} onChange={setAiDuration} />
        <button onClick={handleAiGenerate} disabled={isAiLoading} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-[#007AFF] text-white active:scale-95 transition-all">
          {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} Generate
        </button>
      </div>
      <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <input placeholder="Session Name..." value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-xl font-bold outline-none focus:border-[#e8ff47]" />
        <div className="space-y-2">
          {selected.map((ex, i) => (
            <div key={i} className="bg-black p-4 rounded-xl flex justify-between items-center border border-zinc-800"><div className="flex items-center gap-3"><span className="text-xl">{ex.icon}</span><div><span className="font-bold text-sm block">{ex.name}</span><span className="text-[10px] text-zinc-500 font-bold tracking-widest">{ex.type === 'time' ? `${ex.duration}s` : `${ex.count} Reps`}</span></div></div><button onClick={() => setSelected(selected.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-500"><Trash2 size={16} /></button></div>
          ))}
        </div>
        <div className="relative"><input placeholder="Search & Add..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 pl-12 rounded-xl text-sm outline-none focus:border-[#e8ff47]" /><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} /></div>
        {search && <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">{filtered.map(ex => (
          <button key={ex.id} onClick={() => { setSelected([...selected, { ...ex, duration: ex.duration || 0, count: ex.count || 0 }]); setSearch(''); }} className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-xl hover:border-[#e8ff47]"><div className="flex items-center gap-3"><span className="text-xl">{ex.icon}</span><span className="text-sm font-bold">{ex.name}</span></div><Plus size={18} className="text-[#e8ff47]" /></button>
        ))}</div>}
      </div>
      <button onClick={save} className="w-full py-5 bg-[#e8ff47] text-black rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl shadow-[#e8ff47]/10 active:scale-95 transition-all">Save Routine</button>
    </div>
  );
}

function SelectionGroup({ label, options, active, onChange }) {
  return (
    <div className="space-y-3"><div className="flex justify-between items-center px-1"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p><p className="text-[10px] font-black text-[#e8ff47] uppercase tracking-widest">{active}</p></div><div className="flex flex-wrap gap-2">{options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${active === opt ? 'bg-[#e8ff47] text-black border-[#e8ff47]' : 'bg-[#141414] text-zinc-400 border-zinc-800'}`}>{opt}</button>
    ))}</div></div>
  );
}

function HistoryView({ history }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12"><h2 className="font-bebas text-4xl">History</h2><div className="grid gap-3">{history.map(h => (
      <div key={h.id} className="bg-[#141414] p-5 rounded-[24px] border border-zinc-800/50 flex justify-between items-center"><div><h4 className="font-bold text-sm mb-1">{h.name}</h4><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{new Date(h.date).toLocaleDateString()} • {h.duration} MIN</p></div><div className="text-right"><p className="text-[#e8ff47] font-bebas text-2xl">{h.calories} KCAL</p></div></div>
    ))}</div></div>
  );
}

function Stats({ history }) {
  const chartData = useMemo(() => history.slice(0, 10).reverse().map(h => ({ d: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), v: parseFloat(h.calories) || 0 })), [history]);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12"><h2 className="font-bebas text-4xl">Performance</h2><div className="bg-[#141414] p-6 rounded-[28px] border border-zinc-800/50">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 text-center">Calories Burned (Last 10)</h3>
      <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="prog" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8ff47" stopOpacity={0.2}/><stop offset="95%" stopColor="#e8ff47" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="d" hide /><Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '16px', border: '1px solid #333', fontSize: '10px' }} itemStyle={{ color: '#e8ff47', fontWeight: '900' }} /><Area type="monotone" dataKey="v" stroke="#e8ff47" strokeWidth={3} fillOpacity={1} fill="url(#prog)" /></AreaChart></ResponsiveContainer></div>
    </div><div className="grid grid-cols-2 gap-4 text-center">
      <div className="bg-[#141414] p-5 rounded-[24px] border border-zinc-800/50"><p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Burn</p><p className="font-bebas text-3xl text-[#e8ff47]">{history.reduce((a,c) => a + (parseFloat(c.calories) || 0), 0).toFixed(0)}</p></div>
      <div className="bg-[#141414] p-5 rounded-[24px] border border-zinc-800/50"><p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Avg Durn</p><p className="font-bebas text-3xl text-[#e8ff47]">{history.length ? (history.reduce((a,c) => a + c.duration, 0) / history.length).toFixed(0) : 0}M</p></div>
    </div></div>
  );
}