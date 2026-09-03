import React, { useState } from 'react';
import { Eye, MapPin, Share2, Info, MessageSquare, Phone, Users, Check, LogOut, Copy } from 'lucide-react';

export default function Navbar({
  currentUser,
  friendUser,
  activeTripCode,
  destination,
  onOpenTripRoom,
  onOpenDetails,
  onToggleChat,
  unreadCount,
  onCallFriend,
  onLogout
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/?trip=${activeTripCode}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-30 shadow-lg select-none">
      {/* Brand & Active Trip */}
      <div className="flex items-center gap-3">
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
                onClick={onOpenTripRoom}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
                title="Click to view or share Trip Room"
              >
                {activeTripCode}
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium truncate max-w-[180px] sm:max-w-[280px]">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{destination ? destination.name : 'Choose Destination'}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Call Friend Button */}
        <button
          onClick={onCallFriend}
          disabled={!friendUser}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${
            friendUser
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
          title={friendUser ? `Call ${friendUser.name}` : 'Waiting for friend to join trip room...'}
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">
            {friendUser ? `Call ${friendUser.name.split(' ')[0]}` : 'Call Friend'}
          </span>
        </button>

        {/* Share Invite Code */}
        {activeTripCode && (
          <button
            onClick={handleShare}
            title="Copy Trip Invite Link"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden md:inline">{copied ? 'Link Copied' : 'Invite'}</span>
          </button>
        )}

        {/* Temple Guide button */}
        <button
          onClick={onOpenDetails}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95"
          title="Rendezvous Guide"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Guide</span>
        </button>

        {/* Chat toggle button */}
        <button
          onClick={onToggleChat}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Badge & Logout */}
        {currentUser && (
          <div className="flex items-center pl-1 border-l border-slate-800">
            <div
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center text-xs font-bold text-amber-400 cursor-pointer transition"
              title={`Logged in as ${currentUser.name} (${currentUser.phone}). Click to Logout.`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}