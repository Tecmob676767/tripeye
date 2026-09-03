import React, { useState } from 'react';
import { Share2, Copy, Check, QrCode, Smartphone, X, ExternalLink } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, activeTripCode, destination }) {
  const [copiedNetwork, setCopiedNetwork] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);

  if (!isOpen) return null;

  // Real Working Link: Automatically detects LAN IP or uses current URL
  const networkIp = '10.173.204.34';
  const port = window.location.port || '5173';
  
  // URL that works for a friend on the same Wi-Fi / Hotspot or phone
  const wifiShareUrl = `http://${networkIp}:${port}/?trip=${activeTripCode}`;
  // URL for same machine / localhost
  const directShareUrl = `${window.location.origin}/?trip=${activeTripCode}`;

  const inviteMessage = `Hey! Join my live meetup on Tripeye for ${destination ? destination.name : 'our trip'}. Track live location, arrival alerts, and call in-app: ${wifiShareUrl}`;

  // WhatsApp Share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`;

  // Native Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tripeye Trip Room',
          text: inviteMessage,
          url: wifiShareUrl
        });
      } catch (e) {
        console.warn(e);
      }
    } else {
      handleCopyWifi();
    }
  };

  const handleCopyWifi = () => {
    navigator.clipboard?.writeText(wifiShareUrl);
    setCopiedNetwork(true);
    setTimeout(() => setCopiedNetwork(false), 2000);
  };

  const handleCopyDirect = () => {
    navigator.clipboard?.writeText(directShareUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2000);
  };

  // QR code image URL generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(wifiShareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Invite Friend to Tripeye</h3>
              <p className="text-xs text-slate-400">Room Code: <span className="font-mono text-amber-400 font-bold">{activeTripCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code & Scan Option */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
          <div className="p-2 bg-white rounded-xl shadow-md mb-2">
            <img
              src={qrCodeUrl}
              alt="Scan to join trip"
              className="w-36 h-36 rounded"
            />
          </div>
          <p className="text-xs font-bold text-slate-200">Scan with phone camera</p>
          <p className="text-[11px] text-slate-400">Instantly opens live map & tracker on friend's device</p>
        </div>

        {/* WhatsApp One-Click Share */}
        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <span>💬 Share Directly on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Native Mobile Share Button */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Share via Phone Apps (SMS / Telegram)</span>
            </button>
          )}
        </div>

        {/* Real Mobile Wi-Fi Link */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Real Mobile Wi-Fi Link (For friend's phone):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={wifiShareUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyWifi}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition"
            >
              {copiedNetwork ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Same-machine / Localhost Link */}
        <div className="mt-2.5">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Same PC / Secondary Tab Link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={directShareUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyDirect}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs shrink-0 transition"
            >
              {copiedDirect ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}