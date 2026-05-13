import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { deliveryService } from '../../services/deliveryService';
import QRGenerator from '../../components/qr/QRGenerator';
import QRScanner from '../../components/qr/QRScanner';
import DeliveryCard from '../../components/delivery/DeliveryCard';
import LiveTrackingMap from '../../components/maps/LiveTrackingMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function UserDashboard() {
  const { user } = useAuth();
  const { socket, joinDelivery } = useSocket();
  const { notifications, unreadCount, markAsRead, markAllAsRead, addToast } = useNotifications();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [trackingDelivery, setTrackingDelivery] = useState(null);
  const [postmanLocation, setPostmanLocation] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Fetch deliveries
  useEffect(() => {
    fetchDeliveries();
  }, [pagination.page]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('delivery:statusUpdate', (data) => {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === data.deliveryId ? { ...d, status: data.status } : d))
        );
      });

      socket.on('postman:location', (data) => {
        if (trackingDelivery && data.deliveryId === trackingDelivery.id) {
          setPostmanLocation([data.latitude, data.longitude]);
        }
      });

      socket.on('delivery:completed', (data) => {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === data.deliveryId
              ? { ...d, status: 'DELIVERED', deliveredAt: data.deliveredAt }
              : d
          )
        );
        addToast('🎉 Parcel delivered successfully!', 'success');
      });

      return () => {
        socket.off('delivery:statusUpdate');
        socket.off('postman:location');
        socket.off('delivery:completed');
      };
    }
  }, [socket, trackingDelivery]);

  const fetchDeliveries = async () => {
    try {
      const { data } = await deliveryService.getMyDeliveries(pagination.page);
      setDeliveries(data.deliveries);
      setPagination((prev) => ({ ...prev, totalPages: data.pagination.totalPages }));
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQRGenerated = (delivery) => {
    fetchDeliveries();
  };

  const handleTrackDelivery = (delivery) => {
    setTrackingDelivery(delivery);
    joinDelivery(delivery.id);
    setActiveTab('tracking');
  };

  const handleConfirmScan = async (qrData) => {
    try {
      // Extract delivery ID from QR payload (format: GOVDEL:<uuid> or just <uuid>)
      let deliveryId = qrData.trim();
      if (deliveryId.startsWith('GOVDEL:')) {
        deliveryId = deliveryId.substring(7);
      }

      // Validate it looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(deliveryId)) {
        addToast('Invalid QR code format', 'error');
        return;
      }

      const { data } = await deliveryService.confirmDelivery(deliveryId, qrData);
      addToast('✅ Delivery confirmed successfully!', 'success');
      fetchDeliveries();
    } catch (err) {
      addToast(err.response?.data?.error || 'Confirmation failed', 'error');
    }
  };

  const activeDeliveries = deliveries.filter(
    (d) => !['DELIVERED', 'EXPIRED'].includes(d.status)
  );
  const pastDeliveries = deliveries.filter((d) =>
    ['DELIVERED', 'EXPIRED'].includes(d.status)
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'generate', label: 'Generate QR', icon: '📦' },
    { id: 'confirm', label: 'Confirm Delivery', icon: '✅' },
    { id: 'tracking', label: 'Live Track', icon: '📍' },
    { id: 'notifications', label: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`, icon: '🔔' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">
              Welcome, <span className="text-gradient-gold">{user?.name}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Secure Government Document Delivery System
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-500">{activeDeliveries.length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{pastDeliveries.filter((d) => d.status === 'DELIVERED').length}</p>
              <p className="text-xs text-slate-500">Delivered</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Active Deliveries */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">
                📦 Active Deliveries ({activeDeliveries.length})
              </h3>
              {loading ? (
                <div className="py-12"><LoadingSpinner text="Loading deliveries..." /></div>
              ) : activeDeliveries.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeDeliveries.map((delivery, i) => (
                    <div key={delivery.id} onClick={() => handleTrackDelivery(delivery)} className="cursor-pointer">
                      <DeliveryCard delivery={delivery} index={i} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card text-center py-8">
                  <p className="text-slate-500">No active deliveries</p>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="mt-3 text-sm text-gold-500 hover:text-gold-400"
                  >
                    Generate a new QR →
                  </button>
                </div>
              )}
            </div>

            {/* Delivery History */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">
                📋 Delivery History
              </h3>
              {pastDeliveries.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {pastDeliveries.map((delivery, i) => (
                    <DeliveryCard key={delivery.id} delivery={delivery} index={i} />
                  ))}
                </div>
              ) : (
                <div className="glass-card text-center py-6">
                  <p className="text-slate-600 text-sm">No delivery history yet</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-3 py-1.5 text-sm bg-navy-700 text-slate-400 rounded-lg disabled:opacity-30 hover:bg-navy-600"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-slate-500">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-3 py-1.5 text-sm bg-navy-700 text-slate-400 rounded-lg disabled:opacity-30 hover:bg-navy-600"
                >
                  Next →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'generate' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <QRGenerator onGenerated={handleQRGenerated} />
          </motion.div>
        )}

        {activeTab === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200">Confirm Delivery</h3>
                <p className="text-xs text-slate-500">Scan the QR code on your parcel to confirm receipt</p>
              </div>
            </div>
            <QRScanner onScan={handleConfirmScan} />
          </motion.div>
        )}

        {activeTab === 'tracking' && (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card"
          >
            <h3 className="text-lg font-bold text-slate-200 mb-4">📍 Live Tracking</h3>
            {trackingDelivery ? (
              <div className="space-y-4">
                <div className="p-3 bg-navy-800/50 rounded-lg">
                  <p className="text-sm text-slate-300">{trackingDelivery.address}</p>
                  <p className="text-xs text-gold-500 mt-1">Status: {trackingDelivery.status}</p>
                </div>
                <LiveTrackingMap
                  postmanPosition={postmanLocation}
                  destinationPosition={[trackingDelivery.latitude || 20.59, trackingDelivery.longitude || 78.96]}
                  destinationAddress={trackingDelivery.address}
                />
                {postmanLocation ? (
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                    <p className="text-sm text-sky-400">📮 Postman is on the way!</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">Waiting for postman location updates...</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">Select an active delivery to track</p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="mt-3 text-sm text-gold-500 hover:text-gold-400"
                >
                  ← Back to overview
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-200">🔔 Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gold-500 hover:text-gold-400"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      notif.isRead
                        ? 'bg-navy-800/30 border-navy-700/30 text-slate-500'
                        : 'bg-gold-500/5 border-gold-500/15 text-slate-300'
                    }`}
                  >
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-600 py-6 text-sm">No notifications yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
