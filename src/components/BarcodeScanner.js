import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedCode, setDetectedCode] = useState('');
  const hasScannedRef = useRef(false); // Prevent multiple scans

  useEffect(() => {
    startScanner();
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = () => {
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
        alert("Cannot access camera. Please check permissions.");
        return;
      }
      Quagga.start();
      setIsScanning(true);
    });

    Quagga.onDetected((result) => {
      // Only process the first scan
      if (hasScannedRef.current) return;
      
      const code = result.codeResult.code;
      console.log("Barcode detected:", code);
      
      hasScannedRef.current = true; // Mark as scanned
      setDetectedCode(code);
      
      // Stop scanner immediately
      Quagga.stop();
      setIsScanning(false);
      
      // Send barcode back to parent
      onScan(code);
    });
  };

  const stopScanner = () => {
    if (isScanning) {
      Quagga.stop();
      Quagga.offDetected(); // Remove event listener
      setIsScanning(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-blue)' }}>
        Scan Barcode
      </h3>
      <div className="camera-viewport" ref={scannerRef}>
        <div className="camera-overlay"></div>
      </div>
      
      {detectedCode ? (
        <div className="status-message status-success">
          ✓ Scanned: {detectedCode}
        </div>
      ) : (
        <div className="status-message status-loading">
          Point camera at barcode...
        </div>
      )}
      
      <button className="btn btn-secondary btn-full" onClick={() => {
        stopScanner();
        onClose();
      }}>
        Cancel
      </button>
    </div>
  );
};

export default BarcodeScanner;