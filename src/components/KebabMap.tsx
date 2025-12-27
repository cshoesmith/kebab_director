'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { KebabShop } from '@/lib/kebabalogue';
import { geocodeAddress } from '@/lib/geocoding';
import { Coordinates, calculateDistance } from '@/lib/location';

interface KebabMapProps {
  shops: KebabShop[];
  userLocation: Coordinates | null;
  onMapReady?: () => void;
}

// Custom icons for top 10
const createRankIcon = (rank: number) => {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
  const bgColor = rank <= 3 ? colors[rank-1] : '#00798C'; // Turkish Teal for others
  const textColor = rank <= 3 ? 'black' : 'white';
  
  return L.divIcon({
    className: 'custom-rank-icon',
    html: `<div style="background-color: ${bgColor}; color: ${textColor}; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${rank}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Custom icon for other shops
const kebabIcon = L.icon({
  iconUrl: '/kebab-marker.svg',
  iconSize: [50, 50],
  iconAnchor: [25, 48],
  popupAnchor: [0, -50],
  className: 'drop-shadow-md'
});

function TopListControl({ shops }: { shops: (KebabShop & { lat: number; lon: number; rankDistance?: number })[] }) {
  const map = useMap();
  
  const topShops = useMemo(() => {
    return shops
      .filter(s => s.rankDistance !== undefined)
      .sort((a, b) => (a.rankDistance || 0) - (b.rankDistance || 0));
  }, [shops]);

  if (topShops.length === 0) return null;

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 650 }}>
      <div className="leaflet-control m-4 bg-white border-2 border-turkish-gold rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto w-64">
        <div className="bg-turkish-teal text-white p-2 font-bold text-center border-b border-turkish-gold sticky top-0">
          Top 10 Best
        </div>
        <div className="divide-y divide-turkish-cream bg-white">
          {topShops.map(shop => (
            <div 
              key={shop['Shop Name']}
              className="p-2 hover:bg-turkish-cream cursor-pointer transition-colors flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                map.flyTo([shop.lat, shop.lon], 16);
              }}
            >
              <span className={`
                w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold border border-gray-200
                ${shop.rankDistance! <= 3 ? 'text-black' : 'bg-turkish-teal text-white'}
              `} style={{ 
                backgroundColor: shop.rankDistance === 1 ? '#FFD700' : 
                               shop.rankDistance === 2 ? '#C0C0C0' : 
                               shop.rankDistance === 3 ? '#CD7F32' : undefined 
              }}>
                {shop.rankDistance}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-turkish-blue truncate">{shop['Shop Name']}</p>
                <p className="text-xs text-gray-500 truncate">{shop['Suburb']}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component to handle map resizing
function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    // Invalidate immediately
    map.invalidateSize();

    // Invalidate on resize
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    
    // Invalidate after transition (KebabFinder has 500ms transition)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [map]);
  return null;
}

// Component to update map center and bounds when user location changes
function MapUpdater({ center, markers }: { center: [number, number], markers: { lat: number, lon: number }[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]));
      // Include user location in bounds if available
      bounds.extend(center);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, map, markers]);
  
  return null;
}

export default function KebabMap({ shops, userLocation, onMapReady }: KebabMapProps) {
  const [geocodedShops, setGeocodedShops] = useState<(KebabShop & { lat: number; lon: number; distance?: number; rankDistance?: number })[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    const loadCoordinates = async () => {
      setLoadingGeo(true);
      const results: (KebabShop & { lat: number; lon: number; distance?: number })[] = [];
      
      // 1. Use pre-geocoded data if available (passed in shops)
      const preGeocoded = shops.filter(s => s.lat && s.lon) as (KebabShop & { lat: number; lon: number })[];
      results.push(...preGeocoded);

      // 2. Calculate distances and filter
      let processedShops = results.map(shop => {
        if (userLocation) {
          const dist = calculateDistance(userLocation, { latitude: shop.lat, longitude: shop.lon });
          return { ...shop, distance: dist };
        }
        return shop;
      });

      if (userLocation) {
        // Filter to 100km
        processedShops = processedShops.filter(s => (s.distance || 0) <= 100);
        
        // Sort by "Kebab Director Score"
        // Formula: Score = (Rating * 10) - (Distance * 2)
        // This implies 1 rating point (out of 10) is worth 5km of travel
        processedShops.sort((a, b) => {
          const ratingA = parseFloat(String(a['Ox Rating'])) || 0;
          const ratingB = parseFloat(String(b['Ox Rating'])) || 0;
          const distA = a.distance || 0;
          const distB = b.distance || 0;
          
          const scoreA = (ratingA * 10) - (distA * 2);
          const scoreB = (ratingB * 10) - (distB * 2);
          
          return scoreB - scoreA; // Descending score
        });

        // Assign ranks to top 10
        processedShops = processedShops.map((shop, index) => ({
          ...shop,
          rankDistance: index < 10 ? index + 1 : undefined
        }));
      }

      // 3. If we have very few results, try to geocode some more top shops on the fly
      // (Only if they weren't already pre-geocoded)
      if (processedShops.length < 5) {
         const shopsToGeocode = shops
            .filter(s => !s.lat && !s.lon) // Not yet geocoded
            .sort((a, b) => (parseFloat(String(b['Ox Rating'])) || 0) - (parseFloat(String(a['Ox Rating'])) || 0)) // Prioritize high rated shops
            .slice(0, 5); // Limit to 5 to be fast

         for (const shop of shopsToGeocode) {
            const address = `${shop['Shop Name']}, ${shop['Suburb']} ${shop['Postcode']}, Australia`;
            const coords = await geocodeAddress(address);
            if (coords) {
              const newShop: KebabShop & { lat: number; lon: number; distance?: number } = { ...shop, ...coords };
              // Check distance
              if (userLocation) {
                 const dist = calculateDistance(userLocation, { latitude: coords.lat, longitude: coords.lon });
                 if (dist <= 100) {
                    newShop.distance = dist;
                    processedShops.push(newShop);
                 }
              } else {
                 processedShops.push(newShop);
              }
            }
         }
         // Re-sort and re-rank if we added new ones
         if (userLocation) {
            processedShops.sort((a, b) => {
              const ratingA = parseFloat(String(a['Ox Rating'])) || 0;
              const ratingB = parseFloat(String(b['Ox Rating'])) || 0;
              const distA = a.distance || 0;
              const distB = b.distance || 0;
              
              const scoreA = (ratingA * 10) - (distA * 2);
              const scoreB = (ratingB * 10) - (distB * 2);
              
              return scoreB - scoreA;
            });
            processedShops = processedShops.map((shop, index) => ({
              ...shop,
              rankDistance: index < 10 ? index + 1 : undefined
            }));
         }
      }

      setGeocodedShops(processedShops);
      setLoadingGeo(false);
      if (onMapReady) onMapReady();
    };

    loadCoordinates();
  }, [shops, userLocation, onMapReady]);

  const defaultCenter: [number, number] = [-33.8688, 151.2093]; // Sydney
  const center = userLocation ? [userLocation.latitude, userLocation.longitude] as [number, number] : defaultCenter;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg relative">
      {loadingGeo && (
        <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded shadow text-xs">
          Loading map points...
        </div>
      )}
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapInvalidator />
        <MapUpdater center={center} markers={geocodedShops.slice(0, 10)} />
        <TopListControl shops={geocodedShops} />

        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>
              You are here
            </Popup>
          </Marker>
        )}

        {geocodedShops.map((shop, index) => {
          const isRanked = shop.rankDistance !== undefined;
          const position: [number, number] = [shop.lat, shop.lon];
          const destination = encodeURIComponent(`${shop['Shop Name']}, ${shop['Suburb']} ${shop['Postcode']}, Australia`);
          
          const PopupContent = () => (
            <div className="font-sans min-w-[200px] bg-turkish-cream">
              <h3 className="font-bold text-base text-turkish-blue border-b border-turkish-gold pb-1 mb-1">{shop['Shop Name']}</h3>
              <p className="text-sm text-gray-700">{shop['Suburb']}</p>
              <div className="flex items-center gap-2 mt-1 mb-2">
                <span className="text-xs bg-turkish-red text-white px-1.5 py-0.5 rounded">Rank #{shop['RANK']}</span>
                <span className="text-xs bg-turkish-teal text-white px-1.5 py-0.5 rounded">Rating: {shop['Ox Rating']}</span>
                {shop.distance && <span className="text-xs text-turkish-blue font-semibold">{(shop.distance).toFixed(1)}km away</span>}
              </div>
              
              <div className="border-t border-turkish-gold pt-2 mt-2">
                <p className="text-xs font-semibold mb-1 text-turkish-blue">Leave now:</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-1 hover:bg-white rounded transition-colors border border-transparent hover:border-turkish-gold"
                  >
                    <span className="text-lg">🚶</span>
                    <span className="text-[10px] text-turkish-teal font-bold">Walk</span>
                  </a>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-1 hover:bg-white rounded transition-colors border border-transparent hover:border-turkish-gold"
                  >
                    <span className="text-lg">🚗</span>
                    <span className="text-[10px] text-turkish-teal font-bold">Car</span>
                  </a>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-1 hover:bg-white rounded transition-colors border border-transparent hover:border-turkish-gold"
                  >
                    <span className="text-lg">🚌</span>
                    <span className="text-[10px] text-turkish-teal font-bold">Transit</span>
                  </a>
                </div>
              </div>
            </div>
          );

          if (isRanked) {
            return (
              <Marker 
                key={`top-${index}`} 
                position={position} 
                icon={createRankIcon(shop.rankDistance!)}
                zIndexOffset={1000 - shop.rankDistance!} // Ensure 1 is on top of 2, etc.
              >
                <Popup>
                  <PopupContent />
                </Popup>
              </Marker>
            );
          } else {
            return (
              <Marker 
                key={`dot-${index}`} 
                position={position}
                icon={kebabIcon}
              >
                <Popup>
                  <PopupContent />
                </Popup>
              </Marker>
            );
          }
        })}
      </MapContainer>
    </div>
  );
}
