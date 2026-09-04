export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters) {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function calculateETA(distanceMeters, speedKmh = 25) {
  if (distanceMeters <= 30) return 'Arrived';
  const speedMs = (speedKmh * 1000) / 3600;
  const seconds = Math.round(distanceMeters / speedMs);
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 1) return '< 1 min';
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

// Free live search using OpenStreetMap Nominatim
export async function searchPlacesLive(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`);
    const data = await res.json();
    return data.map((item, index) => ({
      id: 'custom_' + item.place_id,
      name: item.name || item.display_name.split(',')[0],
      landmarkName: item.display_name.split(',').slice(0, 2).join(','),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      geofenceRadius: 110,
      notes: 'Custom meetup destination: ' + item.display_name,
      dressCode: 'General respectful attire.',
      openingHours: 'Check local timings'
    }));
  } catch (e) {
    console.warn('Nominatim search error:', e);
    return [];
  }
}

// Comprehensive catalog of famous temples & visit places
export const PRESET_DESTINATIONS = [
  {
    id: 'akshardham',
    name: 'Akshardham Temple, Delhi',
    category: 'Temple',
    landmarkName: 'Main North Gate & Shoe Stall 3',
    lat: 28.6127,
    lng: 77.2773,
    geofenceRadius: 110,
    notes: 'Meet right by the Shoe Stall #3 and Cloakroom before entering security queue.',
    dressCode: 'Cover shoulders and knees. No phones or electronics inside sanctum.',
    openingHours: '9:30 AM – 8:00 PM (Aarti at 6:30 PM)',
    checklist: [
      { id: 1, text: 'Deposit Mobile Phones at Cloakroom', checked: false, owner: 'Both' },
      { id: 2, text: 'Collect Prasad Box from Counter', checked: false, owner: 'Rahul' },
      { id: 3, text: 'Drop shoes at Stall #3', checked: false, owner: 'Friend' }
    ]
  },
  {
    id: 'meenakshi',
    name: 'Meenakshi Amman Temple, Madurai',
    category: 'Temple',
    landmarkName: 'East Gopuram (Tower) Gate',
    lat: 9.9195,
    lng: 78.1193,
    geofenceRadius: 100,
    notes: 'Meet near East Chitra Street entrance beside the Jasmine Flower Mandi.',
    dressCode: 'Traditional Indian attire mandatory (Dhoti/Kurta for men, Sarees/Salwar for women).',
    openingHours: '5:00 AM – 12:30 PM, 4:00 PM – 10:00 PM',
    checklist: [
      { id: 1, text: 'Buy Madurai Malli Jasmine Garlands', checked: false, owner: 'Both' },
      { id: 2, text: 'Ghee deepams for inner sanctum', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'tirupati',
    name: 'Tirupati Balaji (Venkateswara Swamy)',
    category: 'Temple',
    landmarkName: 'Vaikuntam Queue Complex 1 Gate',
    lat: 13.6833,
    lng: 79.3472,
    geofenceRadius: 120,
    notes: 'Meet outside Vaikuntam Queue Complex entrance near Laddu distribution counter.',
    dressCode: 'Strict traditional dress: Dhoti/Kurta or Pyjama, Saree or Chudidar with Dupatta.',
    openingHours: 'Open 24 Hours for Sarva Darshan queues',
    checklist: [
      { id: 1, text: 'Keep original Aadhaar card handy', checked: true, owner: 'Both' },
      { id: 2, text: 'Collect Laddu tokens after Darshan', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'kedarnath',
    name: 'Kedarnath Jyotirlinga, Uttarakhand',
    category: 'Temple',
    landmarkName: 'Main Mandir Courtyard (Nandi Statue)',
    lat: 30.7352,
    lng: 79.0669,
    geofenceRadius: 100,
    notes: 'Meet beside the giant stone Nandi bull statue directly facing the temple entrance.',
    dressCode: 'Heavy woolens, windcheater, thermal wear. Strict altitude caution.',
    openingHours: '4:00 AM – 7:00 PM (May to November)',
    checklist: [
      { id: 1, text: 'Yatra Registration Slip / Biometric Card', checked: true, owner: 'Both' },
      { id: 2, text: 'Raincoat & Trekking Poles', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'golden_temple',
    name: 'Golden Temple (Harmandir Sahib), Amritsar',
    category: 'Temple',
    landmarkName: 'Ghanta Ghar (Clock Tower) Gate',
    lat: 31.6200,
    lng: 74.8765,
    geofenceRadius: 110,
    notes: 'Meet near Clock Tower entrance next to the Sarovar water wash and head scarves stall.',
    dressCode: 'Head must be covered at all times (scarves available). Barefoot through water trough.',
    openingHours: 'Open 24 Hours (Langar hall continuous)',
    checklist: [
      { id: 1, text: 'Wear head scarf / rumaal', checked: false, owner: 'Both' },
      { id: 2, text: 'Deposit shoes at Jora Ghar', checked: false, owner: 'Both' },
      { id: 3, text: 'Visit Guru Ka Langar together', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'kashi_vishwanath',
    name: 'Kashi Vishwanath Temple, Varanasi',
    category: 'Temple',
    landmarkName: 'Gate No. 4 (Chhattadwar / Ganga Corridor)',
    lat: 25.3109,
    lng: 83.0107,
    geofenceRadius: 100,
    notes: 'Meet at Corridor Gate 4 on the riverside promenade before entering queue.',
    dressCode: 'Traditional Indian attire for Sparsh Darshan. Lockers available in Corridor.',
    openingHours: '3:00 AM – 11:00 PM (Mangala Aarti at 3:00 AM)',
    checklist: [
      { id: 1, text: 'Locker token for belongings', checked: false, owner: 'Both' },
      { id: 2, text: 'Ganga Jal container for Abhishekam', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'somnath',
    name: 'Somnath Temple, Gujarat',
    category: 'Temple',
    landmarkName: 'Main Sea-Facing Entrance Gate',
    lat: 20.8880,
    lng: 70.4012,
    geofenceRadius: 120,
    notes: 'Meet at the grand entrance arch facing the Arabian Sea.',
    dressCode: 'Modest attire. Electronic items strictly prohibited.',
    openingHours: '6:00 AM – 10:00 PM (Light & Sound Show at 8:00 PM)',
    checklist: [
      { id: 1, text: 'Watch evening Light & Sound show', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'jagannath_puri',
    name: 'Jagannath Temple, Puri, Odisha',
    category: 'Temple',
    landmarkName: 'Singhadwara (Lion Gate)',
    lat: 19.8049,
    lng: 85.8179,
    geofenceRadius: 110,
    notes: 'Meet right in front of the Aruna Stambha (Sun Pillar) outside Lion Gate.',
    dressCode: 'Strict Indian traditional attire. Foreign nationals restricted to library roof.',
    openingHours: '5:30 AM – 10:00 PM',
    checklist: [
      { id: 1, text: 'Mahaprasad (Khaja) tasting at Ananda Bazar', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'mahakaleshwar',
    name: 'Mahakaleshwar Jyotirlinga, Ujjain',
    category: 'Temple',
    landmarkName: 'Mahakal Lok Corridor Entry Gate',
    lat: 23.1827,
    lng: 75.7682,
    geofenceRadius: 120,
    notes: 'Meet in the Mahakal Lok corridor near the large Shiva sculpture fountain.',
    dressCode: 'Dhoti and Solah for men for Bhasma Aarti; Saree for women.',
    openingHours: '4:00 AM – 11:00 PM (Bhasma Aarti at 4:00 AM)',
    checklist: [
      { id: 1, text: 'Bhasma Aarti online booking pass', checked: true, owner: 'Both' }
    ]
  },
  {
    id: 'siddhivinayak',
    name: 'Siddhivinayak Temple, Prabhadevi, Mumbai',
    category: 'Temple',
    landmarkName: 'Main Gate 2 (Near Flower Stalls)',
    lat: 19.0169,
    lng: 72.8304,
    geofenceRadius: 90,
    notes: 'Meet near Gate 2 by the Modak & Marigold garland counter.',
    dressCode: 'Decent casual or Indian attire.',
    openingHours: '5:30 AM – 10:00 PM (Tuesdays special rush)',
    checklist: [
      { id: 1, text: 'Buy Modak prasad box', checked: false, owner: 'Both' }
    ]
  },
  {
    id: 'vaishno_devi',
    name: 'Vaishno Devi Bhawan, Katra, Jammu',
    category: 'Temple',
    landmarkName: 'Bhawan Main Gate (Near Bathing Ghat)',
    lat: 33.0308,
    lng: 74.9490,
    geofenceRadius: 120,
    notes: 'Meet at Bhawan entrance right outside Locker Complex 2.',
    dressCode: 'Comfortable trekking/warm clothes.',
    openingHours: 'Open 24 Hours (Aarti at sunrise & sunset)',
    checklist: [
      { id: 1, text: 'Yatra Parchi / RFID card token', checked: true, owner: 'Both' }
    ]
  },
  {
    id: 'brihadeeswarar',
    name: 'Brihadeeswarar Temple, Thanjavur',
    category: 'Monument & Temple',
    landmarkName: 'Keralantakan Gopuram Gate',
    lat: 10.7828,
    lng: 79.1318,
    geofenceRadius: 110,
    notes: 'Meet in the wide outer courtyard lawn before the inner sanctum tower.',
    dressCode: 'Modest clothing. UNESCO World Heritage Site.',
    openingHours: '6:00 AM – 12:30 PM, 4:00 PM – 8:30 PM',
    checklist: []
  },
  {
    id: 'lotus_temple',
    name: 'Lotus Temple, Delhi',
    category: 'Monument',
    landmarkName: 'Information Center Courtyard',
    lat: 28.5535,
    lng: 77.2588,
    geofenceRadius: 100,
    notes: 'Meet by the entrance reflecting pools near the visitor garden path.',
    dressCode: 'Maintain absolute silence inside. Casual dress permitted.',
    openingHours: '8:30 AM – 5:00 PM (Closed on Mondays)',
    checklist: []
  }
];
// Calculate bearing in degrees from point 1 to point 2
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};
