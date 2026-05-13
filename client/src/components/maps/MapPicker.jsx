import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useGeolocation } from '../../hooks/useGeolocation';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onPositionChange([latlng.lat, latlng.lng]);
      }
    },
  };

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={eventHandlers}
      icon={goldIcon}
    />
  );
}

function MapClickHandler({ onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function MapPicker({ onLocationSelect }) {
  const { position: gpsPosition, error: gpsError, loading: gpsLoading, fetchLocation } = useGeolocation();
  const [markerPos, setMarkerPos] = useState([20.5937, 78.9629]); // Default India center
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Handle GPS location fetch
  useEffect(() => {
    if (gpsPosition) {
      const newPos = [gpsPosition.latitude, gpsPosition.longitude];
      setMarkerPos(newPos);
      reverseGeocode(newPos[0], newPos[1]);
    }
  }, [gpsPosition]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(addr);
      onLocationSelect?.({ latitude: lat, longitude: lng, address: addr });
    } catch {
      const addr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(addr);
      onLocationSelect?.({ latitude: lat, longitude: lng, address: addr });
    }
  };

  const handleMarkerMove = useCallback((newPos) => {
    setMarkerPos(newPos);
    reverseGeocode(newPos[0], newPos[1]);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setMarkerPos(newPos);
        setAddress(display_name);
        onLocationSelect?.({ latitude: parseFloat(lat), longitude: parseFloat(lon), address: display_name });
      }
    } catch {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & GPS Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="flex-1 px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-gold-500 transition-colors placeholder-slate-600"
          />
          <motion.button
            type="submit"
            disabled={searching}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-navy-700 text-gold-500 rounded-lg text-sm font-medium hover:bg-navy-600 transition-colors disabled:opacity-50"
          >
            {searching ? '...' : '🔍'}
          </motion.button>
        </form>

        <motion.button
          onClick={fetchLocation}
          disabled={gpsLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {gpsLoading ? '📡 Fetching...' : '📍 Live Location'}
        </motion.button>
      </div>

      {gpsError && (
        <p className="text-xs text-crimson-400">GPS Error: {gpsError}. Please search manually.</p>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-navy-600/50" style={{ height: '350px' }}>
        <MapContainer
          center={markerPos}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={markerPos} onPositionChange={handleMarkerMove} />
          <MapClickHandler onPositionChange={handleMarkerMove} />
          <FlyToPosition position={markerPos} />
        </MapContainer>
      </div>

      {/* Selected Address */}
      {address && (
        <div className="p-3 bg-navy-800/50 rounded-lg border border-navy-600/30">
          <p className="text-xs text-slate-500 mb-1">Selected Location:</p>
          <p className="text-sm text-slate-300">{address}</p>
          <p className="text-xs text-gold-500/70 mt-1">
            {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}
