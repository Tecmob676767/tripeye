import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Phone } from 'lucide-react';

export default function ChatDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUser,
  friendUser,
  onCallFriend
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const quickChips = [
    { text: '🚗 Looking for parking nearby', label: 'Parking' },
    { text: '👟 At the shoe deposit counter', label: 'Shoe Counter' },
    { text: '⛩️ Waiting right at North Gate', label: 'At Gate' },
    { text: '🎟️ Collected Darshan tickets', label: 'Got Passes' },
    { text: '📍 Sending my live GPS position', label: 'Live GPS' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Tripeye Chat</h3>
            <p className="text-[10px] text-slate-400">
              {friendUser ? `Chatting with ${friendUser.name}` : 'Waiting for friend to join...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {friendUser && (
            <button
              onClick={onCallFriend}
              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition"
              title={`Call ${friendUser.name}`}
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Chips */}
      <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(chip.text)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-[11px] font-medium transition active:scale-95"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Message Timeline */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p>No messages yet.</p>
            <p className="text-[10px] mt-1">Send a message or use quick chips above to coordinate!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser && msg.userId === currentUser.id;
            const isSystem = msg.userId === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold text-center">
                    🔔 {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                  <span className="font-bold">{msg.userName}</span>
                  <span>• {msg.time}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs font-medium shadow-md ${
                    isMe
                      ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-br-none'
                      : 'bg-gradient-to-br from-pink-600 to-pink-700 text-white rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-slate-950 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}