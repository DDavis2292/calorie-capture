import React, { useState } from 'react';
import './App.css';
import BarcodeScanner from './components/BarcodeScanner';
import CameraCapture from './components/CameraCapture';
import FoodForm from './components/FoodForm';
import FoodList from './components/FoodList';

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showProductCamera, setShowProductCamera] = useState(false);
  const [showNutritionCamera, setShowNutritionCamera] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [productPhoto, setProductPhoto] = useState(null);
  const [nutritionPhoto, setNutritionPhoto] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);

  const handleBarcodeScanned = (barcode) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
    setShowProductCamera(true);
  };

  const handleProductPhotoCapture = (photoBlob) => {
    setProductPhoto(photoBlob);
    setShowProductCamera(false);
    setShowNutritionCamera(true);
  };

  const handleNutritionPhotoCapture = (photoBlob, nutrition) => {
    setNutritionPhoto(photoBlob);
    setNutritionData(nutrition);
    setShowNutritionCamera(false);
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setScannedBarcode(null);
    setProductPhoto(null);
    setNutritionPhoto(null);
    setNutritionData(null);
    setShowForm(false);
    setActiveTab('database');
  };

  const startNewScan = () => {
    setScannedBarcode(null);
    setProductPhoto(null);
    setNutritionPhoto(null);
    setNutritionData(null);
    setShowForm(false);
    setShowProductCamera(false);
    setShowNutritionCamera(false);
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
          {!showBarcodeScanner && !showProductCamera && !showNutritionCamera && !showForm && (
            <div className="card">
              <h3 style={{ marginBottom: '20px', color: 'var(--accent-pink)' }}>
                Start New Entry
              </h3>
              <button 
                className="btn btn-primary btn-full"
                onClick={startNewScan}
              >
                📷 Scan Barcode & Capture Photos
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '16px', fontSize: '0.9rem' }}>
                1. Scan barcode<br/>
                2. Photo of product front<br/>
                3. Photo of nutrition label
              </p>
            </div>
          )}

          {showBarcodeScanner && (
            <BarcodeScanner
              onScan={handleBarcodeScanned}
              onClose={() => setShowBarcodeScanner(false)}
            />
          )}

          {showProductCamera && (
            <CameraCapture
              captureType="product"
              onCapture={handleProductPhotoCapture}
              onClose={() => {
                setShowProductCamera(false);
                setScannedBarcode(null);
              }}
            />
          )}

          {showNutritionCamera && (
            <CameraCapture
              captureType="nutrition"
              onCapture={handleNutritionPhotoCapture}
              onClose={() => {
                setShowNutritionCamera(false);
                setProductPhoto(null);
              }}
            />
          )}

          {showForm && (
            <FoodForm
              barcode={scannedBarcode}
              productPhoto={productPhoto}
              nutritionPhoto={nutritionPhoto}
              nutritionData={nutritionData}
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