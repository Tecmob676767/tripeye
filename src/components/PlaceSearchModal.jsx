import React, { useState } from 'react';
import { Search, MapPin, X, Plus, Check, Compass, Star, Globe } from 'lucide-react';
import { PRESET_DESTINATIONS, searchPlacesLive } from '../utils/geo';

export default function PlaceSearchModal({
  isOpen,
  onClose,
  currentDestination,
  onSelectDestination,
  onAddToItinerary,
  itinerary
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleLiveSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length >= 3) {
      setIsSearching(true);
      const results = await searchPlacesLive(q);
      setLiveResults(results);
      setIsSearching(false);
    } else {
      setLiveResults([]);
    }
  };

  const filteredPresets = PRESET_DESTINATIONS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.landmarkName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const isAlreadyInItinerary = (placeId) => {
    return itinerary?.some(item => item.id === placeId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>Explore Places to Visit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any famous temple or search ANY location worldwide for your meetup
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleLiveSearch}
              placeholder="Search any temple, monument, or place (e.g. Kedarnath, Taj Mahal, Tirupati)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
            {isSearching && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-amber-400 animate-pulse">
                Searching...
              </span>
            )}
          </div>
        </div>

        {/* List of Places */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Live Search Results from OpenStreetMap if any */}
          {liveResults.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 px-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Global Search Results</span>
              </div>
              {liveResults.map((place) => (
                <div
                  key={place.id}
                  className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{place.name}</h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{place.landmarkName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectDestination(place);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      Set Rendezvous
                    </button>
                    {onAddToItinerary && (
                      <button
                        onClick={() => onAddToItinerary(place)}
                        disabled={isAlreadyInItinerary(place.id)}
                        className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 transition"
                        title="Add stop to trip itinerary"
                      >
                        {isAlreadyInItinerary(place.id) ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Curated Temple & Landmark Catalog */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Famous Temples & Pilgrimage Sites ({filteredPresets.length})</span>
            </div>

            {filteredPresets.map((place) => {
              const isCurrent = currentDestination?.id === place.id;
              const inItinerary = isAlreadyInItinerary(place.id);

              return (
                <div
                  key={place.id}
                  className={`rounded-2xl p-3.5 border transition flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white truncate">{place.name}</h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                          Active Meetup
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-200/70 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{place.landmarkName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{place.notes}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectDestination(place);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                        isCurrent
                          ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isCurrent ? 'Selected' : 'Meet Here'}
                    </button>

                    {onAddToItinerary && (
                      <button
                        onClick={() => onAddToItinerary(place)}
                        disabled={inItinerary}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition"
                        title="Add as Stop in Trip"
                      >
                        {inItinerary ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Tap <b>+</b> on any location to add it as an extra stop on your trip!</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}