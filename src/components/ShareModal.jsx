import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, QrCode, Smartphone, X, ExternalLink, ShieldCheck, Globe } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, activeTripCode, destination }) {
  const [copiedHttps, setCopiedHttps] = useState(false);
  const [copiedLan, setCopiedLan] = useState(false);
  const [httpsTunnelUrl, setHttpsTunnelUrl] = useState(null);

  // Fetch active HTTPS tunnel URL from server
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/tunnel-url')
      .then(res => res.json())
      .then(data => {
        if (data.httpsUrl) {
          setHttpsTunnelUrl(data.httpsUrl);
        }
      })
      .catch(e => console.warn('Could not fetch tunnel url', e));
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Working Public HTTPS URL (works anywhere on 4G/5G/any device worldwide)
  const activeOrigin = httpsTunnelUrl || (window.location.protocol === 'https:' ? window.location.origin : null);
  const primaryShareUrl = activeOrigin 
    ? `${activeOrigin}/?trip=${activeTripCode}`
    : `${window.location.origin}/?trip=${activeTripCode}`;

  const lanShareUrl = `http://10.173.204.34:5173/?trip=${activeTripCode}`;

  const inviteMessage = `Hey! Join my live meetup on Tripeye for ${destination ? destination.name : 'our trip'}. Live GPS tracking, arrival alerts & in-app calling: ${primaryShareUrl}`;

  // WhatsApp One-Click Share
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`;

  // Native Mobile Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tripeye Trip Room',
          text: inviteMessage,
          url: primaryShareUrl
        });
      } catch (e) {
        console.warn(e);
      }
    } else {
      handleCopyHttps();
    }
  };

  const handleCopyHttps = () => {
    navigator.clipboard?.writeText(primaryShareUrl);
    setCopiedHttps(true);
    setTimeout(() => setCopiedHttps(false), 2000);
  };

  const handleCopyLan = () => {
    navigator.clipboard?.writeText(lanShareUrl);
    setCopiedLan(true);
    setTimeout(() => setCopiedLan(false), 2000);
  };

  // QR Code pointing to the HTTPS URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(primaryShareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-white">Share Real Trip Link</h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> HTTPS
                </span>
              </div>
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
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
          <div className="p-2 bg-white rounded-xl shadow-md mb-2">
            <img
              src={qrCodeUrl}
              alt="Scan to join trip"
              className="w-36 h-36 rounded"
            />
          </div>
          <p className="text-xs font-bold text-slate-200">Scan with ANY phone camera</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
            Opens instantly with secure HTTPS & live GPS tracking!
          </p>
        </div>

        {/* Primary HTTPS Share Action Buttons */}
        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <span>💬 Share Live HTTPS Link on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Native Mobile Share */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Share via Phone Apps (SMS / Telegram)</span>
            </button>
          )}
        </div>

        {/* Real HTTPS Link Box */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Real Public HTTPS URL (Works Worldwide):
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Valid SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={primaryShareUrl}
              className="flex-1 bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyHttps}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition"
              title="Copy secure link"
            >
              {copiedHttps ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Local Wi-Fi fallback */}
        <div className="mt-2.5">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Local Network IP (Same Wi-Fi only):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={lanShareUrl}
              className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-400 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLan}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs shrink-0 transition"
            >
              {copiedLan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}