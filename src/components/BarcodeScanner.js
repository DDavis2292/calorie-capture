import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  // Memoize stopScanner so it can be safely used in the effect
  const stopScanner = useCallback(() => {
    if (isScanning) {
      Quagga.stop();
      setIsScanning(false);
    }
  }, [isScanning]);

  // Memoize startScanner to prevent unnecessary re-runs
  const startScanner = useCallback(() => {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          facingMode: "environment",
          aspectRatio: { min: 1, max: 2 }
        },
      },
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "upc_reader",
          "upc_e_reader",
          "code_128_reader",
          "code_39_reader"
        ]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error("Scanner init error:", err);
        return;
      }
      Quagga.start();
      setIsScanning(true);
    });

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log("Barcode detected:", code);
      onScan(code);
      stopScanner();
    });
  }, [onScan, stopScanner]);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
    // Dependencies are now included, satisfying ESLint
  }, [startScanner, stopScanner]);

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-pink)' }}>
        Scan Barcode
      </h3>
      <div className="camera-viewport" ref={scannerRef}>
        <div className="camera-overlay"></div>
      </div>
      <div className="status-message status-loading">
        Point camera at barcode...
      </div>
      <button className="btn btn-secondary btn-full" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
};

export default BarcodeScanner;