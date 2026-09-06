import React from 'react';
import { Navigation, MapPin, Share2, MessageSquare, Phone, Compass, AlertTriangle, ListChecks, History } from 'lucide-react';

export default function Navbar({ currentUser, friendUser, activeTripCode, destination, itineraryCount, onOpenPlacesSearch, onOpenShareModal, onOpenChecklist, onOpenSavedTrips, onOpenSos, onToggleChat, unreadCount, onCallFriend, onLogout }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between z-30 shadow-lg select-none">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
          <Navigation className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">Tripeye</span>
            {activeTripCode && (
              <button onClick={onOpenSavedTrips} className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition flex items-center gap-1" title="Saved Trips">
                <span>{activeTripCode}</span>
                <History className="w-2.5 h-2.5 opacity-60" />
              </button>
            )}
            <span className="hidden md:flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sharing
            </span>
          </div>
          <button onClick={onOpenPlacesSearch} className="text-[11px] text-slate-300 hover:text-sky-400 flex items-center gap-1 font-semibold truncate max-w-[140px] sm:max-w-[220px] transition text-left">
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">{destination ? destination.name : 'Choose Places'}</span>
            <span className="text-[10px] text-sky-400 underline ml-0.5">change</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button onClick={onOpenPlacesSearch} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition active:scale-95">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">All Places</span>
          {itineraryCount > 1 && <span className="ml-0.5 px-1.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-extrabold">{itineraryCount}</span>}
        </button>

        <button onClick={onOpenChecklist} className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition">
          <ListChecks className="w-3.5 h-3.5 text-amber-400" /> Checklist
        </button>

        <button onClick={onOpenShareModal} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition active:scale-95">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>

        <button onClick={onCallFriend} disabled={!friendUser}
          className={"flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 " + (friendUser ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed')}>
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span className="hidden md:inline">{friendUser ? 'Call ' + friendUser.name.split(' ')[0] : 'Call'}</span>
        </button>

        <button onClick={onOpenSos} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-extrabold transition active:scale-95">
          <AlertTriangle className="w-3.5 h-3.5" /> SOS
        </button>

        <button onClick={onToggleChat} className="relative flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chat</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold animate-bounce">{unreadCount}</span>
          )}
        </button>

        {currentUser && (
          <div onClick={onLogout} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center text-xs font-bold text-sky-400 cursor-pointer transition ml-1"
            title={"Logged in as " + currentUser.name + ". Click to logout."}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
