import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { motion } from 'framer-motion';
import { useGeolocation } from '../../hooks/useGeolocation';
import { socketService } from '../../services/socketService';
import { postmanService } from '../../services/postmanService';
import { deliveryService } from '../../services/deliveryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const postmanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function RoutingMachine({ from, to }) {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;
    if (routingRef.current) { map.removeControl(routingRef.current); }

    routingRef.current = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      routeWhileDragging: false,
      addWaypoints: false,
      show: true,
      fitSelectedRoutes: true,
      lineOptions: { styles: [{ color: '#0ea5e9', weight: 4, opacity: 0.8 }] },
      createMarker: () => null,
    }).addTo(map);

    return () => {
      if (routingRef.current) { map.removeControl(routingRef.current); }
    };
  }, [from, to, map]);

  return null;
}

// Haversine distance calculation
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function DeliveryNavigation() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const { position, fetchLocation, watchPosition } = useGeolocation();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [myPos, setMyPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadDelivery();
    fetchLocation();
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [deliveryId]);

  useEffect(() => {
    if (position) setMyPos([position.latitude, position.longitude]);
  }, [position]);

  // Update distance/ETA when position changes
  useEffect(() => {
    if (myPos && delivery) {
      const dist = calcDistance(myPos[0], myPos[1], delivery.latitude, delivery.longitude);
      setDistance(dist);
      // Assume average speed 25 km/h for delivery
      const etaMinutes = Math.round((dist / 25) * 60);
      setEta(etaMinutes);
    }
  }, [myPos, delivery]);

  const loadDelivery = async () => {
    try {
      const { data } = await deliveryService.getStatus(deliveryId);
      setDelivery(data.delivery);
    } catch (err) {
      try {
        const { data } = await postmanService.getAssigned();
        const found = data.deliveries.find(d => d.id === deliveryId);
        if (found) setDelivery(found);
      } catch { /* ignore */ }
    } finally { setLoading(false); }
  };

  const startTracking = () => {
    setTracking(true);
    socketService.joinDelivery(deliveryId);
    watchIdRef.current = watchPosition();

    intervalRef.current = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMyPos([lat, lng]);
          socketService.emitLocation({ deliveryId, latitude: lat, longitude: lng });
          postmanService.updateLocation({ deliveryId, latitude: lat, longitude: lng }).catch(() => {});
        });
      }
    }, 5000);
  };

  const stopTracking = () => {
    setTracking(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    socketService.leaveDelivery(deliveryId);
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" text="Loading route..." /></div>;
  if (!delivery) return <div className="glass-card text-center py-8"><p className="text-slate-500">Delivery not found</p></div>;

  const destPos = [delivery.latitude, delivery.longitude];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/postman')} className="text-sm text-slate-500 hover:text-gold-500">← Back</button>
        <h2 className="text-lg font-bold text-slate-200">🗺️ Delivery Navigation</h2>
        <div />
      </div>

      {/* Info Bar */}
      <div className="glass-card p-4">
        <p className="text-sm text-slate-300 truncate">📍 {delivery.address}</p>
        <p className="text-xs text-gold-500 mt-1">Coordinates: {delivery.latitude?.toFixed(4)}, {delivery.longitude?.toFixed(4)}</p>
      </div>

      {/* Distance & ETA */}
      {distance !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-500">Distance</p>
            <p className="text-lg font-bold text-sky-400">
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-500">ETA</p>
            <p className="text-lg font-bold text-gold-500">
              {eta < 1 ? '<1 min' : eta < 60 ? `${eta} min` : `${Math.floor(eta/60)}h ${eta%60}m`}
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-navy-600/50" style={{ height: '450px' }}>
        <MapContainer center={destPos} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {myPos && <Marker position={myPos} icon={postmanIcon}><Popup>📮 Your Location</Popup></Marker>}
          <Marker position={destPos} icon={destIcon}><Popup>📍 Destination</Popup></Marker>
          {myPos && <RoutingMachine from={myPos} to={destPos} />}
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!tracking ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startTracking}
            className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-400 transition-all"
          >
            🚀 START DELIVERY
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={stopTracking}
            className="flex-1 py-3 bg-crimson-500 text-white rounded-lg font-bold hover:bg-crimson-400 transition-all"
          >
            ⏹ STOP TRACKING
          </motion.button>
        )}
      </div>

      {tracking && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-emerald-400 animate-pulse">📡 Live tracking active — location updates being sent</p>
        </motion.div>
      )}
    </div>
  );
}
