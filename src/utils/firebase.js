import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyTripeyeSyncDefaultKey2026_LiveKey",
  authDomain: "tripeye-rendezvous.firebaseapp.com",
  databaseURL: "https://tripeye-rendezvous-default-rtdb.firebaseio.com",
  projectId: "tripeye-rendezvous",
  storageBucket: "tripeye-rendezvous.appspot.com",
  messagingSenderId: "984210384721",
  appId: "1:984210384721:web:8a9b2c3d4e5f6a7b"
};

export function getActiveFirebaseConfig() {
  try {
    const saved = localStorage.getItem('tripeye_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveCustomFirebaseConfig(config) {
  try {
    localStorage.setItem('tripeye_firebase_config', JSON.stringify(config));
  } catch (e) {}
}

let firebaseApp = null;
let firebaseDb = null;
let isFirebaseInitialized = false;

export function initFirebase() {
  if (isFirebaseInitialized && firebaseApp) return { app: firebaseApp, db: firebaseDb };
  try {
    const config = getActiveFirebaseConfig();
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firebaseDb = getDatabase(firebaseApp);
    isFirebaseInitialized = true;
    console.log('🔥 Google Firebase Realtime Database connected:', config.projectId);
    return { app: firebaseApp, db: firebaseDb };
  } catch (err) {
    console.warn('Firebase init notice:', err.message);
    return { app: null, db: null };
  }
}

export async function syncTripToFirebase(tripCode, tripData) {
  if (!tripCode) return false;
  try {
    const { db } = initFirebase();
    if (!db) {
      await fetch('/api/sync/google-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripCode, tripData })
      });
      return true;
    }
    const cleanData = {
      tripCode,
      destination: tripData.destination || null,
      itinerary: tripData.itinerary || [],
      checklist: tripData.checklist || [],
      messages: (tripData.messages || []).slice(-50),
      lastFirebaseSync: Date.now(),
      syncedBy: tripData.user?.name || 'Tripeye Companion'
    };
    const tripRef = ref(db, 'trips/' + tripCode);
    await set(tripRef, cleanData);
    console.log('🔥 Synced to Google Firebase Realtime Cloud: trips/' + tripCode);
    return true;
  } catch (err) {
    try {
      await fetch('/api/sync/google-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripCode, tripData })
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

export function subscribeToFirebaseTrip(tripCode, onUpdate) {
  if (!tripCode) return () => {};
  try {
    const { db } = initFirebase();
    if (!db) return () => {};
    const tripRef = ref(db, 'trips/' + tripCode);
    const unsubscribe = onValue(tripRef, (snapshot) => {
      const val = snapshot.val();
      if (val && onUpdate) onUpdate(val);
    }, (error) => {
      console.warn('Firebase listener notice:', error);
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}