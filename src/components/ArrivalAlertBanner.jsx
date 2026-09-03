import React from 'react';
import { BellRing, CheckCircle, Navigation, MapPin, X } from 'lucide-react';

export default function ArrivalAlertBanner({ isPriyaArrived, destination, onDismiss }) {
  if (!isPriyaArrived) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md animate-bounce">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-300/40 flex items-center justify-between gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <BellRing className="w-6 h-6 text-yellow-300 animate-wiggle" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider uppercase text-emerald-200">
            <span>🎉 Geofence Alert</span>
          </div>
          <div className="font-extrabold text-sm sm:text-base leading-tight mt-0.5">
            Priya has reached the Temple!
          </div>
          <div className="text-xs text-emerald-100 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3 h-3 text-yellow-300 shrink-0" />
            <span>At {destination.landmarkName}</span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}