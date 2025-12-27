// Rate limited geocoding using Nominatim (OpenStreetMap)
// Respect their usage policy: max 1 request per second, include User-Agent.

const CACHE_KEY = 'kebab_geo_cache';

interface GeoCache {
  [address: string]: { lat: number; lon: number };
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  // Check local storage cache first (client-side only)
  if (typeof window !== 'undefined') {
    const cache: GeoCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cache[address]) {
      return cache[address];
    }
  }

  try {
    // Add a small delay to respect rate limits if calling in a loop
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'KebabDirector/1.0'
        }
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };

      // Update cache
      if (typeof window !== 'undefined') {
        const cache: GeoCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        cache[address] = coords;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }

      return coords;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}
