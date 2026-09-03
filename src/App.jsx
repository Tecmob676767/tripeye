import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import MapTracker from './components/MapTracker';
import TripHUD from './components/TripHUD';
import ArrivalAlertBanner from './components/ArrivalAlertBanner';
import ChatDrawer from './components/ChatDrawer';
import TripDetailsModal from './components/TripDetailsModal';
import AuthModal from './components/AuthModal';
import TripRoomModal from './components/TripRoomModal';
import CallModal from './components/CallModal';
import { PRESET_DESTINATIONS, getDistanceMeters } from './utils/geo';
import { playArrivalSound, playMessageSound } from './utils/audio';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tripeye_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(!currentUser);

  // Active Trip Room & Destination
  const [activeTripCode, setActiveTripCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('trip') || 'TEMPLE-101';
  });
  const [destination, setDestination] = useState(PRESET_DESTINATIONS[0]);
  const [isTripRoomOpen, setIsTripRoomOpen] = useState(false);

  // Connected Peers in the room
  const [friendUser, setFriendUser] = useState(null);

  // Real GPS Positions [lat, lng]
  const [userPos, setUserPos] = useState(null);
  const [friendPos, setFriendPos] = useState(null);

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState([]);

  // Calling state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callStatus, setCallStatus] = useState('calling'); // 'calling', 'ringing', 'connected', 'ended'
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Geofence & arrival state
  const [isUserArrived, setIsUserArrived] = useState(false);
  const [isFriendArrived, setIsFriendArrived] = useState(false);
  const [areMet, setAreMet] = useState(false);
  const hasTriggeredArrivalRef = useRef(false);

  // Socket reference
  const socketRef = useRef(null);

  // Connect to Socket.io signaling server
  useEffect(() => {
    const socketServerUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : `http://${window.location.hostname}:3001`;

    const socket = io(socketServerUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Tripeye real-time server:', socket.id);
      if (currentUser && activeTripCode) {
        socket.emit('join-trip', {
          tripCode: activeTripCode,
          user: currentUser,
          destination
        });
      }
    });

    // Room state update
    socket.on('trip-state', ({ users }) => {
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

    // Peer location update
    socket.on('peer-location', ({ user, coords }) => {
      setFriendUser(prev => ({ ...prev, ...user }));
      setFriendPos([coords.lat, coords.lng]);
    });

    // Chat message received
    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      playMessageSound();
      if (!isChatOpen && msg.userId !== currentUser?.id) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Incoming Call signaling
    socket.on('incoming-call', ({ fromSocketId, callerInfo }) => {
      setIsIncomingCall(true);
      setCallStatus('ringing');
      setIsCallOpen(true);
    });

    socket.on('call-accepted', () => {
      setCallStatus('connected');
    });

    socket.on('call-ended', () => {
      setIsCallOpen(false);
      setCallStatus('ended');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, activeTripCode]);

  // Real GPS tracking using navigator.geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setUserPos([coords.lat, coords.lng]);

        // Broadcast to trip room
        if (socketRef.current && activeTripCode) {
          socketRef.current.emit('update-location', {
            tripCode: activeTripCode,
            coords
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback default starting point near destination if permission denied on desktop
        if (!userPos) {
          setUserPos([destination.lat + 0.005, destination.lng + 0.005]);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTripCode, destination]);

  // Distances calculations
  const destCoords = [destination.lat, destination.lng];
  const userDist = userPos ? getDistanceMeters(userPos[0], userPos[1], destCoords[0], destCoords[1]) : 0;
  const friendDist = friendPos ? getDistanceMeters(friendPos[0], friendPos[1], destCoords[0], destCoords[1]) : 0;
  const friendsApartDist = (userPos && friendPos) ? getDistanceMeters(userPos[0], userPos[1], friendPos[0], friendPos[1]) : 0;

  // Geofence detection for real coordinates
  useEffect(() => {
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

  // Sending real chat message
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

  // Call Handlers
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
      console.warn('Microphone permission not granted:', e);
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

  // Fallback: Click on map to set position (helpful when testing on a desktop PC without GPS)
  const handleMapClickToSetPos = (coords) => {
    setUserPos(coords);
    if (socketRef.current && activeTripCode) {
      socketRef.current.emit('update-location', {
        tripCode: activeTripCode,
        coords: { lat: coords[0], lng: coords[1] }
      });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        friendUser={friendUser}
        activeTripCode={activeTripCode}
        destination={destination}
        onOpenTripRoom={() => setIsTripRoomOpen(true)}
        onOpenDetails={() => setIsDetailsOpen(true)}
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

      {/* Main Map Container */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Floating Proximity HUD */}
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

        {/* Dynamic Arrival Banner */}
        <ArrivalAlertBanner
          isPriyaArrived={isFriendArrived || isUserArrived}
          destination={destination}
          onDismiss={() => {
            setIsFriendArrived(false);
            setIsUserArrived(false);
          }}
        />

        {/* Interactive Leaflet Map */}
        <MapTracker
          destination={destination}
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
          onMapClickToSetPos={handleMapClickToSetPos}
        />

        {/* Desktop Helper Pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 pointer-events-none flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live GPS Active • Click anywhere on map to reposition manually</span>
        </div>
      </main>

      {/* Real-Time In-Trip Chat */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
        friendUser={friendUser}
        onCallFriend={handleStartCall}
      />

      {/* Temple Rendezvous Guide */}
      <TripDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        destination={destination}
      />

      {/* Real Login Modal (Strict: Name, DOB, Phone number) */}
      <AuthModal
        isOpen={isAuthOpen}
        onLogin={(userData) => {
          setCurrentUser(userData);
          setIsAuthOpen(false);
        }}
      />

      {/* Trip Room Modal (Invite, Join, Create) */}
      <TripRoomModal
        isOpen={isTripRoomOpen}
        onClose={() => setIsTripRoomOpen(false)}
        activeTripCode={activeTripCode}
        onCreateTrip={(code, dest) => {
          setActiveTripCode(code);
          setDestination(dest);
          const newUrl = `${window.location.pathname}?trip=${code}`;
          window.history.pushState({}, '', newUrl);
        }}
        onJoinTrip={(code) => {
          setActiveTripCode(code);
          const newUrl = `${window.location.pathname}?trip=${code}`;
          window.history.pushState({}, '', newUrl);
        }}
      />

      {/* Audio & Phone Call Modal */}
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