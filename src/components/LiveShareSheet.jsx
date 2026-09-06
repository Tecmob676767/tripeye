import React from 'react';
import { Navigation, Phone, Share2, Compass } from 'lucide-react';
import { formatDistance } from '../utils/geo';

export default function LiveShareSheet({ currentUser, friendUser, friendPos, userPos, destination, friendsApartDist, onCallFriend, onOpenShareModal, onFocusMap }) {
  const friendName = friendUser ? friendUser.name : 'Waiting for companion...';
  const friendInitial = friendUser ? friendUser.name.charAt(0).toUpperCase() : '?';
  const isOnline = Boolean(friendUser);
  const distText = friendsApartDist > 0 ? formatDistance(Math.round(friendsApartDist)) : 'Locating...';

  const googleMapsUrl = (userPos && friendPos)
    ? 'https://www.google.com/maps/dir/?api=1&origin=' + userPos[0] + ',' + userPos[1] + '&destination=' + friendPos[0] + ',' + friendPos[1] + '&travelmode=walking'
    : destination ? 'https://www.google.com/maps/search/?api=1&query=' + destination.lat + ',' + destination.lng : 'https://www.google.com/maps';

  return (
    <div className="absolute bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 sm:w-[480px] pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-sky-600/20">
                {friendInitial}
              </div>
              <span className={"absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 " + (isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-white truncate">{friendName}</h4>
                {isOnline && (
                  <span className="px-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">● Live</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isOnline ? <><span className="text-emerald-400 font-bold">{distText} from you</span> · Sharing live location</> : 'Send link below to connect live on Google Maps'}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {isOnline ? (
              <button onClick={onCallFriend} className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95" title={"Call " + friendName}>
                <Phone className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button onClick={onOpenShareModal} className="px-3 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95">
                <Share2 className="w-3.5 h-3.5" /> Invite
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition active:scale-95">
            <Navigation className="w-3.5 h-3.5 text-sky-400" /> Google Maps
          </a>
          <button onClick={onFocusMap}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition active:scale-95">
            <Compass className="w-3.5 h-3.5 text-amber-400" /> Recenter
          </button>
          <button onClick={onOpenShareModal}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-md transition active:scale-95">
            <Share2 className="w-3.5 h-3.5" /> Share Link
          </button>
        </div>
      </div>
    </div>
  );
}
