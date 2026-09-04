import React from 'react';
import { Compass, Navigation2, Phone } from 'lucide-react';
import { formatDistance, calculateBearing } from '../utils/geo';

export default function RendezvousRadar({
  userPos,
  friendPos,
  friendUser,
  onCallFriend
}) {
  if (!friendUser || !friendPos || !userPos) return null;

  const bearing = calculateBearing(userPos[0], userPos[1], friendPos[0], friendPos[1]);
  const distance = formatDistance(
    Math.round(
      Math.hypot(
        (friendPos[0] - userPos[0]) * 111320,
        (friendPos[1] - userPos[1]) * 111320 * Math.cos((userPos[0] * Math.PI) / 180)
      )
    )
  );

  return (
    <div className="absolute bottom-20 left-4 z-20">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full bg-slate-950 border-2 border-amber-500/40 flex items-center justify-center shadow-inner">
          <div 
            className="transition-transform duration-500 ease-out"
            style={{ transform: "rotate(" + bearing + "deg)" }}
          >
            <Navigation2 className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow" />
          </div>
          <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping pointer-events-none" />
        </div>

        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white truncate max-w-[120px]">
              {friendUser.name.split(' ')[0]}
            </span>
          </div>
          <div className="text-[11px] font-mono font-bold text-amber-400">
            {distance} away
          </div>
        </div>

        <button
          onClick={onCallFriend}
          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
          title={"Call " + friendUser.name}
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
