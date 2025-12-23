const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    addressdetails: '1',
    limit: '1'
  });

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CarPool-App (contact: example@example.com)'
    }
  });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data || data.length === 0) throw new Error('Location not found');
  const first = data[0];
  return {
    place: first.display_name,
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon)
  };
}

export async function getRoute(from, to) {
  const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CarPool-App (contact: example@example.com)'
    }
  });
  if (!res.ok) throw new Error('Routing failed');
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No route found');
  const route = data.routes[0];
  const coords = route.geometry.coordinates; // [lng, lat]

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: coords.map(([lng, lat]) => ({ lat, lng }))
  };
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} hr ${m} min`;
}
