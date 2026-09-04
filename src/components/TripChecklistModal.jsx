import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, X, CheckCircle2, ListChecks } from 'lucide-react';

export default function TripChecklistModal({
  isOpen,
  onClose,
  checklist = [],
  onUpdateChecklist,
  destination
}) {
  const [newText, setNewText] = useState('');

  if (!isOpen) return null;

  const handleToggle = (id) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    );
    onUpdateChecklist(updated);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem = {
      id: Date.now(),
      text: newText.trim(),
      done: false
    };
    const updated = [...checklist, newItem];
    onUpdateChecklist(updated);
    setNewText('');
  };

  const handleDelete = (id) => {
    const updated = checklist.filter(item => item.id !== id);
    onUpdateChecklist(updated);
  };

  const completedCount = checklist.filter(i => i.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <ListChecks className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Rendezvous Checklist</h3>
              <p className="text-xs text-slate-400">
                Shared in real-time with your companions ({completedCount}/{checklist.length} done)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add item form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add task e.g. Buy flower garlands..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Checklist item list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {checklist.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No tasks added yet. Add checklist items for your meetup!
            </div>
          ) : (
            checklist.map(item => (
              <div
                key={item.id}
                className={"p-2.5 rounded-xl border flex items-center justify-between gap-3 transition " + (
                  item.done 
                    ? 'bg-slate-950/40 border-slate-850 text-slate-500 line-through' 
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                )}
              >
                <div 
                  onClick={() => handleToggle(item.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                >
                  {item.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="text-xs truncate select-none">{item.text}</span>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-slate-600 hover:text-rose-400 transition shrink-0"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
