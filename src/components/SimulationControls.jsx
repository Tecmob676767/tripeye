import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Zap, MapPin, Smartphone } from 'lucide-react';

export default function SimulationControls({
  isPlaying,
  onTogglePlay,
  progress,
  onChangeProgress,
  speed,
  onChangeSpeed,
  onReset,
  onInstantArrival,
  useRealGps,
  onToggleRealGps
}) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-2xl pointer-events-auto space-y-2">
        {/* Top Control Bar: Status, Mode, Instant trigger */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200">
              {useRealGps ? 'Live GPS Active' : 'Trip Simulator'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Instant Arrival button for demo */}
            <button
              onClick={onInstantArrival}
              title="Instantly move friends to Temple Geofence"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Simulate Arrival</span>
            </button>

            {/* Switch GPS / Simulator */}
            <button
              onClick={onToggleRealGps}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition active:scale-95 ${
                useRealGps
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>{useRealGps ? 'Using Phone GPS' : 'GPS Mode'}</span>
            </button>
          </div>
        </div>

        {/* Progress Timeline Slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center transition shadow-md shrink-0 active:scale-95"
            title={isPlaying ? 'Pause Trip' : 'Start Trip Progress'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>Departed En Route</span>
              <span>{Math.round(progress * 100)}% to Destination</span>
              <span>Arrived at Gate</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => onChangeProgress(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95 shrink-0"
            title="Reset trip positions"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed switcher */}
          <button
            onClick={() => onChangeSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-extrabold shrink-0"
            title="Playback Speed"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
}