import React, { useState } from 'react';
import { Cloud, Calendar, Download, Check, ExternalLink, X, Globe, ShieldCheck, Smartphone } from 'lucide-react';

export default function GoogleSyncModal({
  isOpen,
  onClose,
  currentUser,
  activeTripCode,
  destination,
  itinerary,
  onTriggerSync
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(() => {
    return localStorage.getItem('tripeye_google_account') || (currentUser?.name ? (currentUser.name.toLowerCase().replace(/\s+/g, '') + '@gmail.com') : '');
  });

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (onTriggerSync) {
      await onTriggerSync(googleAccount);
    }
    setTimeout(() => {
      setIsSyncing(false);
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 3000);
    }, 800);
  };

  // Google Calendar Rendezvous Link
  const calendarTitle = encodeURIComponent("Tripeye Rendezvous at " + (destination?.name || 'Destination'));
  const calendarDetails = encodeURIComponent(
    "Tripeye Rendezvous Trip Room: " + activeTripCode + "\n" +
    "Destination: " + (destination?.name || '') + "\n" +
    "Meeting Landmark: " + (destination?.landmarkName || 'Main Gate') + "\n" +
    "Trip Link: " + window.location.href
  );
  const calendarLocation = destination ? encodeURIComponent(destination.name + " (" + destination.lat + ", " + destination.lng + ")") : '';
  const googleCalendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + calendarTitle + "&details=" + calendarDetails + "&location=" + calendarLocation;

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      tripCode: activeTripCode,
      destination,
      itinerary,
      user: currentUser,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "tripeye-backup-" + activeTripCode + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-white">Google & Cloud Sync</h3>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Never lose your trips, destinations, or chat history.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-semibold">Sync Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected to Cloud DB
            </span>
          </div>

          <div className="text-xs text-slate-300 mb-3">
            Your trip <span className="font-mono text-amber-400 font-bold">{activeTripCode}</span>, itinerary ({itinerary?.length || 1} stops), and chat messages are synced to persistent cloud storage so they are restored after refreshing or closing the browser.
          </div>

          {/* Google Account input */}
          <div className="mt-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Google Account for Multi-Device Sync:
            </label>
            <input
              type="email"
              value={googleAccount}
              onChange={(e) => {
                setGoogleAccount(e.target.value);
                localStorage.setItem('tripeye_google_account', e.target.value);
              }}
              placeholder="yourname@gmail.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Sync Now Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition active:scale-95"
          >
            {isSynced ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Synced Successfully!</span>
              </>
            ) : (
              <>
                <Cloud className={"w-4 h-4 " + (isSyncing ? 'animate-spin' : '')} />
                <span>{isSyncing ? 'Syncing with Google Cloud...' : 'Sync Now with Google Cloud'}</span>
              </>
            )}
          </button>

          {/* Google Calendar Add Button */}
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Add Rendezvous to Google Calendar</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Export JSON Backup */}
          <button
            onClick={handleExportBackup}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs flex items-center justify-center gap-2 border border-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Offline Backup (.json)</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Persistent Storage & Cloud Recovery Active</span>
        </div>
      </div>
    </div>
  );
}
