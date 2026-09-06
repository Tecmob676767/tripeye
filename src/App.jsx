import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import MapTracker from './components/MapTracker';
import TripHUD from './components/TripHUD';
import NavigationBanner from './components/NavigationBanner';
import ArrivalAlertBanner from './components/ArrivalAlertBanner';
import RendezvousRadar from './components/RendezvousRadar';
import LiveShareSheet from './components/LiveShareSheet';
import SosModal from './components/SosModal';
import TripChecklistModal from './components/TripChecklistModal';
import SavedTripsModal from './components/SavedTripsModal';
import ChatDrawer from './components/ChatDrawer';
import TripDetailsModal from './components/TripDetailsModal';
import AuthModal from './components/AuthModal';
import TripRoomModal from './components/TripRoomModal';
import PlaceSearchModal from './components/PlaceSearchModal';
import ShareModal from './components/ShareModal';
import CallModal from './components/CallModal';
import { PRESET_DESTINATIONS, getDistanceMeters } from './utils/geo';
import { playArrivalSound, playMessageSound, playSosSiren } from './utils/audio';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = localStorage.getItem('tripeye_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(!currentUser);

  const [activeTripCode, setActiveTripCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trip') || localStorage.getItem('tripeye_active_trip') || 'TEMPLE-101';
  });

  const [destination, setDestination] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const destId = params.get('dest');
    if (destId) { const f = PRESET_DESTINATIONS.find(d => d.id === destId); if (f) return f; }
    try {
      const s = localStorage.getItem('tripeye_destination_' + activeTripCode);
      if (s) return JSON.parse(s);
    } catch {}
    return PRESET_DESTINATIONS[0];
  });

  const [itinerary, setItinerary] = useState(() => {
    try {
      const s = localStorage.getItem('tripeye_itinerary_' + activeTripCode);
      if (s) return JSON.parse(s);
    } catch {}
    return [destination || PRESET_DESTINATIONS[0]];
  });

  const [checklist, setChecklist] = useState(() => {
    try {
      const s = localStorage.getItem('tripeye_checklist_' + activeTripCode);
      if (s) return JSON.parse(s);
    } catch {}
    return [
      { id: 1, text: 'Deposit mobile phones at Counter 1', done: false },
      { id: 2, text: 'Submit shoes at Shoe Stand (Gate 1)', done: false },
      { id: 3, text: 'Purchase Darshan & Exhibition tokens', done: false },
      { id: 4, text: 'Meet at Entrance Courtyard', done: false }
    ];
  });

  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const s = localStorage.getItem('tripeye_saved_trips');
      if (s) return JSON.parse(s);
    } catch {}
    return [{ tripCode: 'TEMPLE-101', destinationName: 'Akshardham Temple, Delhi', date: new Date().toLocaleDateString() }];
  });

  const [transportMode, setTransportMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [roadRouteCoordinates, setRoadRouteCoordinates] = useState([]);
  const [userSpeed, setUserSpeed] = useState(0);

  const [isTripRoomOpen, setIsTripRoomOpen] = useState(false);
  const [isPlacesSearchOpen, setIsPlacesSearchOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isSavedTripsOpen, setIsSavedTripsOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [messages, setMessages] = useState(() => {
    try {
      const s = localStorage.getItem('tripeye_messages_' + activeTripCode);
      if (s) return JSON.parse(s);
    } catch {}
    return [];
  });

  const [friendUser, setFriendUser] = useState(null);
  const [userPos, setUserPos] = useState(() => {
    if (destination) return [destination.lat + 0.003, destination.lng + 0.003];
    return [28.6127, 77.2773];
  });
  const [friendPos, setFriendPos] = useState(null);

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callStatus, setCallStatus] = useState('calling');
  const localStreamRef = useRef(null);

  const [isUserArrived, setIsUserArrived] = useState(false);
  const [isFriendArrived, setIsFriendArrived] = useState(false);
  const [areMet, setAreMet] = useState(false);
  const hasTriggeredArrivalRef = useRef(false);
  const [remoteSosAlert, setRemoteSosAlert] = useState(null);
  const socketRef = useRef(null);

  // Persist active trip / destination to localStorage and URL
  useEffect(() => {
    if (!activeTripCode) return;
    localStorage.setItem('tripeye_active_trip', activeTripCode);
    const url = window.location.pathname + '?trip=' + activeTripCode + (destination ? '&dest=' + (destination.id || '') : '');
    window.history.replaceState({}, '', url);
    setSavedTrips(prev => {
      const exists = prev.some(t => t.tripCode === activeTripCode);
      const updated = exists ? prev : [{ tripCode: activeTripCode, destinationName: destination?.name || 'Live Rendezvous', date: new Date().toLocaleDateString() }, ...prev];
      localStorage.setItem('tripeye_saved_trips', JSON.stringify(updated));
      return updated;
    });
  }, [activeTripCode, destination]);

  useEffect(() => { if (destination && activeTripCode) localStorage.setItem('tripeye_destination_' + activeTripCode, JSON.stringify(destination)); }, [destination, activeTripCode]);
  useEffect(() => { if (itinerary && activeTripCode) localStorage.setItem('tripeye_itinerary_' + activeTripCode, JSON.stringify(itinerary)); }, [itinerary, activeTripCode]);
  useEffect(() => { if (checklist && activeTripCode) localStorage.setItem('tripeye_checklist_' + activeTripCode, JSON.stringify(checklist)); }, [checklist, activeTripCode]);
  useEffect(() => { if (messages && activeTripCode) localStorage.setItem('tripeye_messages_' + activeTripCode, JSON.stringify(messages)); }, [messages, activeTripCode]);

  // GPS watcher
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onPosSuccess = (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      setUserPos([coords.lat, coords.lng]);
      if (pos.coords.speed != null) setUserSpeed(pos.coords.speed);
      if (currentUser && socketRef.current) {
        socketRef.current.emit('update-location', {
          tripCode: activeTripCode,
          user: currentUser,
          coords,
          speed: pos.coords.speed || 0,
          heading: pos.coords.heading || 0
        });
      }
    };

    navigator.geolocation.getCurrentPosition(onPosSuccess, () => {}, { enableHighAccuracy: true, timeout: 5000 });
    const id = navigator.geolocation.watchPosition(onPosSuccess, () => {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [activeTripCode, currentUser]);

  // OSRM road routing
  const fetchRoadRoute = async (from, to, mode = transportMode) => {
    if (!from || !to) return;
    try {
      const res = await fetch('/api/route?fromLat=' + from[0] + '&fromLng=' + from[1] + '&toLat=' + to[0] + '&toLng=' + to[1] + '&profile=' + mode);
      const data = await res.json();
      if (data.routes?.length) {
        setRouteData(data.routes[0]);
        setRoadRouteCoordinates(data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]));
      }
    } catch {}
  };

  useEffect(() => {
    if (userPos && destination) fetchRoadRoute(userPos, [destination.lat, destination.lng], transportMode);
  }, [userPos, destination, transportMode]);

  // Socket.io real-time live location & dual sync
  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    const emitJoin = () => {
      if (currentUser && activeTripCode) {
        socket.emit('join-trip', {
          tripCode: activeTripCode,
          user: currentUser,
          destination,
          itinerary,
          coords: userPos ? { lat: userPos[0], lng: userPos[1] } : null
        });
      }
    };

    if (socket.connected) {
      emitJoin();
    }
    socket.on('connect', emitJoin);

    const handleUsersList = (users) => {
      if (!users || !Array.isArray(users)) return;
      const other = users.find(u => u.id !== currentUser?.id);
      if (other) {
        setFriendUser(other);
        if (other.lat != null && other.lng != null) {
          setFriendPos([other.lat, other.lng]);
        } else if (destination) {
          setFriendPos([destination.lat - 0.003, destination.lng - 0.003]);
        }
      }
    };

    socket.on('trip-state', ({ users, destination: d, itinerary: it, messages: ms, checklist: ch }) => {
      if (d) setDestination(d);
      if (it?.length) setItinerary(it);
      if (ms?.length) setMessages(ms);
      if (ch?.length) setChecklist(ch);
      handleUsersList(users);
    });

    socket.on('users-updated', ({ users }) => {
      handleUsersList(users);
    });

    socket.on('peer-location', ({ user, coords }) => {
      setFriendUser(prev => ({ ...prev, ...user }));
      if (coords && coords.lat != null && coords.lng != null) {
        setFriendPos([coords.lat, coords.lng]);
      }
    });

    socket.on('destination-updated', d => { setDestination(d); hasTriggeredArrivalRef.current = false; });
    socket.on('itinerary-updated', it => setItinerary(it));
    socket.on('checklist-updated', ch => setChecklist(ch));

    socket.on('receive-message', msg => {
      setMessages(prev => [...prev, msg]);
      playMessageSound();
      if (!isChatOpen && msg.userId !== currentUser?.id) setUnreadCount(prev => prev + 1);
    });

    socket.on('sos-received', sosData => { setRemoteSosAlert(sosData); playSosSiren(); });
    socket.on('incoming-call', () => { setIsIncomingCall(true); setCallStatus('ringing'); setIsCallOpen(true); });
    socket.on('call-accepted', () => setCallStatus('connected'));
    socket.on('call-ended', () => {
      setIsCallOpen(false); setCallStatus('ended');
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    });

    // Continuous location broadcast every 2.5 seconds
    const broadcastInterval = setInterval(() => {
      if (currentUser && userPos && socket.connected) {
        socket.emit('update-location', {
          tripCode: activeTripCode,
          user: currentUser,
          coords: { lat: userPos[0], lng: userPos[1] },
          speed: userSpeed,
          heading: 0
        });
      }
    }, 2500);

    // HTTP Heartbeat & Sync fallback every 3.5 seconds
    const httpSyncInterval = setInterval(async () => {
      if (!activeTripCode) return;
      try {
        const res = await fetch('/api/trip/' + activeTripCode + '/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: currentUser,
            coords: userPos ? { lat: userPos[0], lng: userPos[1] } : null,
            speed: userSpeed
          })
        });
        const data = await res.json();
        if (data.success && data.users) {
          handleUsersList(data.users);
        }
      } catch {}
    }, 3500);

    return () => {
      clearInterval(broadcastInterval);
      clearInterval(httpSyncInterval);
      socket.disconnect();
    };
  }, [currentUser, activeTripCode, destination, itinerary]);

  const destCoords = destination ? [destination.lat, destination.lng] : [0, 0];
  const userDist = userPos ? getDistanceMeters(userPos[0], userPos[1], destCoords[0], destCoords[1]) : 0;
  const friendDist = friendPos ? getDistanceMeters(friendPos[0], friendPos[1], destCoords[0], destCoords[1]) : 0;
  const friendsApartDist = (userPos && friendPos) ? getDistanceMeters(userPos[0], userPos[1], friendPos[0], friendPos[1]) : 0;

  useEffect(() => {
    if (!destination) return;
    const userIn = userDist > 0 && userDist <= destination.geofenceRadius;
    const friendIn = friendDist > 0 && friendDist <= destination.geofenceRadius;
    const together = friendsApartDist > 0 && friendsApartDist <= 25;
    setIsUserArrived(userIn); setIsFriendArrived(friendIn); setAreMet(together);
    if ((userIn || friendIn) && !hasTriggeredArrivalRef.current) {
      hasTriggeredArrivalRef.current = true;
      playArrivalSound();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [userDist, friendDist, friendsApartDist, destination]);

  const handleSelectDestination = (dest) => {
    setDestination(dest);
    hasTriggeredArrivalRef.current = false;
    setItinerary(prev => {
      const updated = prev.some(p => p.id === dest.id) ? prev : [...prev, dest];
      socketRef.current?.emit('update-itinerary', { tripCode: activeTripCode, itinerary: updated });
      return updated;
    });
    socketRef.current?.emit('update-destination', { tripCode: activeTripCode, destination: dest });
  };

  const handleAddToItinerary = (place) => {
    setItinerary(prev => {
      if (prev.some(p => p.id === place.id)) return prev;
      const updated = [...prev, place];
      socketRef.current?.emit('update-itinerary', { tripCode: activeTripCode, itinerary: updated });
      return updated;
    });
  };

  const handleUpdateChecklist = (newChecklist) => {
    setChecklist(newChecklist);
    socketRef.current?.emit('update-checklist', { tripCode: activeTripCode, checklist: newChecklist });
  };

  const handleSendMessage = (text) => {
    if (!currentUser || !activeTripCode) return;
    const msg = { id: Date.now(), userId: currentUser.id, userName: currentUser.name, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    socketRef.current?.emit('send-message', { tripCode: activeTripCode, message: msg });
  };

  const handleBroadcastSos = (sosInfo) => {
    socketRef.current?.emit('sos-alert', { tripCode: activeTripCode, user: currentUser, coords: sosInfo, address: sosInfo.address });
  };

  const handleStartCall = async () => {
    if (!friendUser) return;
    setIsIncomingCall(false); setCallStatus('calling'); setIsCallOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      socketRef.current?.emit('call-user', { tripCode: activeTripCode, toSocketId: friendUser.socketId, callerInfo: currentUser });
    } catch {}
  };

  const handleAcceptCall = async () => {
    setCallStatus('connected');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      socketRef.current?.emit('answer-call', { toSocketId: friendUser?.socketId });
    } catch {}
  };

  const handleEndCall = () => {
    setIsCallOpen(false); setCallStatus('ended');
    socketRef.current?.emit('end-call', { toSocketId: friendUser?.socketId, tripCode: activeTripCode });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      <Navbar
        currentUser={currentUser} friendUser={friendUser} activeTripCode={activeTripCode}
        destination={destination} itineraryCount={itinerary.length}
        onOpenPlacesSearch={() => setIsPlacesSearchOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenChecklist={() => setIsChecklistOpen(true)}
        onOpenSavedTrips={() => setIsSavedTripsOpen(true)}
        onOpenSos={() => setIsSosOpen(true)}
        onToggleChat={() => { setIsChatOpen(p => !p); if (!isChatOpen) setUnreadCount(0); }}
        unreadCount={unreadCount}
        onCallFriend={handleStartCall}
        onLogout={() => { localStorage.removeItem('tripeye_user'); setCurrentUser(null); setIsAuthOpen(true); }}
      />

      {remoteSosAlert && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between z-30 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
            <span>🚨</span>
            <span>EMERGENCY SOS: {remoteSosAlert.user?.name} needs immediate assistance!</span>
          </div>
          <button onClick={() => setRemoteSosAlert(null)} className="px-3 py-1 bg-white text-rose-700 rounded-lg text-xs font-bold">Acknowledge</button>
        </div>
      )}

      <main className="relative flex-1 w-full h-full overflow-hidden">
        <TripHUD currentUser={currentUser} friendUser={friendUser} userDist={userDist} friendDist={friendDist}
          friendsApartDist={friendsApartDist} isUserArrived={isUserArrived} isFriendArrived={isFriendArrived}
          areMet={areMet} onCallFriend={handleStartCall} />

        <NavigationBanner routeData={routeData} userPos={userPos} destination={destination}
          transportMode={transportMode} onChangeTransportMode={setTransportMode} userSpeed={userSpeed} />

        <RendezvousRadar userPos={userPos} friendPos={friendPos} friendUser={friendUser} onCallFriend={handleStartCall} />

        <LiveShareSheet currentUser={currentUser} friendUser={friendUser} friendPos={friendPos}
          userPos={userPos} destination={destination} friendsApartDist={friendsApartDist}
          onCallFriend={handleStartCall} onOpenShareModal={() => setIsShareModalOpen(true)} onFocusMap={() => {}} />

        <ArrivalAlertBanner isPriyaArrived={isFriendArrived || isUserArrived} destination={destination}
          onDismiss={() => { setIsFriendArrived(false); setIsUserArrived(false); }} />

        <MapTracker destination={destination} itinerary={itinerary} currentUser={currentUser}
          userPos={userPos} friendUser={friendUser} friendPos={friendPos}
          userDist={userDist} friendDist={friendDist} friendsApartDist={friendsApartDist}
          isUserArrived={isUserArrived} isFriendArrived={isFriendArrived} areMet={areMet}
          roadRouteCoordinates={roadRouteCoordinates}
          onMapClickToSetPos={(coords) => {
            setUserPos(coords);
            socketRef.current?.emit('update-location', { tripCode: activeTripCode, user: currentUser, coords: { lat: coords[0], lng: coords[1] }, speed: userSpeed, heading: 0 });
          }} />
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages}
        onSendMessage={handleSendMessage} currentUser={currentUser} friendUser={friendUser} onCallFriend={handleStartCall} />

      <PlaceSearchModal isOpen={isPlacesSearchOpen} onClose={() => setIsPlacesSearchOpen(false)}
        currentDestination={destination} onSelectDestination={handleSelectDestination}
        onAddToItinerary={handleAddToItinerary} itinerary={itinerary} />

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        activeTripCode={activeTripCode} destination={destination} />

      <TripChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)}
        checklist={checklist} onUpdateChecklist={handleUpdateChecklist} destination={destination} />

      <SavedTripsModal isOpen={isSavedTripsOpen} onClose={() => setIsSavedTripsOpen(false)}
        activeTripCode={activeTripCode} savedTrips={savedTrips}
        onSelectTrip={(code) => { setActiveTripCode(code); setIsSavedTripsOpen(false); }}
        onCreateNewTrip={() => { setIsSavedTripsOpen(false); setIsTripRoomOpen(true); }}
        onDeleteTrip={(code) => {
          setSavedTrips(prev => { const u = prev.filter(t => t.tripCode !== code); localStorage.setItem('tripeye_saved_trips', JSON.stringify(u)); return u; });
        }} />

      <SosModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} userPos={userPos}
        currentUser={currentUser} friendUser={friendUser} onBroadcastSos={handleBroadcastSos} />

      <AuthModal isOpen={isAuthOpen} onLogin={(userData) => { setCurrentUser(userData); setIsAuthOpen(false); }} />

      <TripRoomModal isOpen={isTripRoomOpen} onClose={() => setIsTripRoomOpen(false)} activeTripCode={activeTripCode}
        onCreateTrip={(code, dest) => { setActiveTripCode(code); handleSelectDestination(dest); }}
        onJoinTrip={(code) => setActiveTripCode(code)} />

      <CallModal isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} friend={friendUser}
        isIncoming={isIncomingCall} onAcceptCall={handleAcceptCall} onRejectCall={handleEndCall}
        onEndCall={handleEndCall} callStatus={callStatus} />
    </div>
  );
}
