import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component that captures the map instance and exposes it via ref
function MapInstanceCapture({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export default function LiveMap({ center, zoom = 14, children }) {
  const mapRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const myMarkerRef = useRef(null);
  const myCircleRef = useRef(null);

  const handleLocateMe = useCallback(() => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = [position.coords.latitude, position.coords.longitude];
        map.flyTo(pos, 16, { duration: 1.2 });

        // Remove old markers
        if (myMarkerRef.current) map.removeLayer(myMarkerRef.current);
        if (myCircleRef.current) map.removeLayer(myCircleRef.current);

        // Blue dot
        myMarkerRef.current = L.circleMarker(pos, {
          radius: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          color: '#fff',
          weight: 3,
        }).addTo(map).bindPopup('You are here');

        // Accuracy ring
        myCircleRef.current = L.circle(pos, {
          radius: position.coords.accuracy,
          fillColor: '#4285F4',
          fillOpacity: 0.08,
          color: '#4285F4',
          weight: 1,
          opacity: 0.3,
        }).addTo(map);

        setLocating(false);
      },
      (err) => {
        console.error('Locate me failed:', err.message);
        toast.error(`Could not locate you: ${err.message}. Make sure location permissions are enabled.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%', background: '#242f3e' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapInstanceCapture mapRef={mapRef} />
        {children}
      </MapContainer>

      {/* Locate Me button — outside MapContainer to avoid context consumer errors */}
      <button
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute bottom-6 left-4 z-[1000] w-10 h-10 bg-gray-900/90 backdrop-blur-sm border border-gray-600 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 group cursor-pointer"
        title="Go to my location"
        id="locate-me-btn"
      >
        {locating ? (
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-400 group-hover:text-blue-300">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
          </svg>
        )}
      </button>
    </div>
  );
}
