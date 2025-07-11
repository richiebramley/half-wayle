import countries from '../data/countries.json';
import countryToISO from './flags';
import { Feature, FeatureCollection, Polygon, MultiPolygon, Geometry } from 'geojson';

export type Country = {
  name: string;
  lat: number;
  lng: number;
};

// Calculate the midpoint between two coordinates
export function getMidpoint(lat1: number, lng1: number, lat2: number, lng2: number) {
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2,
  };
}

// Calculate distance between two coordinates (Haversine formula)
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find the country closest to the midpoint
export function findClosestCountry(country1: Country, country2: Country): Country {
  const midpoint = getMidpoint(country1.lat, country1.lng, country2.lat, country2.lng);
  let minDist = Infinity;
  let closest: Country = countries[0];
  for (const country of countries) {
    // Skip the two original countries
    if (country.name === country1.name || country.name === country2.name) continue;
    const dist = haversine(midpoint.lat, midpoint.lng, country.lat, country.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = country;
    }
  }
  return closest;
}

// Only include countries that are in the ISO country list (sovereign states)
const sovereignCountries = countries.filter(c => countryToISO[c.name]);

// Helper: Point-in-Polygon using ray-casting algorithm
function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  // Only checks the first ring (outer boundary)
  const [lng, lat] = point;
  let inside = false;
  for (const ring of polygon) {
    let j = ring.length - 1;
    for (let i = 0; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi);
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

// Accept geojson as a parameter
export function isPointOnLand(lat: number, lng: number, geojson: FeatureCollection<Geometry>): boolean {
  const point: [number, number] = [lng, lat];
  for (const feature of geojson.features) {
    if (feature.geometry.type === 'Polygon') {
      if (pointInPolygon(point, feature.geometry.coordinates as number[][][])) return true;
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const poly of feature.geometry.coordinates as number[][][][]) {
        if (pointInPolygon(point, poly as number[][][])) return true;
      }
    }
  }
  return false;
}

export function pathCrossesWater(c1: Country, c2: Country, geojson: FeatureCollection<Geometry>, samples = 20): boolean {
  for (let i = 0; i <= samples; i++) {
    const lat = c1.lat + (c2.lat - c1.lat) * (i / samples);
    const lng = c1.lng + (c2.lng - c1.lng) * (i / samples);
    if (!isPointOnLand(lat, lng, geojson)) return true; // crosses water
  }
  return false; // all points on land
}

export default sovereignCountries; 