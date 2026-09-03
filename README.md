# 👁️ Tripeye — Real-Time Collaborative Trip Planner & Meetup Hub

Tripeye is a real-time collaborative trip and rendezvous web application designed for friends meeting at landmark destinations (temples, festivals, monuments, crowded gates). It eliminates the friction of finding each other through live GPS tracking, arrival geofencing notifications, in-app calling, and trip chat.

---

## ✨ Features

- **🔐 Frictionless Authentication**: Simple login with Full Name, Date of Birth (DOB), and Phone Number (no passwords required).
- **📍 Real-Time GPS Tracking**: Dual-avatar live interactive map tracking both users approaching the landmark.
- **🔔 Geofencing & Arrival Alerts**: Audio chime, visual banner, and confetti celebration the moment a friend arrives within 110m of the destination gate.
- **📞 In-App & Direct Cellular Calling**:
  - **In-App Voice Call**: Real-time WebRTC audio call with ringing, mute/unmute, and live duration counter.
  - **Direct Phone Call**: One-tap native cellular dialer shortcut using the friend's registered phone number.
- **💬 In-Trip Live Chat**: Timestamped messaging with one-tap quick status chips (e.g. *Looking for parking*, *At shoe counter*, *At North Gate*).
- **🛕 Destination Guides & Checklists**: Temple etiquette, timings, shoe deposit info, and interactive shared packing checklist.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Tecmob676767/tripeye.git
cd tripeye

# 2. Install dependencies
npm install

# 3. Run the real-time backend
node server.js

# 4. In another terminal, run the frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Maps**: Leaflet.js, OpenStreetMap, CartoDB
- **Real-Time & Calls**: Socket.io, WebRTC Audio, Web Audio API
- **Backend**: Node.js, Express
