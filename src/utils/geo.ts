import countries from '../data/countries.json';
import countryToISO from './flags';

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

export default sovereignCountries; 