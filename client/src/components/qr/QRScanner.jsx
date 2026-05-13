import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';

export default function QRScanner({ onScan, onError }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ─── Camera Scan ──────────────────────────────────────
  const startCamera = async () => {
    setError('');
    setSuccessMsg('');
    setScanning(true);

    try {
      // Create a fresh scanner instance each time
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Use simple facingMode — do NOT call getCameras() 
      // because getCameras() itself triggers permission prompts
      // that fail on many mobile browsers
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopCamera();
          setSuccessMsg('✅ QR scanned successfully!');
          onScan?.(decodedText);
        },
        () => {} // ignore per-frame scan misses
      );
    } catch (err) {
      setScanning(false);
      const msg = err?.message || String(err);

      if (
        msg.includes('NotAllowed') ||
        msg.includes('Permission') ||
        msg.includes('denied') ||
        msg.includes('dismissed')
      ) {
        setError(
          'Camera permission was denied by your browser. Please use "Upload QR Image" below, or go to your browser settings and allow camera access for this site.'
        );
      } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
        setError(
          'No camera detected on this device. Please use "Upload QR Image" below.'
        );
      } else if (msg.includes('NotReadable') || msg.includes('Could not start')) {
        setError(
          'Camera is in use by another app. Close other apps using the camera, or use "Upload QR Image" below.'
        );
      } else {
        setError(
          `Camera error: ${msg}. Please use "Upload QR Image" below.`
        );
      }

      onError?.(msg);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // Only stop if actually scanning (state 2 = SCANNING)
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (_) {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // ─── File Upload Scan ─────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Maximum size is 10 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    let html5QrCode = null;

    try {
      html5QrCode = new Html5Qrcode('qr-upload-container');
      const decodedText = await html5QrCode.scanFile(file, /* showImage */ false);
      setSuccessMsg('✅ QR code read successfully from image!');
      onScan?.(decodedText);
    } catch (err) {
      setError(
        'Could not read QR code from this image. Please make sure the QR code is clearly visible, well-lit, and not blurry. Try taking a closer photo.'
      );
      onError?.(err?.message || 'File scan failed');
    } finally {
      try {
        if (html5QrCode) await html5QrCode.clear();
      } catch (_) {}
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera preview — only visible when scanning */}
      <div
        id="qr-reader"
        className="rounded-xl overflow-hidden bg-navy-800"
        style={{
          minHeight: scanning ? '320px' : '0px',
          display: scanning ? 'block' : 'none',
        }}
      />

      {/* Hidden container for file-based scanning */}
      <div id="qr-upload-container" style={{ display: 'none' }} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-file-input"
      />

      {/* Success message */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
        >
          <p className="text-sm text-emerald-400 font-medium">{successMsg}</p>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30">
          <p className="text-sm text-crimson-400">{error}</p>
        </div>
      )}

      {/* ──── Controls ──── */}
      {!scanning ? (
        <div className="space-y-3">
          {/* ★ UPLOAD BUTTON — shown first as primary option */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 gradient-gold text-navy-900 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                Reading QR from image...
              </>
            ) : (
              <>📁 Upload QR Image</>
            )}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-navy-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-navy-600" />
          </div>

          {/* Camera button — secondary option */}
          <motion.button
            onClick={startCamera}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-navy-700 text-sky-400 border border-sky-500/20 rounded-lg font-semibold hover:bg-navy-600 hover:border-sky-500/40 transition-all flex items-center justify-center gap-2"
          >
            📷 Scan with Camera
          </motion.button>

          <p className="text-xs text-slate-600 text-center">
            📱 On mobile? Take a photo of the QR code first, then upload it above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <motion.button
            onClick={stopCamera}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-crimson-500 text-white rounded-lg font-semibold hover:bg-crimson-400 transition-all flex items-center justify-center gap-2"
          >
            ⏹ Stop Camera
          </motion.button>

          {/* Allow upload even while camera is active */}
          <motion.button
            onClick={() => {
              stopCamera();
              setTimeout(() => fileInputRef.current?.click(), 300);
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-navy-700 text-gold-500 border border-gold-500/20 rounded-lg text-sm font-medium hover:bg-navy-600 transition-all flex items-center justify-center gap-2"
          >
            📁 Switch to Image Upload
          </motion.button>
        </div>
      )}
    </div>
  );
}
