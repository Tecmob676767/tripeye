import React, { useState } from 'react';
import { AlertTriangle, Phone, Share2, X, ShieldAlert, MapPin } from 'lucide-react';
import { playSosSiren } from '../utils/audio';

export default function SosModal({
  isOpen,
  onClose,
  userPos,
  currentUser,
  friendUser,
  onBroadcastSos
}) {
  const [hasTriggered, setHasTriggered] = useState(false);

  if (!isOpen) return null;

  const lat = userPos ? userPos[0].toFixed(5) : 'Unknown';
  const lng = userPos ? userPos[1].toFixed(5) : 'Unknown';
  const mapsLink = userPos ? ("https://maps.google.com/?q=" + userPos[0] + "," + userPos[1]) : '';

  const handleTriggerSos = () => {
    setHasTriggered(true);
    playSosSiren();
    if (onBroadcastSos) {
      onBroadcastSos({
        lat: userPos ? userPos[0] : 0,
        lng: userPos ? userPos[1] : 0,
        address: "GPS Coordinates: " + lat + ", " + lng
      });
    }
  };

  const whatsappSosUrl = userPos 
    ? ("https://wa.me/?text=" + encodeURIComponent("🚨 EMERGENCY SOS from " + (currentUser?.name || 'Tripeye User') + "! I need help at: " + mapsLink + " (Phone: " + (currentUser?.phone || '') + ")"))
    : 'https://wa.me/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl shadow-rose-950/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-500">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <h3 className="font-black text-lg text-white">Emergency Rendezvous SOS</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Broadcast your exact coordinates immediately to {friendUser ? friendUser.name : 'your trip companions'} and dial emergency authorities with 1-tap.
        </p>

        <div className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
          <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate">Lat: {lat} | Lng: {lng}</span>
        </div>

        <button
          onClick={handleTriggerSos}
          className={"w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-95 mb-4 " + (
            hasTriggered
              ? 'bg-rose-700 text-white ring-4 ring-rose-500/50 animate-pulse'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
          )}
        >
          <AlertTriangle className="w-6 h-6" />
          <span>{hasTriggered ? 'SOS Active - Sirens Sounded!' : 'Trigger In-App SOS Siren'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href="tel:112"
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Phone className="w-3.5 h-3.5 text-sky-400 fill-current" />
            <span>Police (112)</span>
          </a>
          <a
            href="tel:108"
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            <span>Ambulance (108)</span>
          </a>
        </div>

        <a
          href={whatsappSosUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Send WhatsApp Emergency Alert</span>
        </a>
      </div>
    </div>
  );
}
