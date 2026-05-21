import { useState, useEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '../store/useStore';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Users, 
  UserCheck, 
  Terminal, 
  Database, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Flame,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const store = useStore();
  
  // Local form states
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  
  const [cycleName, setCycleName] = useState('');
  const [cycleStart, setCycleStart] = useState(new Date().toISOString().split('T')[0]);
  const [cycleEnd, setCycleEnd] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionStatus, setSessionStatus] = useState<'planned' | 'completed' | 'skipped'>('planned');
  
  const [customUserId, setCustomUserId] = useState('');
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize store and connection listeners
  useEffect(() => {
    store.initStore();

    const handleOnline = () => store.setOnlineStatus(true);
    const handleOffline = () => store.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll diagnostics console
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.logs]);

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName.trim()) return;
    await store.addWorkoutOffline(workoutName, workoutDesc);
    setWorkoutName('');
    setWorkoutDesc('');
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName.trim()) return;
    await store.addCycleOffline(cycleName, cycleStart, cycleEnd);
    setCycleName('');
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) return;
    await store.addTrainingSessionOffline(sessionName, sessionDate, sessionStatus);
    setSessionName('');
  };

  const handleCustomUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUserId.trim()) return;
    await store.changeUser(customUserId);
    setCustomUserId('');
  };

  // Hard Reset Local Database for test scenarios
  const handleWipeDatabase = async () => {
    if (confirm('Naozaj chcete vymazať celú lokálnu databázu IndexedDB pre toto testovanie?')) {
      const { localDb } = await import('../db/localDb');
      await localDb.transaction('rw', [
        localDb.users,
        localDb.exercises,
        localDb.workouts,
        localDb.cycles,
        localDb.mesocycles,
        localDb.microcycles,
        localDb.trainingSessions,
        localDb.syncQueue
      ], async () => {
        await localDb.users.clear();
        await localDb.exercises.clear();
        await localDb.workouts.clear();
        await localDb.cycles.clear();
        await localDb.mesocycles.clear();
        await localDb.microcycles.clear();
        await localDb.trainingSessions.clear();
        await localDb.syncQueue.clear();
      });
      store.addLog('Lokálna databáza IndexedDB kompletne vymazaná.', 'warn');
      await store.loadLocalData();
    }
  };

  // Standard user IDs for quick impersonation
  const standardCoach = 'c2069e2c-381c-43df-8121-66385f09623e';
  const standardAthlete = 'a7183c5c-381c-43df-8121-66385f09623e';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] via-[#12161f] to-[#0a0c10] text-[#f3f6f9] p-4 sm:p-6 md:p-8 font-sans selection:bg-[#00f2fe]/30 selection:text-white">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00f2fe]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ff5e62]/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* TOP HEADER STATUS BANNER */}
      <header className="max-w-7xl mx-auto mb-8 glass-panel rounded-2xl p-6 relative overflow-hidden animate-[pulseGlow_3s_infinite_alternate]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f2fe] to-transparent"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#12161f]/80 p-3 rounded-xl border border-white/5 shadow-inner">
              <Flame className="w-8 h-8 text-[#00f2fe] drop-shadow-[0_0_8px_rgba(0,242,254,0.5)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#8292a6] font-semibold">Dev Test Dashboard</span>
                <span className="bg-[#00f2fe]/10 text-[#00f2fe] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#00f2fe]/20">Local-First</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#f3f6f9] to-[#8292a6] bg-clip-text text-transparent font-outfit">
                Tréninkový Plánovač
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center">
            {/* CONNECTION STATUS COMPONENT */}
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
              store.isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {store.isOnline ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-[#8292a6]">Internet Status</div>
                <div className="text-xs font-bold font-outfit">
                  {store.isOnline ? 'ONLINE' : 'OFFLINE'} 
                  {store.isSimulatedOffline && <span className="text-[10px] ml-1 text-amber-400 font-semibold">(Simulováno)</span>}
                </div>
              </div>
            </div>

            {/* TOGGLE SIMULATED OFFLINE */}
            <button
              onClick={() => store.setSimulatedOffline(!store.isSimulatedOffline)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all duration-300 cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 ${
                store.isSimulatedOffline 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-500/10 border border-orange-500/30' 
                  : 'bg-[#1b202c] hover:bg-[#1b202c]/80 text-[#f3f6f9] border border-white/5 hover:border-white/10'
              }`}
            >
              {store.isSimulatedOffline ? 'Zapnout Připojení' : 'Simulovat Offline'}
            </button>

            {/* SYNC NOW BUTTON */}
            <button
              onClick={() => store.triggerLocalSync()}
              disabled={store.isSyncing || store.isSimulatedOffline}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0a0c10] font-bold text-xs tracking-wider transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${store.isSyncing ? 'animate-spin' : ''}`} />
              {store.isSyncing ? 'Synchronizace...' : 'Synchronizovat'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: DIAGNOSTICS & CONTROLS (7/12 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-8">

          {/* DIAGNOSTIC CONSOLE LOG VIEWER */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col flex-1 min-h-[400px]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#00f2fe]" />
                <h2 className="font-bold text-sm tracking-wider uppercase text-[#8292a6] font-outfit">Diagnostická Konzola (Store)</h2>
              </div>
              <button 
                onClick={() => store.clearLogs()}
                className="text-xs text-[#8292a6] hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1 rounded-md"
              >
                Vymazat
              </button>
            </div>

            {/* LOG SCREEN */}
            <div className="bg-[#07090d] border border-white/5 rounded-xl p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-y-auto max-h-[300px] flex-1 flex flex-col gap-1.5 shadow-inner custom-scrollbar">
              {store.logs.length === 0 ? (
                <div className="text-center text-[#8292a6]/50 my-auto py-12">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Konzola je prázdná. Provedte nějakou akci!
                </div>
              ) : (
                [...store.logs].reverse().map((log, idx) => {
                  let badgeColor = 'text-cyan-400';
                  if (log.type === 'success') badgeColor = 'text-emerald-400';
                  if (log.type === 'warn') badgeColor = 'text-amber-400';
                  if (log.type === 'error') badgeColor = 'text-rose-400';

                  return (
                    <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-white/[0.02]">
                      <span className="text-[#8292a6]/50 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`${badgeColor} font-semibold uppercase text-[10px] tracking-wide select-none min-w-[55px]`}>
                        {log.type}:
                      </span>
                      <span className="text-[#f3f6f9] flex-1 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* USER IMPERSONATION BAR */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <Users className="w-5 h-5 text-[#00f2fe]" />
              <h2 className="font-bold text-sm tracking-wider uppercase text-[#8292a6] font-outfit">Impersonace Uživatele</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <button
                onClick={() => store.changeUser(standardCoach)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                  store.activeUserId === standardCoach
                    ? 'bg-gradient-to-r from-[#00f2fe]/20 to-[#4facfe]/20 text-[#00f2fe] border border-[#00f2fe]/40 shadow-[0_0_15px_rgba(0,242,254,0.1)]'
                    : 'bg-[#1b202c]/50 text-[#8292a6] hover:text-[#f3f6f9] border border-white/5 hover:border-white/10'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Trenér (Coach)
              </button>

              <button
                onClick={() => store.changeUser(standardAthlete)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                  store.activeUserId === standardAthlete
                    ? 'bg-gradient-to-r from-[#ff5e62]/20 to-[#ff9f43]/20 text-[#ff5e62] border border-[#ff5e62]/40 shadow-[0_0_15px_rgba(255,94,98,0.1)]'
                    : 'bg-[#1b202c]/50 text-[#8292a6] hover:text-[#f3f6f9] border border-white/5 hover:border-white/10'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Atlet (Athlete)
              </button>
            </div>

            <form onSubmit={handleCustomUserSubmit} className="flex gap-2">
              <input
                type="text"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                placeholder="Vložit vlastní User UUID..."
                className="flex-1 bg-[#0a0c10] border border-white/5 focus:border-[#00f2fe]/50 text-xs px-4 py-3 rounded-xl text-[#f3f6f9] outline-none font-mono focus:shadow-[0_0_10px_rgba(0,242,254,0.1)] transition-all"
              />
              <button 
                type="submit"
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-xs font-semibold hover:text-[#00f2fe] transition-colors cursor-pointer"
              >
                Přepnout
              </button>
            </form>
            <div className="mt-3 text-[10px] text-[#8292a6] font-mono flex items-center justify-between">
              <span>Aktuální ID: {store.activeUserId}</span>
              <button 
                onClick={handleWipeDatabase}
                className="text-rose-400/70 hover:text-rose-400 font-semibold cursor-pointer underline decoration-dotted"
              >
                Wipe Local DB
              </button>
            </div>
          </div>

          {/* ACTION CREATOR: OFFLINE MUTATIONS */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <Plus className="w-5 h-5 text-[#00f2fe]" />
              <h2 className="font-bold text-sm tracking-wider uppercase text-[#8292a6] font-outfit">Simulace Offline CRUD Zápisu</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CREATE WORKOUT FORM */}
              <form onSubmit={handleCreateWorkout} className="bg-[#12161f]/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00f2fe] tracking-wide uppercase font-outfit">Vytvořit Workout</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">Zustand + Dexie</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Název workoutu..."
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="bg-[#0a0c10] border border-white/5 focus:border-[#00f2fe]/40 text-xs px-3 py-2 rounded-lg text-[#f3f6f9] outline-none"
                />
                <textarea
                  placeholder="Popis workoutu..."
                  value={workoutDesc}
                  onChange={(e) => setWorkoutDesc(e.target.value)}
                  className="bg-[#0a0c10] border border-white/5 focus:border-[#00f2fe]/40 text-xs px-3 py-2 rounded-lg text-[#f3f6f9] outline-none h-14 resize-none"
                />
                <button
                  type="submit"
                  className="bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 text-[#00f2fe] text-xs font-semibold py-2 rounded-lg border border-[#00f2fe]/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Uložit do Outboxu
                </button>
              </form>

              {/* CREATE CYCLE FORM */}
              <form onSubmit={handleCreateCycle} className="bg-[#12161f]/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ff5e62] tracking-wide uppercase font-outfit">Vytvořit Tréninkový Cyklus</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">Zustand + Dexie</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Název cyklu (např. Jarní objem)..."
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  className="bg-[#0a0c10] border border-white/5 focus:border-[#ff5e62]/40 text-xs px-3 py-2 rounded-lg text-[#f3f6f9] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#8292a6] uppercase tracking-wider">Start</label>
                    <input
                      type="date"
                      required
                      value={cycleStart}
                      onChange={(e) => setCycleStart(e.target.value)}
                      className="bg-[#0a0c10] border border-white/5 text-[10px] px-2 py-1.5 rounded-lg text-[#f3f6f9] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#8292a6] uppercase tracking-wider">Konec</label>
                    <input
                      type="date"
                      required
                      value={cycleEnd}
                      onChange={(e) => setCycleEnd(e.target.value)}
                      className="bg-[#0a0c10] border border-white/5 text-[10px] px-2 py-1.5 rounded-lg text-[#f3f6f9] outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#ff5e62]/10 hover:bg-[#ff5e62]/20 text-[#ff5e62] text-xs font-semibold py-2 rounded-lg border border-[#ff5e62]/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Uložit do Outboxu
                </button>
              </form>

              {/* CREATE TRAINING SESSION FORM */}
              <form onSubmit={handleCreateSession} className="bg-[#12161f]/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1dd1a1] tracking-wide uppercase font-outfit">Naplánovat Training Session</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">Zustand + Dexie</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Název relace (např. Dřepy Těžce)..."
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="bg-[#0a0c10] border border-white/5 focus:border-[#1dd1a1]/40 text-xs px-3 py-2 rounded-lg text-[#f3f6f9] outline-none"
                  />
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="bg-[#0a0c10] border border-white/5 focus:border-[#1dd1a1]/40 text-xs px-3 py-2 rounded-lg text-[#f3f6f9] outline-none"
                  />
                  <select
                    value={sessionStatus}
                    onChange={(e: any) => setSessionStatus(e.target.value)}
                    className="bg-[#0a0c10] border border-white/5 focus:border-[#1dd1a1]/40 text-xs px-3 py-2 rounded-lg text-[#f3f6f9] outline-none"
                  >
                    <option value="planned">Planned (Naplánováno)</option>
                    <option value="completed">Completed (Dokončeno)</option>
                    <option value="skipped">Skipped (Vynecháno)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-[#1dd1a1]/10 hover:bg-[#1dd1a1]/20 text-[#1dd1a1] text-xs font-semibold py-2 rounded-lg border border-[#1dd1a1]/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Uložit do Outboxu
                </button>
              </form>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: OUTBOX QUEUE & CACHE INSPECTOR (5/12 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-8">

          {/* OUTBOX SYNCHRONIZATION QUEUE LIST */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#00f2fe]" />
                <h2 className="font-bold text-sm tracking-wider uppercase text-[#8292a6] font-outfit">Outbox Fronta ({store.syncQueueItems.length})</h2>
              </div>
              <span className="text-[10px] text-[#8292a6] uppercase tracking-wider">K odeslání</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {store.syncQueueItems.length === 0 ? (
                <div className="text-center text-[#8292a6]/50 py-10 font-medium">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
                  Vše synchronizováno! Žádné čekající změny.
                </div>
              ) : (
                store.syncQueueItems.map((item, idx) => (
                  <div key={idx} className="bg-[#12161f] border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs hover:border-[#00f2fe]/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.action === 'SAVE' ? 'bg-[#00f2fe]/10 text-[#00f2fe]' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {item.action}
                        </span>
                        <span className="font-bold text-[#f3f6f9]">{item.entityType}</span>
                      </div>
                      <span className="text-[10px] text-[#8292a6] font-mono block mt-1">ID: {item.entityId}</span>
                    </div>
                    <span className="text-[10px] text-[#8292a6] font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LOCAL CACHE INSPECTOR LISTS */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00f2fe]" />
                <h2 className="font-bold text-sm tracking-wider uppercase text-[#8292a6] font-outfit">Lokální IndexedDB Cache</h2>
              </div>
            </div>

            {/* CYCLES */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#ff5e62] flex items-center gap-1.5 font-outfit">
                  <Layers className="w-3.5 h-3.5" /> Cykly ({store.cycles.length})
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {store.cycles.length === 0 ? (
                  <div className="text-xs text-[#8292a6]/50 italic">Žádné tréninkové cykly lokálně v IndexedDB.</div>
                ) : (
                  store.cycles.map((c) => (
                    <div key={c.id} className="bg-[#12161f]/35 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                          {c.synced === 1 ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Synchronizováno" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" title="Zatím nesynchronizováno" />
                          )}
                          <span className="font-bold text-xs truncate text-[#f3f6f9]">{c.name}</span>
                        </div>
                        <span className="text-[10px] text-[#8292a6] font-mono block mt-0.5">{c.startDate} až {c.endDate}</span>
                      </div>
                      <button
                        onClick={() => store.deleteCycleOffline(c.id)}
                        className="text-[#8292a6] hover:text-rose-400 p-1.5 rounded bg-white/5 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WORKOUTS */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#00f2fe] flex items-center gap-1.5 font-outfit">
                  <Sparkles className="w-3.5 h-3.5" /> Workouty ({store.workouts.length})
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {store.workouts.length === 0 ? (
                  <div className="text-xs text-[#8292a6]/50 italic">Žádné workouty lokálně v IndexedDB.</div>
                ) : (
                  store.workouts.map((w) => (
                    <div key={w.id} className="bg-[#12161f]/35 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                          {w.synced === 1 ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Synchronizováno" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" title="Zatím nesynchronizováno" />
                          )}
                          <span className="font-bold text-xs truncate text-[#f3f6f9]">{w.name}</span>
                        </div>
                        {w.description && <span className="text-[10px] text-[#8292a6] truncate block mt-0.5">{w.description}</span>}
                      </div>
                      <button
                        onClick={() => store.deleteWorkoutOffline(w.id)}
                        className="text-[#8292a6] hover:text-rose-400 p-1.5 rounded bg-white/5 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TRAINING SESSIONS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#1dd1a1] flex items-center gap-1.5 font-outfit">
                  <Activity className="w-3.5 h-3.5" /> Sessions ({store.trainingSessions.length})
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {store.trainingSessions.length === 0 ? (
                  <div className="text-xs text-[#8292a6]/50 italic">Žádné relace lokálně v IndexedDB.</div>
                ) : (
                  store.trainingSessions.map((s) => (
                    <div key={s.id} className="bg-[#12161f]/35 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                          {s.synced === 1 ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Synchronizováno" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" title="Zatím nesynchronizováno" />
                          )}
                          <span className="font-bold text-xs truncate text-[#f3f6f9]">{s.name}</span>
                        </div>
                        <span className="text-[10px] text-[#8292a6] font-mono block mt-0.5">{s.date} - Status: <span className="font-bold">{s.status}</span></span>
                      </div>
                      <button
                        onClick={() => store.deleteTrainingSessionOffline(s.id)}
                        className="text-[#8292a6] hover:text-rose-400 p-1.5 rounded bg-white/5 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto mt-12 text-center text-xs text-[#8292a6] border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} Tréninkový Plánovač | Vyrobeno pro offline-first testování</span>
        <div className="flex items-center gap-3">
          <span className="bg-[#1b202c] text-white px-2 py-0.5 rounded border border-white/5">WSL / Linux Environment</span>
          <span className="bg-[#1b202c] text-white px-2 py-0.5 rounded border border-white/5">IndexedDB + MongoDB Sync</span>
        </div>
      </footer>
    </div>
  );
}
