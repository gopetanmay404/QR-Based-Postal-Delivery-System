import { useState } from 'react';
import { motion } from 'framer-motion';
import MapPicker from '../maps/MapPicker';
import { deliveryService } from '../../services/deliveryService';
import { useNotifications } from '../../context/NotificationContext';

const DOCUMENT_TYPES = [
  { value: 'PAN_CARD', label: 'PAN Card', icon: '💳' },
  { value: 'PASSPORT', label: 'Passport', icon: '📕' },
  { value: 'AADHAAR', label: 'Aadhaar Card', icon: '🪪' },
  { value: 'VOTER_ID', label: 'Voter ID', icon: '🗳️' },
  { value: 'CERTIFICATE', label: 'Gov Certificate', icon: '📜' },
  { value: 'OTHER', label: 'Other Document', icon: '📄' },
];

export default function QRGenerator({ onGenerated }) {
  const [documentType, setDocumentType] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null); // { qrDataUrl, delivery }
  const [error, setError] = useState('');
  const { addToast } = useNotifications();

  const handleGenerate = async () => {
    if (!documentType) { setError('Please select a document type'); return; }
    if (!location) { setError('Please select a delivery location'); return; }

    setError('');
    setLoading(true);

    try {
      const { data } = await deliveryService.generate({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        documentType,
      });

      setGeneratedQR({
        qrDataUrl: data.delivery.qrDataUrl,
        delivery: data.delivery,
      });
      addToast('Secure QR generated successfully!', 'success');
      onGenerated?.(data.delivery);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR');
      addToast('QR generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!generatedQR?.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = generatedQR.qrDataUrl;
    link.download = `delivery-qr-${generatedQR.delivery.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setGeneratedQR(null);
    setDocumentType('');
    setLocation(null);
  };

  // ─── Show generated QR ────────────────────────────────
  if (generatedQR) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card text-center space-y-5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-4xl"
        >
          ✅
        </motion.div>

        <div>
          <h3 className="text-xl font-bold text-emerald-400">QR Generated!</h3>
          <p className="text-sm text-slate-400 mt-1">
            Show this QR code to the delivery postman for scanning
          </p>
        </div>

        {/* QR Image Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl inline-block">
            <img
              src={generatedQR.qrDataUrl}
              alt="Delivery QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>

        <div className="p-3 bg-navy-800/50 rounded-lg text-left">
          <p className="text-xs text-slate-500">Delivery Address</p>
          <p className="text-sm text-slate-300">{generatedQR.delivery.address}</p>
          <p className="text-xs text-gold-500/70 mt-1">
            Expires: {new Date(generatedQR.delivery.expiresAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={handleDownloadQR}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 gradient-gold text-navy-900 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
          >
            📥 Download QR
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-navy-700 text-slate-400 rounded-lg font-medium hover:bg-navy-600 transition-all"
          >
            New QR
          </motion.button>
        </div>

        <div className="p-3 bg-gold-500/5 border border-gold-500/15 rounded-lg">
          <p className="text-xs text-gold-500">
            🔒 This QR is encrypted with AES-256. Only authorized postmen can validate it.
            Save or screenshot it — the postman will scan this to start delivery.
          </p>
        </div>
      </motion.div>
    );
  }

  // ─── Generation Form ──────────────────────────────────
  return (
    <div className="glass-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
          <span className="text-xl">📦</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-200">Generate Secure QR</h3>
          <p className="text-xs text-slate-500">Link your document to a secure delivery address</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-sm">
          {error}
        </div>
      )}

      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Document Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DOCUMENT_TYPES.map((doc) => (
            <motion.button
              key={doc.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDocumentType(doc.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                documentType === doc.value
                  ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                  : 'border-navy-600 bg-navy-800/50 text-slate-400 hover:border-navy-500'
              }`}
            >
              <span className="text-lg">{doc.icon}</span>
              <p className="text-xs font-medium mt-1">{doc.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Delivery Location</label>
        <MapPicker onLocationSelect={setLocation} />
      </div>

      {/* Generate Button */}
      <motion.button
        onClick={handleGenerate}
        disabled={loading || !documentType || !location}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 gradient-gold text-navy-900 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>🔐 Generate Secure QR</>
        )}
      </motion.button>
    </div>
  );
}
