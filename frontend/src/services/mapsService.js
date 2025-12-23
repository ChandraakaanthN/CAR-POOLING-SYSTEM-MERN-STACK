// Google Maps service for geocoding and directions
class MapsService {
  constructor() {
    this.geocoder = null;
    this.directionsService = null;
    this.directionsRenderer = null;
    this.map = null;
  }

  async initialize(apiKey) {
    if (window.google && window.google.maps) {
      this.geocoder = new window.google.maps.Geocoder();
      this.directionsService = new window.google.maps.DirectionsService();
      this.directionsRenderer = new window.google.maps.DirectionsRenderer();
      return true;
    }
    return false;
  }

  // Geocode a place name to coordinates
  async geocodeAddress(address) {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  // Get route between two points
  async getRoute(origin, destination) {
    return new Promise((resolve, reject) => {
      if (!this.directionsService) {
        reject(new Error('Directions service not initialized'));
        return;
      }

      const request = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      this.directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          const route = result.routes[0];
          const path = route.overview_path;
          
          // Convert path to coordinates array
          const coordinates = path.map(point => ({
            lat: point.lat(),
            lng: point.lng()
          }));

          resolve({
            coordinates,
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            polyline: route.overview_polyline
          });
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      });
    });
  }

  // Sample route points for storage (reduce complexity)
  sampleRoutePoints(coordinates, maxPoints = 50) {
    if (coordinates.length <= maxPoints) {
      return coordinates;
    }

    const step = Math.floor(coordinates.length / maxPoints);
    const sampled = [];
    
    for (let i = 0; i < coordinates.length; i += step) {
      sampled.push(coordinates[i]);
      if (sampled.length >= maxPoints) break;
    }

    // Always include start and end points
    if (sampled[0] !== coordinates[0]) {
      sampled.unshift(coordinates[0]);
    }
    if (sampled[sampled.length - 1] !== coordinates[coordinates.length - 1]) {
      sampled.push(coordinates[coordinates.length - 1]);
    }

    return sampled;
  }

  // Calculate distance between two points in meters
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const mapsService = new MapsService(); 