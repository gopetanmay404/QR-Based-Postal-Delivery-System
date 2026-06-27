import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';

/**
 * Try reading QR from image using native BarcodeDetector API (Chrome/Edge/Android)
 * This is MUCH more reliable than html5-qrcode for file uploads
 */
async function scanWithNativeAPI(file) {
  if (!('BarcodeDetector' in window)) return null;

  try {
    const bitmap = await createImageBitmap(file);
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    const results = await detector.detect(bitmap);
    bitmap.close();

    if (results.length > 0) {
      return results[0].rawValue;
    }
  } catch (_) {
    // Native API failed, will fall back
  }
  return null;
}

/**
 * Try reading QR using html5-qrcode library (fallback)
 */
async function scanWithHtml5Qrcode(file, containerId) {
  const scanner = new Html5Qrcode(containerId);
  try {
    const result = await scanner.scanFile(file, false);
    return result;
  } finally {
    try { await scanner.clear(); } catch (_) {}
  }
}

/**
 * Try reading QR by drawing image on canvas and using BarcodeDetector
 * Handles cases where createImageBitmap fails
 */
async function scanWithCanvas(file) {
  if (!('BarcodeDetector' in window)) return null;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const results = await detector.detect(canvas);

        if (results.length > 0) {
          resolve(results[0].rawValue);
        } else {
          resolve(null);
        }
      } catch (_) {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

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
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopCamera();
          setSuccessMsg('QR scanned successfully!');
          onScan?.(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      const msg = err?.message || String(err);

      if (msg.includes('NotAllowed') || msg.includes('Permission') || msg.includes('denied') || msg.includes('dismissed')) {
        setError('Camera permission denied. Use "Upload QR Image" instead, or allow camera in browser settings.');
      } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
        setError('No camera found. Use "Upload QR Image" below.');
      } else if (msg.includes('NotReadable') || msg.includes('Could not start')) {
        setError('Camera busy. Close other apps using it, or use "Upload QR Image".');
      } else {
        setError(`Camera error: ${msg}`);
      }
      onError?.(msg);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // ─── File Upload Scan (multi-method) ──────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Maximum 10 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      let result = null;

      // Method 1: Native BarcodeDetector (best, works in Chrome/Edge/Android)
      result = await scanWithNativeAPI(file);

      // Method 2: Canvas + BarcodeDetector (handles more image types)
      if (!result) {
        result = await scanWithCanvas(file);
      }

      // Method 3: html5-qrcode library (fallback for Safari/Firefox)
      if (!result) {
        try {
          result = await scanWithHtml5Qrcode(file, 'qr-upload-container');
        } catch (_) {
          // Will show error below
        }
      }

      if (result) {
        setSuccessMsg('QR code read successfully!');
        onScan?.(result);
      } else {
        setError(
          'Could not detect a QR code in this image. Tips:\n• Make sure the QR code is clearly visible and not cut off\n• Try downloading the original QR image instead of a screenshot\n• Crop the image so only the QR code is visible\n• Make sure the image is not blurry'
        );
        onError?.('All scan methods failed');
      }
    } catch (err) {
      setError('Failed to process image. Try a different image format (PNG or JPG).');
      onError?.(err?.message || 'Scan failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera preview */}
      <div
        id="qr-reader"
        className="rounded-xl overflow-hidden bg-navy-800"
        style={{
          minHeight: scanning ? '320px' : '0px',
          display: scanning ? 'block' : 'none',
        }}
      />

      {/* Hidden containers */}
      <div id="qr-upload-container" style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-file-input"
      />

      {/* Success */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
        >
          <p className="text-sm text-emerald-400 font-medium">{successMsg}</p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30">
          <p className="text-sm text-crimson-400 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Controls */}
      {!scanning ? (
        <div className="space-y-3">
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
                Scanning image...
              </>
            ) : (
              <>Upload QR Image</>
            )}
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-navy-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-navy-600" />
          </div>

          <motion.button
            onClick={startCamera}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-navy-700 text-sky-400 border border-sky-500/20 rounded-lg font-semibold hover:bg-navy-600 hover:border-sky-500/40 transition-all flex items-center justify-center gap-2"
          >
            Scan with Camera
          </motion.button>

          <p className="text-xs text-slate-600 text-center">
            On mobile? Take a photo of the QR code first, then upload it above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <motion.button
            onClick={stopCamera}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-crimson-500 text-white rounded-lg font-semibold hover:bg-crimson-400 transition-all"
          >
            Stop Camera
          </motion.button>

          <motion.button
            onClick={() => {
              stopCamera();
              setTimeout(() => fileInputRef.current?.click(), 300);
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-navy-700 text-gold-500 border border-gold-500/20 rounded-lg text-sm font-medium hover:bg-navy-600 transition-all"
          >
            Switch to Image Upload
          </motion.button>
        </div>
      )}
    </div>
  );
}
