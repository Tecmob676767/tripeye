import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'trips_db.json');

// Helper to load persistent trips database
function loadTripsDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading trips_db.json:', err);
  }
  return {
    'TEMPLE-101': {
      tripCode: 'TEMPLE-101',
      destination: {
        id: 'akshardham',
        name: 'Akshardham Temple, Delhi',
        landmarkName: 'Main Gate (Gate 1)',
        lat: 28.6127,
        lng: 77.2773,
        geofenceRadius: 100
      },
      itinerary: [
        {
          id: 'akshardham',
          name: 'Akshardham Temple, Delhi',
          landmarkName: 'Main Gate (Gate 1)',
          lat: 28.6127,
          lng: 77.2773
        }
      ],
      messages: [],
      checklist: [
        { id: 1, text: 'Deposit mobile phones & electronics at Counter 1', done: false },
        { id: 2, text: 'Submit shoes at Shoe Stand (Gate 1)', done: false },
        { id: 3, text: 'Purchase Darshan & Exhibition tokens', done: false },
        { id: 4, text: 'Meet at Entrance Courtyard', done: false }
      ],
      createdAt: Date.now()
    }
  };
}

let tripsDb = loadTripsDb();

function saveTripsDb() {
  try {
    // Strip ephemeral socket IDs before saving
    const toSave = {};
    for (const code in tripsDb) {
      toSave[code] = {
        tripCode: tripsDb[code].tripCode,
        destination: tripsDb[code].destination,
        itinerary: tripsDb[code].itinerary || [],
        messages: tripsDb[code].messages || [],
        checklist: tripsDb[code].checklist || [],
        createdAt: tripsDb[code].createdAt || Date.now()
      };
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf8');
  } catch (err) {
    console.warn('Error saving trips_db.json:', err);
  }
}

// In-memory active sockets per trip
const activeTripUsers = {};

// Turn-by-turn routing with transport profiles: driving, walking, cycling
app.get('/api/route', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng, profile = 'driving' } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const osrmProfile = profile === 'walking' ? 'foot' : profile === 'cycling' ? 'bike' : 'driving';

  try {
    const url = "https://router.project-osrm.org/route/v1/" + osrmProfile + "/" + fromLng + "," + fromLat + ";" + toLng + "," + toLat + "?overview=full&geometries=geojson&steps=true";
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TripeyeNavigation' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Route fetch error:', err);
    res.status(500).json({ error: 'Failed to compute route' });
  }
});

// Endpoint to retrieve active public HTTPS tunnel URL
app.get('/api/tunnel-url', (req, res) => {
  try {
    if (fs.existsSync('public-tunnel.json')) {
      const data = JSON.parse(fs.readFileSync('public-tunnel.json', 'utf8'));
      return res.json(data);
    }
  } catch (e) {}
  res.json({ httpsUrl: null });
});

// Google Sync & Cloud Backup Endpoints
app.get('/api/sync/trip/:code', (req, res) => {
  const { code } = req.params;
  if (tripsDb[code]) {
    res.json({ success: true, trip: tripsDb[code] });
  } else {
    res.status(404).json({ success: false, error: 'Trip not found' });
  }
});

app.post('/api/sync/google-backup', (req, res) => {
  const { user, tripCode, tripData } = req.body;
  if (tripCode && tripData) {
    tripsDb[tripCode] = {
      ...tripsDb[tripCode],
      ...tripData,
      lastGoogleSync: Date.now(),
      syncedBy: user?.name
    };
    saveTripsDb();
    return res.json({ success: true, syncedAt: Date.now() });
  }
  res.status(400).json({ error: 'Invalid sync payload' });
});

// Simulated Phone OTP verification endpoint
const otpCache = {};
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
  console.log("📲 [Tripeye SMS Gateway] Sent OTP to " + phone + ": " + otp);

  res.json({ 
    success: true, 
    message: 'OTP dispatched successfully', 
    otp: otp // included for seamless testing / UI auto-toast
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const record = otpCache[phone];
  if (!record) {
    return res.status(400).json({ success: false, error: 'OTP expired or not requested' });
  }
  if (record.otp === otp.trim()) {
    delete otpCache[phone];
    return res.json({ success: true, verified: true });
  }
  res.status(400).json({ success: false, error: 'Invalid verification code' });
});

// Serve frontend dist build if present
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  socket.on('join-trip', ({ tripCode, user, destination, itinerary }) => {
    socket.join(tripCode);

    if (!tripsDb[tripCode]) {
      tripsDb[tripCode] = {
        tripCode,
        destination: destination || null,
        itinerary: itinerary || (destination ? [destination] : []),
        messages: [],
        checklist: [
          { id: 1, text: 'Deposit mobile phones & electronics at Counter 1', done: false },
          { id: 2, text: 'Submit shoes at Shoe Stand (Gate 1)', done: false },
          { id: 3, text: 'Purchase Darshan & Exhibition tokens', done: false },
          { id: 4, text: 'Meet at Entrance Courtyard', done: false }
        ],
        createdAt: Date.now()
      };
      saveTripsDb();
    } else {
      // If client provided a destination and room had none, update
      if (destination && !tripsDb[tripCode].destination) {
        tripsDb[tripCode].destination = destination;
        saveTripsDb();
      }
    }

    if (!activeTripUsers[tripCode]) {
      activeTripUsers[tripCode] = {};
    }

    activeTripUsers[tripCode][socket.id] = {
      socketId: socket.id,
      ...user
    };

    // Emit full persisted state to the joining user
    socket.emit('trip-state', {
      tripCode,
      destination: tripsDb[tripCode].destination,
      itinerary: tripsDb[tripCode].itinerary || [],
      messages: tripsDb[tripCode].messages || [],
      checklist: tripsDb[tripCode].checklist || [],
      users: Object.values(activeTripUsers[tripCode])
    });

    // Notify room of updated users
    io.to(tripCode).emit('users-updated', {
      users: Object.values(activeTripUsers[tripCode])
    });
  });

  socket.on('update-destination', ({ tripCode, destination }) => {
    if (tripsDb[tripCode]) {
      tripsDb[tripCode].destination = destination;
      saveTripsDb();
      socket.to(tripCode).emit('destination-updated', destination);
    }
  });

  socket.on('update-itinerary', ({ tripCode, itinerary }) => {
    if (tripsDb[tripCode]) {
      tripsDb[tripCode].itinerary = itinerary;
      saveTripsDb();
      socket.to(tripCode).emit('itinerary-updated', itinerary);
    }
  });

  socket.on('update-checklist', ({ tripCode, checklist }) => {
    if (tripsDb[tripCode]) {
      tripsDb[tripCode].checklist = checklist;
      saveTripsDb();
      socket.to(tripCode).emit('checklist-updated', checklist);
    }
  });

  socket.on('update-location', ({ tripCode, coords, speed, heading }) => {
    if (activeTripUsers[tripCode] && activeTripUsers[tripCode][socket.id]) {
      activeTripUsers[tripCode][socket.id].lat = coords.lat;
      activeTripUsers[tripCode][socket.id].lng = coords.lng;
      activeTripUsers[tripCode][socket.id].accuracy = coords.accuracy;
      activeTripUsers[tripCode][socket.id].speed = speed;
      activeTripUsers[tripCode][socket.id].heading = heading;

      socket.to(tripCode).emit('peer-location', {
        socketId: socket.id,
        user: activeTripUsers[tripCode][socket.id],
        coords,
        speed,
        heading
      });
    }
  });

  socket.on('send-message', ({ tripCode, message }) => {
    if (tripsDb[tripCode]) {
      if (!tripsDb[tripCode].messages) tripsDb[tripCode].messages = [];
      tripsDb[tripCode].messages.push(message);
      // Keep last 100 messages
      if (tripsDb[tripCode].messages.length > 100) {
        tripsDb[tripCode].messages = tripsDb[tripCode].messages.slice(-100);
      }
      saveTripsDb();
    }
    io.to(tripCode).emit('receive-message', message);
  });

  socket.on('sos-alert', ({ tripCode, user, coords, address }) => {
    io.to(tripCode).emit('sos-received', {
      user,
      coords,
      address,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('call-user', ({ tripCode, toSocketId, callerInfo, signalData }) => {
    io.to(toSocketId).emit('incoming-call', {
      fromSocketId: socket.id,
      callerInfo,
      signalData
    });
  });

  socket.on('answer-call', ({ toSocketId, signalData }) => {
    io.to(toSocketId).emit('call-accepted', {
      fromSocketId: socket.id,
      signalData
    });
  });

  socket.on('end-call', ({ toSocketId, tripCode }) => {
    if (toSocketId) {
      io.to(toSocketId).emit('call-ended', { fromSocketId: socket.id });
    } else if (tripCode) {
      socket.to(tripCode).emit('call-ended', { fromSocketId: socket.id });
    }
  });

  socket.on('disconnect', () => {
    for (const tripCode in activeTripUsers) {
      if (activeTripUsers[tripCode][socket.id]) {
        delete activeTripUsers[tripCode][socket.id];
        io.to(tripCode).emit('users-updated', {
          users: Object.values(activeTripUsers[tripCode])
        });
      }
    }
  });
});

// Fallback to SPA index.html
if (fs.existsSync(distPath)) {
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log("Tripeye Server running with Google Sync, Persistent DB & Routing on port " + PORT);
});
