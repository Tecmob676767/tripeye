import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

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
let firebaseAuth = null;

export function getFirebaseAuth() {
  const { app } = initFirebase();
  if (!app) return null;
  if (!firebaseAuth) {
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
}

export function setupRecaptcha(containerId = 'recaptcha-container') {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (e) {}
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('✅ Google reCAPTCHA solved for phone auth');
      }
    });
    return window.recaptchaVerifier;
  } catch (err) {
    console.warn('reCAPTCHA init notice:', err.message);
    return null;
  }
}

export async function sendFirebasePhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not available');

  let cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  if (!cleanNumber.startsWith('+')) {
    cleanNumber = '+91' + cleanNumber;
  }

  const verifier = setupRecaptcha(containerId);
  const confirmationResult = await signInWithPhoneNumber(auth, cleanNumber, verifier);
  window.confirmationResult = confirmationResult;
  console.log('📲 Real SMS sent by Google Firebase to:', cleanNumber);
  return confirmationResult;
}

export async function verifyFirebasePhoneOtp(otpCode) {
  if (!window.confirmationResult) {
    throw new Error('No active SMS confirmation found');
  }
  const result = await window.confirmationResult.confirm(otpCode);
  return result.user;
}
