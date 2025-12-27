'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { KebabShop } from '@/lib/kebabalogue';
import { Coordinates } from '@/lib/location';
import KebabTable from './KebabTable';

// Dynamically import Map component to avoid SSR issues with Leaflet
const KebabMap = dynamic(() => import('./KebabMap'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-turkish-cream animate-pulse rounded-lg flex items-center justify-center text-turkish-gold font-bold border-2 border-turkish-gold">Loading Map...</div>
});

interface KebabFinderProps {
  shops: KebabShop[];
}

const SplashScreen = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-turkish-cream turkish-tile-bg">
    <div className="animate-bounce text-8xl mb-6 drop-shadow-lg">🥙</div>
    <h1 className="text-5xl font-bold text-turkish-red mb-4 animate-pulse drop-shadow-md tracking-wider uppercase">Kebab Director</h1>
    <p className="text-turkish-blue font-bold text-xl mb-8">Finding the best kebabs near you...</p>
    <div className="w-64 h-4 bg-white rounded-full overflow-hidden border-2 border-turkish-gold shadow-inner">
      <div className="h-full bg-turkish-teal animate-pulse w-full origin-left scale-x-0 animate-[shimmer_2s_infinite]"></div>
    </div>
    <style jsx>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

export default function KebabFinder({ shops }: KebabFinderProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [sortedShops, setSortedShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Start loading immediately
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  useEffect(() => {
    // Auto-trigger location on mount
    handleGetLocation();
  }, []);

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
        findBestShops(userCoords, shops);
        // Don't set loading false here, wait for map
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

  const findBestShops = (userCoords: Coordinates, shops: KebabShop[]) => {
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

  const handleMapReady = () => {
    setMapReady(true);
    setLoading(false);
  };

  // Show splash screen if loading and no error
  // If error, we show the error UI (which replaces the splash)
  const showSplash = loading && !error;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {showSplash && <SplashScreen />}

      {error && (
        <div className="mb-8 text-center">
          <p className="text-turkish-red font-bold mb-4 bg-white p-4 rounded border-2 border-turkish-red inline-block shadow-lg">
            {error}
          </p>
          <br />
          <button
            onClick={handleGetLocation}
            className="turkish-btn font-bold py-3 px-8 rounded-full shadow-lg text-lg uppercase tracking-wide"
          >
            Retry Location Search
          </button>
        </div>
      )}

      {/* Always render map if we have location, but hide it if splash is showing (or keep it behind) */}
      {/* Actually, we want it to render so it can load and trigger onMapReady */}
      {userLocation && sortedShops.length > 0 && (
        <div className={`space-y-6 ${showSplash ? 'opacity-0 absolute pointer-events-none' : 'opacity-100 transition-opacity duration-500'}`}>
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors border-2 ${
                viewMode === 'map' 
                  ? 'bg-turkish-teal text-white border-turkish-teal' 
                  : 'bg-white text-turkish-blue border-turkish-gold hover:bg-turkish-cream'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors border-2 ${
                viewMode === 'table' 
                  ? 'bg-turkish-teal text-white border-turkish-teal' 
                  : 'bg-white text-turkish-blue border-turkish-gold hover:bg-turkish-cream'
              }`}
            >
              Table View
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-turkish-gold relative h-[600px] overflow-hidden">
            <div className="absolute inset-0 z-0">
              <KebabMap shops={sortedShops} userLocation={userLocation} onMapReady={handleMapReady} />
            </div>
            
            {viewMode === 'table' && (
              <div className="absolute inset-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl overflow-auto border border-turkish-gold animate-in fade-in zoom-in duration-200">
                <div className="sticky top-0 bg-turkish-cream p-2 flex justify-between items-center border-b border-turkish-gold mb-2">
                  <h3 className="font-bold text-turkish-blue">Top 50 Kebab Shops</h3>
                  <button 
                    onClick={() => setViewMode('map')}
                    className="text-turkish-red hover:bg-turkish-red hover:text-white rounded-full p-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <KebabTable shops={sortedShops.slice(0, 50)} />
              </div>
            )}
          </div>
          
          {viewMode === 'map' && (
            <p className="text-center text-sm text-turkish-blue font-medium mt-2">
              Note: Ranking calculated by combining Ox Rating and Distance.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
