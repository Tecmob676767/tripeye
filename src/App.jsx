import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import MapTracker from './components/MapTracker';
import TripHUD from './components/TripHUD';
import NavigationBanner from './components/NavigationBanner';
import ArrivalAlertBanner from './components/ArrivalAlertBanner';
import RendezvousRadar from './components/RendezvousRadar';
import SosModal from './components/SosModal';
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
    const saved = localStorage.getItem('tripeye_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(!currentUser);

  const [activeTripCode, setActiveTripCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trip') || 'TEMPLE-101';
  });

  const [destination, setDestination] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const destId = params.get('dest');
    if (destId) {
      const found = PRESET_DESTINATIONS.find(d => d.id === destId);
      if (found) return found;
    }
    return PRESET_DESTINATIONS[0];
  });

  const [itinerary, setItinerary] = useState(() => [PRESET_DESTINATIONS[0]]);

  const [transportMode, setTransportMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [roadRouteCoordinates, setRoadRouteCoordinates] = useState([]);
  const [userSpeed, setUserSpeed] = useState(0);

  const [isTripRoomOpen, setIsTripRoomOpen] = useState(false);
  const [isPlacesSearchOpen, setIsPlacesSearchOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState([]);

  const [friendUser, setFriendUser] = useState(null);
  const [userPos, setUserPos] = useState(null);
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

  const fetchRoadRoute = async (fromCoords, toCoords, mode = transportMode) => {
    if (!fromCoords || !toCoords) return;
    try {
      const res = await fetch("/api/route?fromLat=" + fromCoords[0] + "&fromLng=" + fromCoords[1] + "&toLat=" + toCoords[0] + "&toLng=" + toCoords[1] + "&profile=" + mode);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0]);
        const latLngs = data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
        setRoadRouteCoordinates(latLngs);
      }
    } catch (e) {
      console.warn('Route fetch error:', e);
    }
  };

  useEffect(() => {
    if (userPos && destination) {
      fetchRoadRoute(userPos, [destination.lat, destination.lng], transportMode);
    }
  }, [userPos, destination, transportMode]);

  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Tripeye server:', socket.id);
      if (currentUser && activeTripCode) {
        socket.emit('join-trip', {
          tripCode: activeTripCode,
          user: currentUser,
          destination,
          itinerary
        });
      }
    });

    socket.on('trip-state', ({ users, destination: remoteDest, itinerary: remoteItin }) => {
      if (remoteDest) setDestination(remoteDest);
      if (remoteItin) setItinerary(remoteItin);

      const otherUser = users.find(u => u.id !== currentUser?.id);
      if (otherUser) {
        setFriendUser(otherUser);
        if (otherUser.lat && otherUser.lng) {
          setFriendPos([otherUser.lat, otherUser.lng]);
        }
      } else {
        setFriendUser(null);
      }
    });

    socket.on('peer-location', ({ user, coords, speed }) => {
      setFriendUser(prev => ({ ...prev, ...user }));
      setFriendPos([coords.lat, coords.lng]);
    });

    socket.on('destination-updated', (newDest) => {
      setDestination(newDest);
      hasTriggeredArrivalRef.current = false;
    });

    socket.on('itinerary-updated', (newItin) => {
      setItinerary(newItin);
    });

    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      playMessageSound();
      if (!isChatOpen && msg.userId !== currentUser?.id) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('sos-received', (sosData) => {
      setRemoteSosAlert(sosData);
      playSosSiren();
    });

    socket.on('incoming-call', () => {
      setIsIncomingCall(true);
      setCallStatus('ringing');
      setIsCallOpen(true);
    });

    socket.on('call-accepted', () => setCallStatus('connected'));

    socket.on('call-ended', () => {
      setIsCallOpen(false);
      setCallStatus('ended');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    });

    return () => socket.disconnect();
  }, [currentUser, activeTripCode]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setUserPos([coords.lat, coords.lng]);
        if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
          setUserSpeed(pos.coords.speed);
        }

        if (socketRef.current && activeTripCode) {
          socketRef.current.emit('update-location', {
            tripCode: activeTripCode,
            coords,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0
          });
        }
      },
      (err) => {
        console.warn('GPS notice:', err.message);
        if (!userPos && destination) {
          setUserPos([destination.lat + 0.005, destination.lng + 0.005]);
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTripCode, destination]);

  const destCoords = destination ? [destination.lat, destination.lng] : [0, 0];
  const userDist = userPos ? getDistanceMeters(userPos[0], userPos[1], destCoords[0], destCoords[1]) : 0;
  const friendDist = friendPos ? getDistanceMeters(friendPos[0], friendPos[1], destCoords[0], destCoords[1]) : 0;
  const friendsApartDist = (userPos && friendPos) ? getDistanceMeters(userPos[0], userPos[1], friendPos[0], friendPos[1]) : 0;

  useEffect(() => {
    if (!destination) return;
    const userIn = userDist > 0 && userDist <= destination.geofenceRadius;
    const friendIn = friendDist > 0 && friendDist <= destination.geofenceRadius;
    const together = friendsApartDist > 0 && friendsApartDist <= 25;

    setIsUserArrived(userIn);
    setIsFriendArrived(friendIn);
    setAreMet(together);

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
      const exists = prev.some(p => p.id === dest.id);
      const updated = exists ? prev : [...prev, dest];
      if (socketRef.current) {
        socketRef.current.emit('update-itinerary', { tripCode: activeTripCode, itinerary: updated });
      }
      return updated;
    });

    if (socketRef.current) {
      socketRef.current.emit('update-destination', { tripCode: activeTripCode, destination: dest });
    }
  };

  const handleAddToItinerary = (place) => {
    setItinerary(prev => {
      const exists = prev.some(p => p.id === place.id);
      if (exists) return prev;
      const updated = [...prev, place];
      if (socketRef.current) {
        socketRef.current.emit('update-itinerary', { tripCode: activeTripCode, itinerary: updated });
      }
      return updated;
    });
  };

  const handleSendMessage = (text) => {
    if (!currentUser || !activeTripCode) return;
    const newMsg = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        tripCode: activeTripCode,
        message: newMsg
      });
    }
  };

  const handleBroadcastSos = (sosInfo) => {
    if (socketRef.current && activeTripCode && currentUser) {
      socketRef.current.emit('sos-alert', {
        tripCode: activeTripCode,
        user: currentUser,
        coords: sosInfo,
        address: sosInfo.address
      });
    }
  };

  const handleStartCall = async () => {
    if (!friendUser) return;
    setIsIncomingCall(false);
    setCallStatus('calling');
    setIsCallOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (socketRef.current && friendUser.socketId) {
        socketRef.current.emit('call-user', {
          tripCode: activeTripCode,
          toSocketId: friendUser.socketId,
          callerInfo: currentUser
        });
      }
    } catch (e) {
      console.warn('Microphone notice:', e);
    }
  };

  const handleAcceptCall = async () => {
    setCallStatus('connected');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (socketRef.current && friendUser?.socketId) {
        socketRef.current.emit('answer-call', {
          toSocketId: friendUser.socketId
        });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleEndCall = () => {
    setIsCallOpen(false);
    setCallStatus('ended');
    if (socketRef.current) {
      socketRef.current.emit('end-call', {
        toSocketId: friendUser?.socketId,
        tripCode: activeTripCode
      });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      <Navbar
        currentUser={currentUser}
        friendUser={friendUser}
        activeTripCode={activeTripCode}
        destination={destination}
        itineraryCount={itinerary.length}
        onOpenPlacesSearch={() => setIsPlacesSearchOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenTripRoom={() => setIsTripRoomOpen(true)}
        onOpenSos={() => setIsSosOpen(true)}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setUnreadCount(0);
        }}
        unreadCount={unreadCount}
        onCallFriend={handleStartCall}
        onLogout={() => {
          localStorage.removeItem('tripeye_user');
          setCurrentUser(null);
          setIsAuthOpen(true);
        }}
      />

      {remoteSosAlert && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between z-30 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
            <span className="text-lg">🚨</span>
            <span>EMERGENCY SOS: {remoteSosAlert.user?.name} needs immediate assistance!</span>
          </div>
          <button
            onClick={() => setRemoteSosAlert(null)}
            className="px-3 py-1 bg-white text-rose-700 rounded-lg text-xs font-bold shadow hover:bg-slate-100"
          >
            Acknowledge
          </button>
        </div>
      )}

      <main className="relative flex-1 w-full h-full overflow-hidden">
        <TripHUD
          currentUser={currentUser}
          friendUser={friendUser}
          userDist={userDist}
          friendDist={friendDist}
          friendsApartDist={friendsApartDist}
          isUserArrived={isUserArrived}
          isFriendArrived={isFriendArrived}
          areMet={areMet}
          onCallFriend={handleStartCall}
        />

        <NavigationBanner
          routeData={routeData}
          userPos={userPos}
          destination={destination}
          transportMode={transportMode}
          onChangeTransportMode={setTransportMode}
          userSpeed={userSpeed}
        />

        <RendezvousRadar
          userPos={userPos}
          friendPos={friendPos}
          friendUser={friendUser}
          onCallFriend={handleStartCall}
        />

        <ArrivalAlertBanner
          isPriyaArrived={isFriendArrived || isUserArrived}
          destination={destination}
          onDismiss={() => {
            setIsFriendArrived(false);
            setIsUserArrived(false);
          }}
        />

        <MapTracker
          destination={destination}
          itinerary={itinerary}
          currentUser={currentUser}
          userPos={userPos}
          friendUser={friendUser}
          friendPos={friendPos}
          userDist={userDist}
          friendDist={friendDist}
          friendsApartDist={friendsApartDist}
          isUserArrived={isUserArrived}
          isFriendArrived={isFriendArrived}
          areMet={areMet}
          roadRouteCoordinates={roadRouteCoordinates}
          onMapClickToSetPos={(coords) => {
            setUserPos(coords);
            if (socketRef.current && activeTripCode) {
              socketRef.current.emit('update-location', {
                tripCode: activeTripCode,
                coords: { lat: coords[0], lng: coords[1] },
                speed: userSpeed,
                heading: 0
              });
            }
          }}
        />
      </main>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
        friendUser={friendUser}
        onCallFriend={handleStartCall}
      />

      <PlaceSearchModal
        isOpen={isPlacesSearchOpen}
        onClose={() => setIsPlacesSearchOpen(false)}
        currentDestination={destination}
        onSelectDestination={handleSelectDestination}
        onAddToItinerary={handleAddToItinerary}
        itinerary={itinerary}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeTripCode={activeTripCode}
        destination={destination}
      />

      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        userPos={userPos}
        currentUser={currentUser}
        friendUser={friendUser}
        onBroadcastSos={handleBroadcastSos}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onLogin={(userData) => {
          setCurrentUser(userData);
          setIsAuthOpen(false);
        }}
      />

      <TripRoomModal
        isOpen={isTripRoomOpen}
        onClose={() => setIsTripRoomOpen(false)}
        activeTripCode={activeTripCode}
        onCreateTrip={(code, dest) => {
          setActiveTripCode(code);
          handleSelectDestination(dest);
          const newUrl = window.location.pathname + "?trip=" + code;
          window.history.pushState({}, '', newUrl);
        }}
        onJoinTrip={(code) => {
          setActiveTripCode(code);
          const newUrl = window.location.pathname + "?trip=" + code;
          window.history.pushState({}, '', newUrl);
        }}
      />

      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        friend={friendUser}
        isIncoming={isIncomingCall}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleEndCall}
        onEndCall={handleEndCall}
        callStatus={callStatus}
      />
    </div>
  );
}
