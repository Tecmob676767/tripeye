import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { formatDistance } from '../utils/geo';

export default function MapTracker({
  destination,
  currentUser,
  userPos, // [lat, lng]
  friendUser,
  friendPos, // [lat, lng]
  userDist,
  friendDist,
  friendsApartDist,
  isUserArrived,
  isFriendArrived,
  areMet,
  onMapClickToSetPos
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const friendMarkerRef = useRef(null);
  const templeMarkerRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const userPolylineRef = useRef(null);
  const friendPolylineRef = useRef(null);
  const betweenPolylineRef = useRef(null);

  // Initialize Map
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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Allow clicking on map to manually reposition if GPS is not available
      map.on('click', (e) => {
        if (onMapClickToSetPos) {
          onMapClickToSetPos([e.latlng.lat, e.latlng.lng]);
        }
      });

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Destination & Geofence
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !destination) return;

    map.setView([destination.lat, destination.lng], 15);

    if (geofenceCircleRef.current) geofenceCircleRef.current.remove();
    geofenceCircleRef.current = L.circle([destination.lat, destination.lng], {
      radius: destination.geofenceRadius,
      color: '#f59e0b',
      fillColor: '#f59e0b',
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
            ${destination.landmarkName}
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
          <b class="text-amber-400 text-sm block">${destination.name}</b>
          <p class="text-slate-300 mt-1">${destination.notes}</p>
        </div>
      `);
  }, [destination]);

  // Current User Marker (You)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPos) return;

    const userHtml = `
      <div class="tripeye-avatar-marker cursor-pointer pointer-events-auto">
        <div class="tripeye-ping bg-sky-400/40"></div>
        <div class="relative w-10 h-10 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-white font-extrabold text-sm z-10 ${isUserArrived ? 'ring-4 ring-emerald-400' : ''}">
          ${currentUser ? currentUser.name.charAt(0).toUpperCase() : 'ME'}
        </div>
        <div class="mt-1 bg-slate-900/90 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/30 whitespace-nowrap shadow z-10 flex items-center gap-1">
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

  // Remote Friend Marker
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
        <div class="tripeye-ping bg-pink-400/40"></div>
        <div class="relative w-10 h-10 rounded-full bg-pink-500 border-2 border-white shadow-lg flex items-center justify-center text-white font-extrabold text-sm z-10 ${isFriendArrived ? 'ring-4 ring-emerald-400 animate-bounce' : ''}">
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

  // Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !destination) return;
    const destPos = [destination.lat, destination.lng];

    if (userPolylineRef.current) userPolylineRef.current.remove();
    if (userPos) {
      userPolylineRef.current = L.polyline([userPos, destPos], {
        color: '#38bdf8',
        weight: 3,
        opacity: 0.6,
        dashArray: '5, 8'
      }).addTo(map);
    }

    if (friendPolylineRef.current) friendPolylineRef.current.remove();
    if (friendPos) {
      friendPolylineRef.current = L.polyline([friendPos, destPos], {
        color: '#ec4899',
        weight: 3,
        opacity: 0.6,
        dashArray: '5, 8'
      }).addTo(map);
    }

    if (betweenPolylineRef.current) betweenPolylineRef.current.remove();
    if (userPos && friendPos) {
      betweenPolylineRef.current = L.polyline([userPos, friendPos], {
        color: areMet ? '#10b981' : '#64748b',
        weight: 2,
        opacity: 0.5,
        dashArray: '2, 6'
      }).addTo(map);
    }
  }, [userPos, friendPos, destination, areMet]);

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
      <button
        onClick={handleRecenter}
        className="absolute top-4 left-4 z-10 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition active:scale-95"
      >
        <span>🎯 Recenter All</span>
      </button>
    </div>
  );
}