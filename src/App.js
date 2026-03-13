import React, { useState } from 'react';
import './App.css';
import BarcodeScanner from './components/BarcodeScanner';
import CameraCapture from './components/CameraCapture';
import FoodForm from './components/FoodForm';
import FoodList from './components/FoodList';

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);

  const handleBarcodeScanned = (barcode) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
    setShowCamera(true);
  };

  const handlePhotoCapture = (photoBlob, nutrition) => {
    setCapturedPhoto(photoBlob);
    setNutritionData(nutrition);
    setShowCamera(false);
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setScannedBarcode(null);
    setCapturedPhoto(null);
    setNutritionData(null);
    setShowForm(false);
    setActiveTab('database');
  };

  const startNewScan = () => {
    setScannedBarcode(null);
    setCapturedPhoto(null);
    setNutritionData(null);
    setShowForm(false);
    setShowCamera(false);
    setShowBarcodeScanner(true);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">Calorie Capture</h1>
        <p className="app-subtitle">Build Your Personal Food Database</p>
      </div>

      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          📷 Scan
        </button>
        <button 
          className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          📊 Database
        </button>
      </div>

      {activeTab === 'scan' && (
        <div>
          {!showBarcodeScanner && !showCamera && !showForm && (
            <div className="card">
              <h3 style={{ marginBottom: '20px', color: 'var(--accent-pink)' }}>
                Start New Entry
              </h3>
              <button 
                className="btn btn-primary btn-full"
                onClick={startNewScan}
              >
                📷 Scan Barcode & Capture Label
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '16px', fontSize: '0.9rem' }}>
                Scan product barcode, then photograph the nutrition label to add to your database
              </p>
            </div>
          )}

          {showBarcodeScanner && (
            <BarcodeScanner
              onScan={handleBarcodeScanned}
              onClose={() => setShowBarcodeScanner(false)}
            />
          )}

          {showCamera && (
            <CameraCapture
              onCapture={handlePhotoCapture}
              onClose={() => {
                setShowCamera(false);
                setScannedBarcode(null);
              }}
            />
          )}

          {showForm && (
            <FoodForm
              barcode={scannedBarcode}
              nutritionData={nutritionData}
              photoBlob={capturedPhoto}
              onComplete={handleFormComplete}
            />
          )}
        </div>
      )}

      {activeTab === 'database' && <FoodList />}
    </div>
  );
}

export default App;