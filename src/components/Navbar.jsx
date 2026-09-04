import React from 'react';
import { Eye, MapPin, Share2, MessageSquare, Phone, Compass, AlertTriangle, Cloud, ListChecks, History } from 'lucide-react';

export default function Navbar({
  currentUser,
  friendUser,
  activeTripCode,
  destination,
  itineraryCount,
  onOpenPlacesSearch,
  onOpenShareModal,
  onOpenTripRoom,
  onOpenGoogleSync,
  onOpenChecklist,
  onOpenSavedTrips,
  onOpenSos,
  onToggleChat,
  unreadCount,
  onCallFriend,
  onLogout
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between z-30 shadow-lg select-none">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
          <Eye className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              Tripeye
            </span>
            {activeTripCode && (
              <button
                onClick={onOpenSavedTrips}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center gap-1"
                title="View Saved Trips History"
              >
                <span>{activeTripCode}</span>
                <History className="w-2.5 h-2.5 opacity-60" />
              </button>
            )}
          </div>
          
          <button
            onClick={onOpenPlacesSearch}
            className="text-[11px] text-slate-300 hover:text-amber-400 flex items-center gap-1 font-semibold truncate max-w-[140px] sm:max-w-[220px] transition text-left"
            title="Click to search or change destinations"
          >
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{destination ? destination.name : 'Choose Places'}</span>
            <span className="text-[10px] text-amber-400 underline decoration-amber-400/50 ml-0.5">change</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Google Sync Status button */}
        <button
          onClick={onOpenGoogleSync}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold transition active:scale-95"
          title="Google & Cloud Sync (Persists all data)"
        >
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Google Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Shared Checklist button */}
        <button
          onClick={onOpenChecklist}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
          title="Shared Rendezvous Checklist"
        >
          <ListChecks className="w-3.5 h-3.5 text-amber-400" />
          <span>Checklist</span>
        </button>

        {/* Explore All Places */}
        <button
          onClick={onOpenPlacesSearch}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95"
          title="Browse All Places to Visit"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">All Places</span>
          {itineraryCount > 1 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
              {itineraryCount}
            </span>
          )}
        </button>

        {/* Real Share Link */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
          title="Share Real Trip Link (HTTPS / WhatsApp / QR)"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Call Friend */}
        <button
          onClick={onCallFriend}
          disabled={!friendUser}
          className={"flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 " + (
            friendUser
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 animate-pulse'
              : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
          )}
          title={friendUser ? ("Call " + friendUser.name) : 'Friend must join room to call'}
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span className="hidden md:inline">
            {friendUser ? ("Call " + friendUser.name.split(' ')[0]) : 'Call'}
          </span>
        </button>

        {/* SOS Button */}
        <button
          onClick={onOpenSos}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-extrabold transition active:scale-95"
          title="Emergency SOS Beacon"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>

        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          className="relative flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chat</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        {currentUser && (
          <div
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center text-xs font-bold text-amber-400 cursor-pointer transition ml-1"
            title={"Logged in as " + currentUser.name + " (" + currentUser.phone + "). Click to logout."}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
