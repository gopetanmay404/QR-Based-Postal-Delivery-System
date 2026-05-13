import { useState } from 'react';
import { motion } from 'framer-motion';
import DeliveryStatusTracker from './DeliveryStatusTracker';
import { deliveryService } from '../../services/deliveryService';

export default function DeliveryCard({ delivery, index = 0 }) {
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  const statusBadge = {
    GENERATED: { bg: 'bg-navy-600/50', text: 'text-slate-400', label: 'Generated' },
    IN_TRANSIT: { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'In Transit' },
    NEAR_POST_OFFICE: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Near Post Office' },
    OUT_FOR_DELIVERY: { bg: 'bg-gold-500/20', text: 'text-gold-500', label: 'Out for Delivery' },
    DELIVERED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Delivered' },
    EXPIRED: { bg: 'bg-crimson-500/20', text: 'text-crimson-400', label: 'Expired' },
  };

  const badge = statusBadge[delivery.status] || statusBadge.GENERATED;
  const canViewQR = !['DELIVERED', 'EXPIRED'].includes(delivery.status);

  const handleViewQR = async (e) => {
    e.stopPropagation();
    if (qrImage) {
      setShowQR(!showQR);
      return;
    }

    setQrLoading(true);
    setQrError('');
    try {
      const { data } = await deliveryService.getQR(delivery.id);
      setQrImage(data.qrDataUrl);
      setShowQR(true);
    } catch (err) {
      setQrError(err.response?.data?.error || 'Failed to load QR');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `qr-${delivery.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card hover:border-gold-500/20 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{delivery.address}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(delivery.generatedAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} flex-shrink-0 ml-2`}>
          {badge.label}
        </span>
      </div>

      <DeliveryStatusTracker status={delivery.status} />

      {delivery.postman && (
        <div className="mt-3 pt-3 border-t border-navy-600/30 flex items-center gap-2">
          <span className="text-xs text-slate-500">📮 Postman:</span>
          <span className="text-xs text-slate-400">{delivery.postman.name}</span>
        </div>
      )}

      {delivery.deliveredAt && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-emerald-500">
            ✅ Delivered: {new Date(delivery.deliveredAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      )}

      {/* View QR Button */}
      {canViewQR && (
        <div className="mt-3 pt-3 border-t border-navy-600/30">
          <button
            onClick={handleViewQR}
            disabled={qrLoading}
            className="text-xs text-gold-500 hover:text-gold-400 font-medium disabled:opacity-50"
          >
            {qrLoading ? 'Loading QR...' : showQR ? '🔼 Hide QR' : '🔽 Show QR Code'}
          </button>

          {qrError && <p className="text-xs text-crimson-400 mt-1">{qrError}</p>}

          {showQR && qrImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 text-center"
            >
              <div className="inline-block p-3 bg-white rounded-xl">
                <img src={qrImage} alt="QR Code" className="w-48 h-48 object-contain" />
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={handleDownload}
                  className="text-xs px-3 py-1.5 gradient-gold text-navy-900 rounded-lg font-medium"
                >
                  📥 Download
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Show this QR to the postman for scanning
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
