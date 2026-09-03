import React from 'react';
import { Users, Phone, CheckCircle2 } from 'lucide-react';
import { formatDistance, calculateETA } from '../utils/geo';

export default function TripHUD({
  currentUser,
  friendUser,
  userDist,
  friendDist,
  friendsApartDist,
  isUserArrived,
  isFriendArrived,
  areMet,
  onCallFriend
}) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-2xl pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 divide-x divide-slate-800">
        
        {/* You */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 px-1 sm:px-2">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sm font-extrabold text-sky-400">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'ME'}
            </div>
            {isUserArrived && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 bg-slate-900 rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider truncate">
              {currentUser ? currentUser.name : 'You'}
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-100 flex items-center gap-1">
              <span>{formatDistance(userDist)}</span>
              <span className="text-[10px] font-normal text-slate-400">• {calculateETA(userDist)}</span>
            </div>
          </div>
        </div>

        {/* Distance Apart */}
        <div className="px-2 sm:px-4 flex flex-col items-center justify-center text-center shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-400" />
            Apart
          </span>
          <span className={`text-xs sm:text-sm font-extrabold ${areMet ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}>
            {friendUser ? (areMet ? '✨ Together!' : formatDistance(friendsApartDist)) : 'Waiting'}
          </span>
        </div>

        {/* Remote Friend */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 px-1 sm:px-2 justify-end sm:justify-start">
          {friendUser ? (
            <>
              <div className="text-right sm:text-left order-2 sm:order-2 min-w-0">
                <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider truncate flex items-center gap-1 justify-end sm:justify-start">
                  <span>{friendUser.name}</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-100 flex items-center justify-end sm:justify-start gap-1">
                  <span>{formatDistance(friendDist)}</span>
                  <span className="text-[10px] font-normal text-slate-400">• {calculateETA(friendDist)}</span>
                </div>
              </div>
              <div className="relative order-1 sm:order-1 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-sm font-extrabold text-pink-400">
                  {friendUser.name.charAt(0).toUpperCase()}
                </div>
                {isFriendArrived && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 bg-slate-900 rounded-full" />
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 font-medium italic text-right w-full">
              Share link to connect friend
            </div>
          )}
        </div>

      </div>
    </div>
  );
}