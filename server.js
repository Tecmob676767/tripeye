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

app.get('/api/tunnel-url', (req, res) => {
  try {
    if (fs.existsSync('public-tunnel.json')) {
      const data = JSON.parse(fs.readFileSync('public-tunnel.json', 'utf8'));
      return res.json(data);
    }
  } catch (e) {}
  res.json({ httpsUrl: null });
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const trips = {};

io.on('connection', (socket) => {
  socket.on('join-trip', ({ tripCode, user, destination, itinerary }) => {
    socket.join(tripCode);
    if (!trips[tripCode]) {
      trips[tripCode] = {
        tripCode,
        destination: destination || null,
        itinerary: itinerary || [],
        users: {}
      };
    }

    trips[tripCode].users[socket.id] = {
      socketId: socket.id,
      ...user
    };

    io.to(tripCode).emit('trip-state', {
      tripCode,
      destination: trips[tripCode].destination,
      itinerary: trips[tripCode].itinerary,
      users: Object.values(trips[tripCode].users)
    });
  });

  socket.on('update-destination', ({ tripCode, destination }) => {
    if (trips[tripCode]) {
      trips[tripCode].destination = destination;
      socket.to(tripCode).emit('destination-updated', destination);
    }
  });

  socket.on('update-itinerary', ({ tripCode, itinerary }) => {
    if (trips[tripCode]) {
      trips[tripCode].itinerary = itinerary;
      socket.to(tripCode).emit('itinerary-updated', itinerary);
    }
  });

  socket.on('update-location', ({ tripCode, coords, speed, heading }) => {
    if (trips[tripCode] && trips[tripCode].users[socket.id]) {
      trips[tripCode].users[socket.id].lat = coords.lat;
      trips[tripCode].users[socket.id].lng = coords.lng;
      trips[tripCode].users[socket.id].accuracy = coords.accuracy;
      trips[tripCode].users[socket.id].speed = speed;
      trips[tripCode].users[socket.id].heading = heading;

      socket.to(tripCode).emit('peer-location', {
        socketId: socket.id,
        user: trips[tripCode].users[socket.id],
        coords,
        speed,
        heading
      });
    }
  });

  socket.on('send-message', ({ tripCode, message }) => {
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
    for (const tripCode in trips) {
      if (trips[tripCode].users[socket.id]) {
        delete trips[tripCode].users[socket.id];
        io.to(tripCode).emit('trip-state', {
          tripCode,
          destination: trips[tripCode].destination,
          itinerary: trips[tripCode].itinerary,
          users: Object.values(trips[tripCode].users)
        });
      }
    }
  });
});

if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log("Tripeye Server with Navigation Routing running on port " + PORT);
});
