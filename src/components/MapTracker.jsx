import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { formatDistance } from '../utils/geo';
import { Layers, Map as MapIcon } from 'lucide-react';

export default function MapTracker({
  destination,
  itinerary,
  currentUser,
  userPos,
  friendUser,
  friendPos,
  userDist,
  friendDist,
  friendsApartDist,
  isUserArrived,
  isFriendArrived,
  areMet,
  roadRouteCoordinates,
  onMapClickToSetPos
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);

  const userMarkerRef = useRef(null);
  const friendMarkerRef = useRef(null);
  const templeMarkerRef = useRef(null);
  const extraMarkersRef = useRef([]);
  const geofenceCircleRef = useRef(null);
  const roadPolylineRef = useRef(null);
  const friendPolylineRef = useRef(null);

  // Map style state: 'roadmap' (Google Standard), 'hybrid' (Google Satellite with labels), 'terrain'
  const [mapStyle, setMapStyle] = useState('roadmap');

  // Google Maps tile URL templates (No API Key watermark, 100% genuine Google Maps tiles)
  const getGoogleTileUrl = (style) => {
    switch (style) {
      case 'hybrid':
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Satellite + Roads & Names
      case 'satellite':
        return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'; // Pure Satellite
      case 'terrain':
        return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Terrain
      case 'roadmap':
      default:
        return 'https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'; // Standard Google Maps
    }
  };

  // Initialize Leaflet Map with Google Maps Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = destination ? destination.lat : 28.6127;
      const initialLng = destination ? destination.lng : 77.2773;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Add Real Google Maps Tile Layer
      tileLayerRef.current = L.tileLayer(getGoogleTileUrl('roadmap'), {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      map.on('click', (e) => {
        if (onMapClickToSetPos) {
          onMapClickToSetPos([e.latlng.lat, e.latlng.lng]);
        }
      });

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Tile Layer when style switches
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    tileLayerRef.current = L.tileLayer(getGoogleTileUrl(mapStyle), {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
  }, [mapStyle]);

  // Update Destination & Geofence
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !destination) return;

    map.setView([destination.lat, destination.lng], 15);

    if (geofenceCircleRef.current) geofenceCircleRef.current.remove();
    geofenceCircleRef.current = L.circle([destination.lat, destination.lng], {
      radius: destination.geofenceRadius,
      color: '#ea580c',
      fillColor: '#ea580c',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '6, 8'
    }).addTo(map);

    if (templeMarkerRef.current) templeMarkerRef.current.remove();
    const templeIcon = L.divIcon({
      className: 'custom-temple-icon',
      html: `
        <div class="flex flex-col items-center temple-glow pointer-events-auto cursor-pointer">
          <div class="bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 p-2.5 rounded-2xl shadow-xl shadow-amber-500/40 border-2 border-white flex items-center justify-center">
            <span class="text-xl">🛕</span>
          </div>
          <div class="mt-1 bg-slate-900/90 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap shadow-md">
            ${destination.landmarkName || destination.name}
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    templeMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: templeIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-1 text-xs">
          <b class="text-amber-500 text-sm block">${destination.name}</b>
          <p class="text-slate-200 mt-1">${destination.landmarkName}</p>
          <p class="text-slate-400 mt-1 text-[11px]">${destination.notes || ''}</p>
        </div>
      `);
  }, [destination]);

  // Render Real Road Route Geometry (Blue Navigation Line snapped to streets)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (roadPolylineRef.current) roadPolylineRef.current.remove();

    if (roadRouteCoordinates && roadRouteCoordinates.length > 0) {
      // Real turn-by-turn road route
      roadPolylineRef.current = L.polyline(roadRouteCoordinates, {
        color: '#2563eb', // Google Blue
        weight: 6,
        opacity: 0.85,
        lineJoin: 'round'
      }).addTo(map);
    } else if (userPos && destination) {
      // Fallback dashed line
      roadPolylineRef.current = L.polyline([userPos, [destination.lat, destination.lng]], {
        color: '#2563eb',
        weight: 4,
        opacity: 0.6,
        dashArray: '6, 8'
      }).addTo(map);
    }
  }, [roadRouteCoordinates, userPos, destination]);

  // Friend Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (friendPolylineRef.current) friendPolylineRef.current.remove();
    if (friendPos && destination) {
      friendPolylineRef.current = L.polyline([friendPos, [destination.lat, destination.lng]], {
        color: '#ec4899',
        weight: 4,
        opacity: 0.6,
        dashArray: '5, 8'
      }).addTo(map);
    }
  }, [friendPos, destination]);

  // Itinerary Extra Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    extraMarkersRef.current.forEach(m => m.remove());
    extraMarkersRef.current = [];

    if (!itinerary || itinerary.length <= 1) return;

    itinerary.forEach((place, index) => {
      if (place.id === destination?.id) return;

      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `
          <div class="flex flex-col items-center pointer-events-auto cursor-pointer">
            <div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-300 font-extrabold text-xs flex items-center justify-center shadow-lg">
              ${index + 1}
            </div>
            <div class="mt-0.5 bg-slate-900/90 text-slate-200 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow">
              ${place.name.split(',')[0]}
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([place.lat, place.lng], { icon: stopIcon }).addTo(map);
      extraMarkersRef.current.push(marker);
    });
  }, [itinerary, destination]);

  // User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPos) return;

    const userHtml = `
      <div class="tripeye-avatar-marker cursor-pointer pointer-events-auto">
        <div class="tripeye-ping bg-blue-500/40"></div>
        <div class="relative w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-extrabold text-sm z-10 ${isUserArrived ? 'ring-4 ring-emerald-400' : ''}">
          ${currentUser ? currentUser.name.charAt(0).toUpperCase() : 'ME'}
        </div>
        <div class="mt-1 bg-slate-900/90 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap shadow z-10 flex items-center gap-1">
          <span>You (${currentUser ? currentUser.name.split(' ')[0] : 'Me'})</span>
          ${userDist ? `<span class="text-slate-400">• ${formatDistance(userDist)}</span>` : ''}
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'custom-user-icon',
      html: userHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(userPos, { icon: userIcon }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userPos);
      userMarkerRef.current.setIcon(userIcon);
    }
  }, [userPos, userDist, currentUser, isUserArrived]);

  // Friend Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!friendPos || !friendUser) {
      if (friendMarkerRef.current) {
        friendMarkerRef.current.remove();
        friendMarkerRef.current = null;
      }
      return;
    }

    const friendHtml = `
      <div class="tripeye-avatar-marker cursor-pointer pointer-events-auto">
        <div class="tripeye-ping bg-pink-500/40"></div>
        <div class="relative w-10 h-10 rounded-full bg-pink-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-extrabold text-sm z-10 ${isFriendArrived ? 'ring-4 ring-emerald-400 animate-bounce' : ''}">
          ${friendUser.name.charAt(0).toUpperCase()}
        </div>
        <div class="mt-1 bg-slate-900/90 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/30 whitespace-nowrap shadow z-10 flex items-center gap-1">
          <span>${friendUser.name}</span>
          ${friendDist ? `<span class="text-slate-400">• ${formatDistance(friendDist)}</span>` : ''}
        </div>
      </div>
    `;

    const friendIcon = L.divIcon({
      className: 'custom-friend-icon',
      html: friendHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!friendMarkerRef.current) {
      friendMarkerRef.current = L.marker(friendPos, { icon: friendIcon }).addTo(map);
    } else {
      friendMarkerRef.current.setLatLng(friendPos);
      friendMarkerRef.current.setIcon(friendIcon);
    }
  }, [friendPos, friendDist, friendUser, isFriendArrived]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const points = [];
    if (userPos) points.push(userPos);
    if (friendPos) points.push(friendPos);
    if (destination) points.push([destination.lat, destination.lng]);

    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 16 });
    }
  };

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Recenter & Google Map Style Switcher */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition active:scale-95"
        >
          <span>🎯 Recenter</span>
        </button>

        {/* Google Maps Layer Switcher */}
        <div className="bg-slate-900/95 border border-slate-700 p-0.5 rounded-xl shadow-xl flex items-center backdrop-blur-sm text-[11px] font-bold">
          <button
            onClick={() => setMapStyle('roadmap')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapStyle === 'roadmap' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Google Map
          </button>
          <button
            onClick={() => setMapStyle('hybrid')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapStyle === 'hybrid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>
    </div>
  );
}