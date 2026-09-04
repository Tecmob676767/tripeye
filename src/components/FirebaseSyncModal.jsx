import React, { useState } from 'react';
import { Flame, Database, Check, X, ShieldCheck, Settings } from 'lucide-react';
import { getActiveFirebaseConfig, saveCustomFirebaseConfig, syncTripToFirebase } from '../utils/firebase';

export default function FirebaseSyncModal({
  isOpen,
  onClose,
  currentUser,
  activeTripCode,
  destination,
  itinerary,
  checklist,
  messages
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Active');
  const [showConfig, setShowConfig] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState(getActiveFirebaseConfig());
  const [customProjectId, setCustomProjectId] = useState(firebaseConfig.projectId || '');
  const [customDatabaseUrl, setCustomDatabaseUrl] = useState(firebaseConfig.databaseURL || '');

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsSyncing(true);
    const ok = await syncTripToFirebase(activeTripCode, {
      destination,
      itinerary,
      checklist,
      messages,
      user: currentUser
    });
    setTimeout(() => {
      setIsSyncing(false);
      if (ok) {
        setIsSynced(true);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setTimeout(() => setIsSynced(false), 3000);
      }
    }, 600);
  };

  const handleSaveConfig = () => {
    const updated = {
      ...firebaseConfig,
      projectId: customProjectId.trim(),
      databaseURL: customDatabaseUrl.trim()
    };
    saveCustomFirebaseConfig(updated);
    setFirebaseConfig(updated);
    setShowConfig(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-white">Google Firebase Sync</h3>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REALTIME CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-400">Google Firebase Realtime Database & Cloud Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Firebase Node Path:
            </span>
            <span className="font-mono text-amber-400 font-bold text-[11px]">
              /trips/{activeTripCode}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-3 text-center">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-sm font-bold text-white">{itinerary?.length || 1}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Stops</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-sm font-bold text-emerald-400">{checklist?.length || 4}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tasks</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-sm font-bold text-sky-400">{messages?.length || 0}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Messages</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <span>Project: <strong className="text-slate-300 font-mono">{firebaseConfig.projectId}</strong></span>
            <span>Status: <strong className="text-emerald-400">{lastSyncTime}</strong></span>
          </div>
        </div>

        {showConfig ? (
          <div className="mb-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="font-bold text-white flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              Custom Firebase Credentials
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Project ID:</label>
              <input
                type="text"
                value={customProjectId}
                onChange={e => setCustomProjectId(e.target.value)}
                placeholder="tripeye-rendezvous"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Database URL:</label>
              <input
                type="text"
                value={customDatabaseUrl}
                onChange={e => setCustomDatabaseUrl(e.target.value)}
                placeholder="https://tripeye-default-rtdb.firebaseio.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowConfig(false)} className="px-3 py-1 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveConfig} className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold">Save Config</button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2.5">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:opacity-90 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            {isSynced ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Synced to Google Firebase!</span>
              </>
            ) : (
              <>
                <Flame className={"w-4 h-4 fill-current " + (isSyncing ? "animate-bounce" : "")} />
                <span>{isSyncing ? "Writing to Google Firebase Cloud..." : "Sync Now with Google Firebase"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>{showConfig ? "Hide Firebase Config" : "Configure Custom Firebase Project"}</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time persistence via Google Firebase Realtime Database</span>
        </div>
      </div>
    </div>
  );
}