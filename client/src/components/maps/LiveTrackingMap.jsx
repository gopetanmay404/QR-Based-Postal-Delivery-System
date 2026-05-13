import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const postmanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ postmanPos, destPos }) {
  const map = useMap();
  useEffect(() => {
    if (postmanPos && destPos) {
      const bounds = L.latLngBounds([postmanPos, destPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [postmanPos, destPos, map]);
  return null;
}

export default function LiveTrackingMap({ postmanPosition, destinationPosition, destinationAddress }) {
  if (!destinationPosition) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-navy-600/50" style={{ height: '300px' }}>
      <MapContainer
        center={destinationPosition}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {postmanPosition && (
          <Marker position={postmanPosition} icon={postmanIcon}>
            <Popup>📮 Postman Location</Popup>
          </Marker>
        )}

        <Marker position={destinationPosition} icon={destIcon}>
          <Popup>📍 {destinationAddress || 'Delivery Destination'}</Popup>
        </Marker>

        {postmanPosition && (
          <FitBounds postmanPos={postmanPosition} destPos={destinationPosition} />
        )}
      </MapContainer>
    </div>
  );
}
