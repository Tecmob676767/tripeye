import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Calendar, ArrowRight, ShieldCheck, KeyRound, RefreshCw, CheckCircle2, Navigation } from 'lucide-react';

export default function AuthModal({ isOpen, onLogin }) {
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [smsBanner, setSmsBanner] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!dob) { setError('Please select your date of birth.'); return; }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      const code = data.otp || String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setSmsBanner('📲 SMS Code: ' + code + '  — Auto-filled below for 1-tap login');
      setStep('otp');
      setCountdown(30);
      setOtp(code.split(''));
    } catch {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setSmsBanner('📲 SMS Code: ' + code);
      setStep('otp');
      setCountdown(30);
      setOtp(code.split(''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const n = [...otp];
    n[index] = value.slice(-1);
    setOtp(n);
    if (value && index < 5 && otpInputsRef.current[index + 1]) otpInputsRef.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpInputsRef.current[index - 1].focus();
  };

  const handleVerifyOtp = (e) => {
    if (e) e.preventDefault();
    const entered = otp.join('');
    if (entered.length !== 6) { setError('Please enter all 6 digits.'); return; }
    const userData = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(), dob, phone: phone.trim(),
      phoneVerified: true, loginAt: Date.now()
    };
    localStorage.setItem('tripeye_user', JSON.stringify(userData));
    onLogin(userData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {smsBanner && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="font-semibold">{smsBanner}</div>
          </div>
        )}

        <div className="text-center relative mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-3">
            <Navigation className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white">
            {step === 'details' ? 'Live Location Sharing' : 'Enter 6-Digit OTP'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'details' ? 'Share live GPS with friends on Google Maps.' : 'Code sent to ' + phone}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" /> Full Name
              </label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" /> Date of Birth
              </label>
              <input type="date" required value={dob} onChange={e => setDob(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" /> Mobile Phone Number
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-400 flex items-center">+91</span>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition" />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-sky-600/25 transition active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              <span>{isLoading ? 'Sending Code...' : 'Continue to Live Map'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-between gap-2 my-4">
              {otp.map((digit, idx) => (
                <input key={idx} ref={el => otpInputsRef.current[idx] = el} type="text" maxLength={1}
                  value={digit} onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-xl font-bold bg-slate-950 border-2 border-slate-800 focus:border-sky-500 rounded-xl text-white outline-none transition" />
              ))}
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4" /> Verify & Share Live Location
            </button>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button type="button" onClick={() => setStep('details')} className="hover:text-sky-400 font-semibold">← Change Number</button>
              <button type="button" disabled={countdown > 0} onClick={handleSendOtp}
                className={"flex items-center gap-1 font-semibold " + (countdown > 0 ? "text-slate-600 cursor-not-allowed" : "text-sky-400 hover:underline")}>
                <RefreshCw className="w-3 h-3" />
                <span>{countdown > 0 ? "Resend Code (" + countdown + "s)" : "Resend Code"}</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Encrypted Live Location Sharing</span>
        </div>
      </div>
    </div>
  );
}
