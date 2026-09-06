// Distance calculation using Haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

export function formatDistance(km: number | undefined): string {
  if (km === undefined || isNaN(km)) return 'Nearby';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export const GEOAPIFY_API_KEY = 'b1e175e661b54a51a09abe6eee26ab23';

export interface GeoapifyLocationResult {
  lat: number;
  lng: number;
  areaName: string;
  city: string;
  district: string;
  pincode: string;
  formatted: string;
}

// Reverse geocoding via Geoapify API
export async function reverseGeocodeWithGeoapify(
  lat: number,
  lng: number
): Promise<GeoapifyLocationResult | null> {
  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data.features?.[0];
    if (!feat?.properties) return null;
    const p = feat.properties;

    const village = p.village || p.suburb || p.neighbourhood || '';
    const city = p.city || p.town || village || '';
    const district = p.state_district || p.county || '';
    const pincode = p.postcode || '';

    let areaName = '';
    if (village && district && village.toLowerCase() !== district.toLowerCase()) {
      areaName = `${village}, ${district}`;
    } else if (village || city) {
      areaName = village || city;
      if (district && !areaName.toLowerCase().includes(district.toLowerCase())) {
        areaName = `${areaName}, ${district}`;
      }
    } else if (p.formatted) {
      areaName = p.formatted.split(',').slice(0, 2).join(',').trim();
    }

    return {
      lat: p.lat ?? lat,
      lng: p.lon ?? lng,
      areaName: areaName || district || city || 'My Location',
      city: district || city || 'Live Location',
      district,
      pincode,
      formatted: p.formatted || '',
    };
  } catch (err) {
    console.warn('Geoapify reverse geocoding error:', err);
    return null;
  }
}

// Search geocoding via Geoapify API
export async function searchLocationWithGeoapify(
  query: string
): Promise<GeoapifyLocationResult[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();

  // Smart local index for user's primary operating region
  const regionalMatches: GeoapifyLocationResult[] = [];
  if (q.includes('kalli') || q.includes('mandha') || q.includes('mandaya') || q.includes('624616')) {
    regionalMatches.push({
      lat: 10.5838,
      lng: 77.6908,
      areaName: 'Kallimandhayam, Dindigul',
      city: 'Dindigul',
      district: 'Dindigul',
      pincode: '624616',
      formatted: 'Kallimandhayam, Dindigul District - 624616, Tamil Nadu',
    });
  }
  if (q.includes('mkce') || q.includes('thalava') || q.includes('kumarasamy') || q.includes('639113')) {
    regionalMatches.push({
      lat: 10.9892,
      lng: 78.0287,
      areaName: 'MKCE Thalavapalayam',
      city: 'Karur',
      district: 'Karur',
      pincode: '639113',
      formatted: 'M. Kumarasamy College of Engineering, Thalavapalayam, Karur - 639113',
    });
  }

  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query.trim())}&apiKey=${GEOAPIFY_API_KEY}`
    );
    if (!res.ok) return regionalMatches;
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return regionalMatches;

    const apiResults: GeoapifyLocationResult[] = data.features.map((feat: any) => {
      const p = feat.properties;
      const village = p.village || p.suburb || p.neighbourhood || '';
      const city = p.city || p.town || village || '';
      const district = p.state_district || p.county || '';
      const pincode = p.postcode || '';

      let areaName = '';
      if (village && district && village.toLowerCase() !== district.toLowerCase()) {
        areaName = `${village}, ${district}`;
      } else if (p.address_line1) {
        areaName = p.address_line1;
      } else {
        areaName = village || city || district || 'Location';
      }

      return {
        lat: p.lat ?? feat.geometry?.coordinates?.[1] ?? 0,
        lng: p.lon ?? feat.geometry?.coordinates?.[0] ?? 0,
        areaName,
        city: district || city || '',
        district,
        pincode,
        formatted: p.formatted || `${areaName}, ${p.state || ''}`,
      };
    });

    return [...regionalMatches, ...apiResults];
  } catch (err) {
    console.warn('Geoapify search geocoding error:', err);
    return regionalMatches;
  }
}

// Default customer coordinates (Defaults to user's home region in Kallimandhayam, Dindigul)
export const DEFAULT_CUSTOMER_LOCATION = {
  lat: 10.5838,
  lng: 77.6908,
  areaName: 'Kallimandhayam, Dindigul',
  city: 'Dindigul',
  pincode: '624616',
  isSet: true,
};

