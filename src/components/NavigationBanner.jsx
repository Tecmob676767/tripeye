import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  ArrowUpRight, 
  ArrowUpLeft, 
  ArrowUp, 
  CornerUpRight, 
  CornerUpLeft, 
  RotateCw,
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  VolumeX, 
  Car, 
  Bike, 
  Footprints,
  Maximize2,
  Minimize2,
  Gauge
} from 'lucide-react';
import { formatDistance } from '../utils/geo';
import { playTurnChime } from '../utils/audio';

export default function NavigationBanner({
  routeData,
  userPos,
  destination,
  transportMode = 'driving',
  onChangeTransportMode,
  userSpeed
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isDriverMode, setIsDriverMode] = useState(false);
  const lastSpokenRef = useRef('');

  if (!destination) return null;

  const steps = routeData?.legs?.[0]?.steps || [];
  const currentStep = steps[0];
  const nextStep = steps[1];

  const cleanInstruction = (step) => {
    if (!step) return 'Follow route ahead';
    const modifier = step.maneuver?.modifier ? step.maneuver.modifier.replace('_', ' ') : '';
    const type = step.maneuver?.type || '';
    const name = step.name ? ("onto " + step.name) : '';
    
    if (type === 'arrive') return ("Arrive at " + (destination.landmarkName || destination.name));
    if (type === 'depart') return ("Head " + modifier + " " + name).trim();
    if (type === 'roundabout') return ("Take roundabout " + modifier + " " + name).trim();
    return ("Turn " + modifier + " " + name).trim();
  };

  // Voice Guidance (Speech Synthesis)
  useEffect(() => {
    if (!isVoiceEnabled || !('speechSynthesis' in window) || !currentStep) return;

    const instruction = cleanInstruction(currentStep);
    const distText = Math.round(currentStep.distance) < 50 ? 'now' : ('in ' + formatDistance(Math.round(currentStep.distance)));
    const speechText = instruction + " " + distText;

    if (lastSpokenRef.current !== speechText) {
      lastSpokenRef.current = speechText;
      window.speechSynthesis.cancel();
      playTurnChime();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStep, isVoiceEnabled]);

  const travelmodeParam = transportMode === 'walking' ? 'walking' : transportMode === 'cycling' ? 'bicycling' : 'driving';
  const googleMapsAppUrl = userPos 
    ? ("https://www.google.com/maps/dir/?api=1&origin=" + userPos[0] + "," + userPos[1] + "&destination=" + destination.lat + "," + destination.lng + "&travelmode=" + travelmodeParam)
    : ("https://www.google.com/maps/search/?api=1&query=" + destination.lat + "," + destination.lng);

  const getManeuverIcon = (modifier, type, sizeClass = "w-5 h-5") => {
    if (type === 'arrive') return <span className="text-lg">🎯</span>;
    if (type === 'roundabout') return <RotateCw className={sizeClass + " text-sky-400"} />;
    if (modifier?.includes('right')) return <ArrowUpRight className={sizeClass + " text-emerald-400"} />;
    if (modifier?.includes('left')) return <ArrowUpLeft className={sizeClass + " text-emerald-400"} />;
    if (modifier?.includes('uturn')) return <CornerUpLeft className={sizeClass + " text-amber-400"} />;
    return <ArrowUp className={sizeClass + " text-emerald-400"} />;
  };

  const speedKmh = userSpeed ? Math.round(userSpeed * 3.6) : 0;

  return (
    <div className={"absolute z-20 transition-all duration-300 pointer-events-none " + (
      isDriverMode 
        ? "inset-x-2 top-16 max-w-2xl mx-auto" 
        : "top-16 sm:top-20 left-1/2 -translate-x-1/2 w-[95%] max-w-xl"
    )}>
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* Mode switcher bar */}
        <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => onChangeTransportMode && onChangeTransportMode('driving')}
              className={"px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition " + (
                transportMode === 'driving' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              )}
              title="Drive Route"
            >
              <Car className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Drive</span>
            </button>
            <button
              onClick={() => onChangeTransportMode && onChangeTransportMode('cycling')}
              className={"px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition " + (
                transportMode === 'cycling' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              )}
              title="Bike Route"
            >
              <Bike className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bike</span>
            </button>
            <button
              onClick={() => onChangeTransportMode && onChangeTransportMode('walking')}
              className={"px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition " + (
                transportMode === 'walking' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              )}
              title="Walking Route"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Walk</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-lg text-[11px]">
              <Gauge className="w-3 h-3" />
              <span>{speedKmh} km/h</span>
            </div>

            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={"p-1.5 rounded-lg border transition " + (
                isVoiceEnabled 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              )}
              title={isVoiceEnabled ? 'Voice Guidance Active (Click to mute)' : 'Voice Guidance Muted'}
            >
              {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsDriverMode(!isDriverMode)}
              className={"p-1.5 rounded-lg border transition " + (
                isDriverMode 
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              )}
              title={isDriverMode ? 'Compact View' : 'Driver HUD View'}
            >
              {isDriverMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Turn Card */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={"rounded-2xl bg-slate-950 border-2 border-emerald-500/50 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10 " + (
              isDriverMode ? 'w-16 h-16' : 'w-12 h-12'
            )}>
              {currentStep ? (
                getManeuverIcon(currentStep.maneuver?.modifier, currentStep.maneuver?.type, isDriverMode ? 'w-8 h-8' : 'w-6 h-6')
              ) : (
                <Navigation className="w-6 h-6 text-emerald-400 animate-pulse" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {currentStep ? ("In " + formatDistance(Math.round(currentStep.distance))) : 'Live Navigation'}
                </span>
                {routeData?.duration && (
                  <span className="text-[11px] text-slate-300 font-bold">
                    ⏱️ ~{Math.ceil(routeData.duration / 60)} mins ({formatDistance(Math.round(routeData.distance))})
                  </span>
                )}
              </div>
              <h3 className={"font-black text-white truncate leading-snug mt-1 " + (
                isDriverMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
              )}>
                {currentStep ? cleanInstruction(currentStep) : ("Navigating to " + destination.name)}
              </h3>
              {nextStep && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Then:</span>
                  <span>{cleanInstruction(nextStep)} ({formatDistance(Math.round(nextStep.distance))})</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={googleMapsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition active:scale-95"
              title="Open Google Maps App"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Google Maps</span>
            </a>

            {steps.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title={isExpanded ? 'Collapse turns' : 'View all turns'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Step-by-Step Directions */}
        {isExpanded && steps.length > 0 && (
          <div className="max-h-60 overflow-y-auto border-t border-slate-800 bg-slate-950/95 p-3 divide-y divide-slate-800/80 text-xs">
            <div className="pb-2 font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                All Maneuvers to {destination.name}
              </span>
              <span className="text-emerald-400 font-mono">{steps.length} turns</span>
            </div>
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className={"py-2.5 flex items-center justify-between gap-2 " + (
                  idx === 0 ? 'bg-emerald-950/30 -mx-3 px-3 rounded-lg border-l-2 border-emerald-400' : ''
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {getManeuverIcon(step.maneuver?.modifier, step.maneuver?.type, "w-4 h-4")}
                  </div>
                  <div className="min-w-0">
                    <span className={"font-semibold block truncate " + (idx === 0 ? 'text-emerald-300' : 'text-slate-200')}>
                      {cleanInstruction(step)}
                    </span>
                    {step.name && (
                      <span className="text-[10px] text-slate-400 block truncate font-mono">
                        {step.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
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
