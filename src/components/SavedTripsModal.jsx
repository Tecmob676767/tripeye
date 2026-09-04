import React from 'react';
import { MapPin, Calendar, Users, ArrowRight, Trash2, X, Plus } from 'lucide-react';

export default function SavedTripsModal({
  isOpen,
  onClose,
  activeTripCode,
  savedTrips = [],
  onSelectTrip,
  onCreateNewTrip,
  onDeleteTrip
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white">My Trips & History</h3>
            <p className="text-xs text-slate-400">All your saved trips and rendezvous rooms</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create new button */}
        <button
          onClick={onCreateNewTrip}
          className="w-full py-2.5 mb-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Trip Room</span>
        </button>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {savedTrips.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No trips saved yet.
            </div>
          ) : (
            savedTrips.map((trip) => {
              const isActive = trip.tripCode === activeTripCode;
              return (
                <div
                  key={trip.tripCode}
                  className={"p-3 rounded-2xl border transition flex items-center justify-between gap-2 " + (
                    isActive 
                      ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  )}
                >
                  <div 
                    onClick={() => onSelectTrip(trip.tripCode)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400 uppercase">
                        {trip.tripCode}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{trip.destinationName || 'Sacred Rendezvous'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {trip.date || new Date().toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onSelectTrip(trip.tripCode)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                      title="Open trip"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteTrip && (
                      <button
                        onClick={() => onDeleteTrip(trip.tripCode)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-600 hover:text-rose-400 transition"
                        title="Delete from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
