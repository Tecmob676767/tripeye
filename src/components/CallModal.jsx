import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, User, PhoneForwarded, Sparkles } from 'lucide-react';
import { startRingtone, stopRingtone } from '../utils/audio';

export default function CallModal({
  isOpen,
  onClose,
  friend,
  isIncoming,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  callStatus // 'ringing', 'calling', 'connected', 'ended'
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Play ringtone on incoming or calling
  useEffect(() => {
    if (!isOpen) {
      stopRingtone();
      setCallDuration(0);
      return;
    }

    if (callStatus === 'ringing' || callStatus === 'calling') {
      startRingtone();
    } else {
      stopRingtone();
    }

    return () => stopRingtone();
  }, [isOpen, callStatus]);

  // Call timer when connected
  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  if (!isOpen || !friend) return null;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Friend Avatar */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 p-1 flex items-center justify-center shadow-xl shadow-pink-500/20">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-3xl">
              👩
            </div>
          </div>
          {(callStatus === 'calling' || callStatus === 'ringing') && (
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-50"></div>
          )}
        </div>

        {/* Friend details */}
        <h3 className="text-xl font-extrabold text-white">{friend.name}</h3>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{friend.phone}</p>

        {/* Call status / timer */}
        <div className="my-4">
          {callStatus === 'connected' ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              ● In Call ({formatTimer(callDuration)})
            </span>
          ) : callStatus === 'ringing' ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold animate-pulse">
              🔔 Incoming Voice Call...
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">
              Calling {friend.name}...
            </span>
          )}
        </div>

        {/* In-App Call Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {isIncoming && callStatus === 'ringing' ? (
            <>
              <button
                onClick={onRejectCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={onAcceptCall}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition active:scale-95 animate-bounce"
                title="Accept Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              {callStatus === 'connected' && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={onEndCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Direct Mobile Cellular Call fallback button */}
        <div className="mt-8 pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2">Or use your phone carrier directly:</p>
          <a
            href={`tel:${friend.phone}`}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <PhoneForwarded className="w-4 h-4" />
            <span>Direct Cellular Call ({friend.phone})</span>
          </a>
        </div>
      </div>
    </div>
  );
}