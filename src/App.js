import React, { useState } from 'react';
import './App.css';
import BarcodeScanner from './components/BarcodeScanner';
import CameraCapture from './components/CameraCapture';
import FoodForm from './components/FoodForm';

function App() {
  const [step, setStep] = useState('home');
  const [barcode, setBarcode] = useState('');
  const [nutritionData, setNutritionData] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);

  const resetApp = () => {
    setStep('home');
    setBarcode('');
    setNutritionData(null);
    setPhotoBlob(null);
  };

  // Fixed transition logic to prevent camera black screen
  const handleBarcodeScanned = (code) => {
    setBarcode(code);
    setStep('transitioning');
    
    // 600ms buffer allows the browser to release the camera from Quagga
    setTimeout(() => {
      setStep('capture');
    }, 600);
  };

  const handleCapture = (blob, data) => {
    setPhotoBlob(blob);
    setNutritionData(data);
    setStep('form');
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Calorie<span>Capture</span></h1>
        <p className="tagline">Scan. Track. Achieve.</p>
      </header>

      {step === 'home' && (
        <div className="card">
          <div className="hero-icon">📸</div>
          <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Start Tracking</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Scan a barcode or take a photo of a nutrition label to instantly log your food.
          </p>
          <button className="btn btn-primary btn-full" onClick={() => setStep('scanner')}>
            🔍 Scan Barcode
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => setStep('capture')}>
            📷 Take Photo Only
          </button>
        </div>
      )}

      {step === 'scanner' && (
        <BarcodeScanner onScan={handleBarcodeScanned} onClose={resetApp} />
      )}

      {step === 'transitioning' && (
        <div className="card">
          <div className="status-message status-loading">
            <div className="spinner"></div>
            Resetting camera for label capture...
          </div>
        </div>
      )}

      {step === 'capture' && (
        <CameraCapture onCapture={handleCapture} onClose={resetApp} />
      )}

      {step === 'form' && (
        <FoodForm 
          barcode={barcode} 
          nutritionData={nutritionData} 
          photoBlob={photoBlob} 
          onComplete={resetApp} 
        />
      )}
    </div>
  );
}

export default App;