import React, { useState } from 'react';
import { Navigation, ArrowUpRight, ArrowUpLeft, ArrowUp, CornerUpRight, CornerUpLeft, ExternalLink, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { formatDistance } from '../utils/geo';

export default function NavigationBanner({
  routeData,
  userPos,
  destination,
  isNavigating,
  onToggleNav
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!destination) return null;

  const steps = routeData?.legs?.[0]?.steps || [];
  const currentStep = steps[0];
  const nextStep = steps[1];

  // Direct Google Maps App URL
  const googleMapsAppUrl = userPos 
    ? `https://www.google.com/maps/dir/?api=1&origin=${userPos[0]},${userPos[1]}&destination=${destination.lat},${destination.lng}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`;

  const getManeuverIcon = (modifier, type) => {
    if (type === 'arrive') return '🏁';
    if (modifier?.includes('right')) return <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
    if (modifier?.includes('left')) return <ArrowUpLeft className="w-5 h-5 text-emerald-400" />;
    if (modifier?.includes('uturn')) return <CornerUpLeft className="w-5 h-5 text-amber-400" />;
    return <ArrowUp className="w-5 h-5 text-emerald-400" />;
  };

  const cleanInstruction = (step) => {
    if (!step) return 'Follow route ahead';
    const modifier = step.maneuver?.modifier ? step.maneuver.modifier.replace('_', ' ') : '';
    const type = step.maneuver?.type || '';
    const name = step.name ? `onto ${step.name}` : '';
    
    if (type === 'arrive') return `Arrive at ${destination.landmarkName || destination.name}`;
    if (type === 'depart') return `Head ${modifier} ${name}`;
    return `Turn ${modifier} ${name}`.trim();
  };

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* Main Turn Banner */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            {/* Turn Icon Box */}
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
              {currentStep ? (
                getManeuverIcon(currentStep.maneuver?.modifier, currentStep.maneuver?.type)
              ) : (
                <Navigation className="w-6 h-6 text-emerald-400 animate-pulse" />
              )}
            </div>

            {/* Instruction Text */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {currentStep ? `In ${formatDistance(Math.round(currentStep.distance))}` : 'Live Route'}
                </span>
                {routeData?.duration && (
                  <span className="text-[11px] text-slate-400 font-semibold">
                    • ~{Math.ceil(routeData.duration / 60)} mins ({formatDistance(Math.round(routeData.distance))})
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-white truncate leading-tight mt-0.5">
                {currentStep ? cleanInstruction(currentStep) : `Navigating to ${destination.name}`}
              </h4>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Google Maps Navigation button */}
            <a
              href={googleMapsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition active:scale-95"
              title="Open turn-by-turn in real Google Maps app"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Maps App</span>
            </a>

            {/* Expand step list button */}
            {steps.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title={isExpanded ? 'Collapse turns' : 'View all turn directions'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Turn-by-Turn Step Sheet */}
        {isExpanded && steps.length > 0 && (
          <div className="max-h-56 overflow-y-auto border-t border-slate-800 bg-slate-950/90 p-3 divide-y divide-slate-800/80 text-xs">
            <div className="pb-2 font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Step-by-Step Directions</span>
              <span className="text-emerald-400">{steps.length} turns</span>
            </div>
            {steps.map((step, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {getManeuverIcon(step.maneuver?.modifier, step.maneuver?.type)}
                  </div>
                  <span className="font-medium text-slate-200 truncate">
                    {cleanInstruction(step)}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {formatDistance(Math.round(step.distance))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}