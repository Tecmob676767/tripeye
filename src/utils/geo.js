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

// Interpolate point along route based on progress 0.0 -> 1.0
export function interpolateRoute(pathPoints, progress) {
  if (!pathPoints || pathPoints.length === 0) return [0, 0];
  if (progress <= 0) return pathPoints[0];
  if (progress >= 1) return pathPoints[pathPoints.length - 1];

  const totalSegments = pathPoints.length - 1;
  const rawIndex = progress * totalSegments;
  const segIndex = Math.min(Math.floor(rawIndex), totalSegments - 1);
  const segFraction = rawIndex - segIndex;

  const p1 = pathPoints[segIndex];
  const p2 = pathPoints[segIndex + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * segFraction;
  const lng = p1[1] + (p2[1] - p1[1]) * segFraction;
  return [lat, lng];
}

export const PRESET_DESTINATIONS = [
  {
    id: 'akshardham',
    name: 'Akshardham Temple, Delhi',
    landmarkName: 'Main North Gate & Shoe Deposit 3',
    lat: 28.6127,
    lng: 77.2773,
    geofenceRadius: 110,
    notes: 'Meet right by the Shoe Stall #3 and Cloakroom entrance before entering security queue.',
    dressCode: 'Cover shoulders and knees. No electronic gadgets allowed inside sanctum.',
    openingHours: '9:30 AM – 8:00 PM (Aarti at 6:30 PM)',
    checklist: [
      { id: 1, text: 'Deposit Mobile Phones at Cloakroom', checked: false, owner: 'Both' },
      { id: 2, text: 'Collect Prasad Box from Counter', checked: false, owner: 'Rahul' },
      { id: 3, text: 'Drop shoes at Stall #3', checked: false, owner: 'Priya' },
      { id: 4, text: 'Carry Original Govt. Photo ID', checked: true, owner: 'Both' }
    ],
    rahulPath: [
      [28.6320, 77.2580],
      [28.6270, 77.2625],
      [28.6210, 77.2670],
      [28.6170, 77.2720],
      [28.6140, 77.2755],
      [28.6127, 77.2773]
    ],
    priyaPath: [
      [28.5980, 77.2940],
      [28.6025, 77.2895],
      [28.6070, 77.2850],
      [28.6105, 77.2810],
      [28.6120, 77.2785],
      [28.6127, 77.2773]
    ]
  },
  {
    id: 'meenakshi',
    name: 'Meenakshi Amman Temple, Madurai',
    landmarkName: 'East Gopuram (Tower) Gate',
    lat: 9.9195,
    lng: 78.1193,
    geofenceRadius: 100,
    notes: 'Meet near East Chitra Street entrance beside the Jasmine Flower Mandi.',
    dressCode: 'Traditional Indian attire mandatory (Dhoti/Kurta for men, Sarees/Salwar for women).',
    openingHours: '5:00 AM – 12:30 PM, 4:00 PM – 10:00 PM',
    checklist: [
      { id: 1, text: 'Buy Madurai Malli Jasmine Garlands', checked: false, owner: 'Priya' },
      { id: 2, text: 'Ghee deepams for inner sanctum', checked: false, owner: 'Rahul' },
      { id: 3, text: 'Special Darshan queue tokens', checked: true, owner: 'Rahul' }
    ],
    rahulPath: [
      [9.9320, 78.1090],
      [9.9270, 78.1130],
      [9.9230, 78.1165],
      [9.9210, 78.1180],
      [9.9195, 78.1193]
    ],
    priyaPath: [
      [9.9090, 78.1290],
      [9.9130, 78.1250],
      [9.9160, 78.1225],
      [9.9180, 78.1205],
      [9.9195, 78.1193]
    ]
  }
];