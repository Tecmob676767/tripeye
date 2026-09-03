import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active trips: { [tripCode]: { destination, users: { [socketId]: { id, name, phone, dob, lat, lng } } } }
const trips = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join trip room
  socket.on('join-trip', ({ tripCode, user, destination }) => {
    socket.join(tripCode);
    if (!trips[tripCode]) {
      trips[tripCode] = {
        tripCode,
        destination: destination || null,
        users: {}
      };
    }

    // Save user info
    trips[tripCode].users[socket.id] = {
      socketId: socket.id,
      ...user
    };

    console.log(`User ${user.name} (${user.phone}) joined trip ${tripCode}`);

    // Notify room members
    io.to(tripCode).emit('trip-state', {
      tripCode,
      destination: trips[tripCode].destination,
      users: Object.values(trips[tripCode].users)
    });
  });

  // Real-time location broadcast
  socket.on('update-location', ({ tripCode, coords }) => {
    if (trips[tripCode] && trips[tripCode].users[socket.id]) {
      trips[tripCode].users[socket.id].lat = coords.lat;
      trips[tripCode].users[socket.id].lng = coords.lng;
      trips[tripCode].users[socket.id].accuracy = coords.accuracy;
      trips[tripCode].users[socket.id].lastSeen = Date.now();

      socket.to(tripCode).emit('peer-location', {
        socketId: socket.id,
        user: trips[tripCode].users[socket.id],
        coords
      });
    }
  });

  // Chat message
  socket.on('send-message', ({ tripCode, message }) => {
    io.to(tripCode).emit('receive-message', message);
  });

  // WebRTC Audio Call signaling
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

  socket.on('ice-candidate', ({ toSocketId, candidate }) => {
    io.to(toSocketId).emit('ice-candidate', {
      fromSocketId: socket.id,
      candidate
    });
  });

  socket.on('end-call', ({ toSocketId, tripCode }) => {
    if (toSocketId) {
      io.to(toSocketId).emit('call-ended', { fromSocketId: socket.id });
    } else if (tripCode) {
      socket.to(tripCode).emit('call-ended', { fromSocketId: socket.id });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const tripCode in trips) {
      if (trips[tripCode].users[socket.id]) {
        const userName = trips[tripCode].users[socket.id].name;
        delete trips[tripCode].users[socket.id];
        io.to(tripCode).emit('user-left', { socketId: socket.id, userName });
        io.to(tripCode).emit('trip-state', {
          tripCode,
          destination: trips[tripCode].destination,
          users: Object.values(trips[tripCode].users)
        });
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tripeye Real-Time Signaling Server running on port ${PORT}`);
});