import React, { useState } from 'react';
import { X, MapPin, Clock, ShieldAlert, CheckSquare, Square, Share2, Compass } from 'lucide-react';

export default function TripDetailsModal({ isOpen, onClose, destination }) {
  const [checklist, setChecklist] = useState(destination.checklist || []);

  const toggleItem = (id) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 p-5 text-slate-950 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-950/80">
            <span>🛕 Destination Guide</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 leading-snug">
            {destination.name}
          </h2>
          <p className="text-xs text-amber-100 font-medium mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {destination.landmarkName}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Rendezvous Note */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5">
            <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Exact Meetup Location
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              {destination.notes}
            </p>
          </div>

          {/* Timings & Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Temple Timings
              </div>
              <p className="font-bold text-slate-200">{destination.openingHours}</p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Dress Code & Rules
              </div>
              <p className="font-medium text-slate-200">{destination.dressCode}</p>
            </div>
          </div>

          {/* Shared Checklist */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📋 Shared Meetup Checklist</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({checklist.filter(c => c.checked).length}/{checklist.length} done)
              </span>
            </h4>
            <div className="space-y-2">
              {checklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2.5">
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span className={`${item.checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {item.text}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                    {item.owner}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}