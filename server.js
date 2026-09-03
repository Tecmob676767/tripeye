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

  socket.on('update-location', ({ tripCode, coords }) => {
    if (trips[tripCode] && trips[tripCode].users[socket.id]) {
      trips[tripCode].users[socket.id].lat = coords.lat;
      trips[tripCode].users[socket.id].lng = coords.lng;
      trips[tripCode].users[socket.id].accuracy = coords.accuracy;

      socket.to(tripCode).emit('peer-location', {
        socketId: socket.id,
        user: trips[tripCode].users[socket.id],
        coords
      });
    }
  });

  socket.on('send-message', ({ tripCode, message }) => {
    io.to(tripCode).emit('receive-message', message);
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

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tripeye Signaling Server running on port ${PORT}`);
});