'use client';

import { useState } from 'react';
import { KebabShop } from '@/lib/kebabalogue';
import { Coordinates } from '@/lib/location';

interface KebabFinderProps {
  shops: KebabShop[];
}

export default function KebabFinder({ shops }: KebabFinderProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [sortedShops, setSortedShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(userCoords);
        findNearestShops(userCoords, shops);
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Unable to retrieve your location';
        // Use numeric codes for safety as constants might not be on the instance
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please enable location services for this site.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'The request to get user location timed out.';
            break;
          default:
            errorMessage = `An unknown error occurred: ${err.message}`;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const findNearestShops = (userCoords: Coordinates, shops: KebabShop[]) => {
    // Since we don't have coordinates in the CSV, we can't sort by distance.
    // We will just display the shops as they are, but we could potentially filter by suburb if we had user's suburb.
    // For now, we'll just pass them through but mark distance as unknown.
    
    const shopsWithDistance = shops.map(shop => {
      return { ...shop, distance: Infinity };
    });

    // Just show the first 20 or so, or maybe random ones? 
    // Or keep original order (Rank).
    setSortedShops(shopsWithDistance);
  };

  const getDirectionsUrl = (shop: any) => {
    const name = shop['Shop Name'] || '';
    const suburb = shop['Suburb'] || '';
    const postcode = shop['Postcode'] || '';
    const fullAddress = `${name}, ${suburb} ${postcode}, Australia`;
    
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="mb-8 text-center">
        <button
          onClick={handleGetLocation}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Locating...' : 'Find Nearest Kebab'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {userLocation && sortedShops.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Top Kebab Shops</h2>
          <p className="text-sm text-gray-500 mb-4">
            Note: Distance calculation is not available for this dataset. 
            Shops are listed by their Kebabalogue rank.
            Click "Get Directions" to see the route from your location.
          </p>
          {sortedShops.slice(0, 20).map((shop, index) => (
            <div key={index} className="border p-4 rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{shop['Shop Name']}</h3>
                  <p className="text-gray-600">
                    {shop['Suburb']}, {shop['Postcode']}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Rank: {shop['RANK']} | Rating: {shop['Ox Rating']}
                  </p>
                </div>
                <a
                  href={getDirectionsUrl(shop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold"
                >
                  Get Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
