import React, { useState } from 'react';
import { Plus, LogIn, MapPin, Copy, Check, Users, Sparkles } from 'lucide-react';
import { PRESET_DESTINATIONS } from '../utils/geo';

export default function TripRoomModal({ isOpen, onClose, onCreateTrip, onJoinTrip, activeTripCode }) {
  const [tab, setTab] = useState('create');
  const [selectedDestId, setSelectedDestId] = useState(PRESET_DESTINATIONS[0].id);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    const dest = PRESET_DESTINATIONS.find(d => d.id === selectedDestId) || PRESET_DESTINATIONS[0];
    const generatedCode = 'TRIP-' + Math.floor(1000 + Math.random() * 9000);
    onCreateTrip(generatedCode, dest);
    onClose();
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    onJoinTrip(code);
    onClose();
  };

  const shareUrl = `${window.location.origin}/?trip=${activeTripCode}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Collaborative Trip Room
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect with your friend to share real-time GPS & call each other
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-950 rounded-xl mt-4 border border-slate-800">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'create' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Trip</span>
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'join' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join Existing Trip</span>
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Select Temple / Meetup Destination
              </label>
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {PRESET_DESTINATIONS.map(d => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                    {d.name} ({d.landmarkName})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-amber-400 block">How it works:</span>
              <p>1. Clicking create will generate a unique 6-digit Trip Code.</p>
              <p>2. Send the link or code to your friend.</p>
              <p>3. Once they join, you both see each other live on the map and can call each other!</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition"
            >
              Start New Trip Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter Trip Code or Room Link
              </label>
              <input
                type="text"
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="e.g. TRIP-4821"
                className="w-full uppercase font-mono tracking-widest bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm shadow-md transition hover:brightness-110"
            >
              Connect to Trip
            </button>
          </form>
        )}

        {/* Current Active Trip Share Info */}
        {activeTripCode && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Active Room: </span>
              <span className="font-mono font-bold text-amber-400">{activeTripCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copied Link' : 'Copy Invite Link'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}