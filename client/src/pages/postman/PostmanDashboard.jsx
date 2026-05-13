import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { postmanService } from '../../services/postmanService';
import QRScanner from '../../components/qr/QRScanner';
import DeliveryStatusTracker from '../../components/delivery/DeliveryStatusTracker';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PostmanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [activeTab, setActiveTab] = useState('assigned');
  const [startingDelivery, setStartingDelivery] = useState(null);

  useEffect(() => { fetchAssigned(); }, []);

  const fetchAssigned = async () => {
    try {
      const { data } = await postmanService.getAssigned();
      setDeliveries(data.deliveries);
    } catch (err) {
      console.error('Failed to fetch assigned deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (qrData) => {
    setScanError('');
    try {
      const { data } = await postmanService.scanQR(qrData);
      setScanResult(data.delivery);
      setActiveTab('result');
    } catch (err) {
      setScanError(err.response?.data?.error || 'Invalid QR code');
    }
  };

  const handleStartDelivery = async (deliveryId) => {
    setStartingDelivery(deliveryId);
    try {
      await postmanService.startDelivery(deliveryId);
      navigate(`/postman/navigate/${deliveryId}`);
    } catch (err) {
      setScanError(err.response?.data?.error || 'Failed to start delivery');
    } finally {
      setStartingDelivery(null);
    }
  };

  const tabs = [
    { id: 'assigned', label: 'Assigned', icon: '📋' },
    { id: 'scan', label: 'Scan QR', icon: '📷' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">
              Postman <span className="text-sky-400">{user?.name}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Employee ID: <span className="text-sky-500">{user?.employeeId}</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-400">{deliveries.length}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        {scanResult && (
          <button
            onClick={() => setActiveTab('result')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'result'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700/50'
            }`}
          >
            ✅ Scan Result
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'assigned' && (
          <motion.div
            key="assigned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-200">📋 Assigned Deliveries</h3>
            {loading ? (
              <div className="py-12"><LoadingSpinner text="Loading..." /></div>
            ) : deliveries.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {deliveries.map((delivery, i) => (
                  <motion.div
                    key={delivery.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {delivery.address}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          👤 {delivery.user?.name} • 📞 {delivery.user?.phone}
                        </p>
                      </div>
                    </div>

                    <DeliveryStatusTracker status={delivery.status} />

                    <div className="mt-4 flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStartDelivery(delivery.id)}
                        disabled={startingDelivery === delivery.id}
                        className="flex-1 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {startingDelivery === delivery.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>🚀 Start Delivery</>
                        )}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/postman/navigate/${delivery.id}`)}
                        className="px-4 py-2 bg-navy-700 text-gold-500 rounded-lg text-sm font-medium hover:bg-navy-600 transition-all"
                      >
                        🗺️
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card text-center py-8">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-500">No assigned deliveries</p>
                <p className="text-xs text-slate-600 mt-1">
                  Scan a QR code to get assigned
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <span className="text-xl">📷</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200">Scan Parcel QR</h3>
                <p className="text-xs text-slate-500">
                  Scan to validate and get delivery route
                </p>
              </div>
            </div>

            {scanError && (
              <div className="mb-4 p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-sm">
                {scanError}
              </div>
            )}

            <QRScanner onScan={handleScan} />
          </motion.div>
        )}

        {activeTab === 'result' && scanResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="text-5xl mb-3"
              >
                ✅
              </motion.div>
              <h3 className="text-lg font-bold text-emerald-400">
                QR Validated!
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-navy-800/50 rounded-lg">
                <p className="text-xs text-slate-500">Recipient</p>
                <p className="text-sm text-slate-200">
                  {scanResult.userName} • {scanResult.userPhone}
                </p>
              </div>
              <div className="p-3 bg-navy-800/50 rounded-lg">
                <p className="text-xs text-slate-500">Delivery Address</p>
                <p className="text-sm text-slate-200">{scanResult.address}</p>
              </div>
              <div className="p-3 bg-navy-800/50 rounded-lg">
                <p className="text-xs text-slate-500">Coordinates</p>
                <p className="text-sm text-gold-500">
                  {scanResult.latitude}, {scanResult.longitude}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartDelivery(scanResult.id)}
              className="w-full py-3 bg-sky-500 text-white rounded-lg font-bold hover:bg-sky-400 transition-all flex items-center justify-center gap-2"
            >
              🚀 Start Delivery & Navigate
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
