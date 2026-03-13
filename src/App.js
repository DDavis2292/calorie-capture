import React, { useState } from 'react';
import './App.css';
import BarcodeScanner from './components/BarcodeScanner';
import FoodForm from './components/FoodForm';
import FoodList from './components/FoodList';

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const handleBarcodeScanned = (barcode) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
    setShowForm(true);
  };

  const startNewEntry = () => {
    setScannedBarcode('');
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setScannedBarcode('');
    setShowForm(false);
    setActiveTab('database');
  };

  const handleFormCancel = () => {
    setScannedBarcode('');
    setShowForm(false);
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
          onClick={() => {
            setActiveTab('scan');
            setShowForm(false);
            setShowBarcodeScanner(false);
          }}
        >
          📷 Scan
        </button>
        <button 
          className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('database');
            setShowForm(false);
            setShowBarcodeScanner(false);
          }}
        >
          📊 Database
        </button>
      </div>

      {activeTab === 'scan' && !showForm && !showBarcodeScanner && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: 'var(--accent-blue)' }}>
            Add New Product
          </h3>
          <button 
            className="btn btn-primary btn-full"
            onClick={startNewEntry}
          >
            ➕ New Entry
          </button>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '16px', fontSize: '0.9rem' }}>
            Create a new food database entry with photos and nutrition info
          </p>
        </div>
      )}

      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {showForm && (
        <FoodForm
          initialBarcode={scannedBarcode}
          onComplete={handleFormComplete}
          onCancel={handleFormCancel}
          onScanBarcode={() => setShowBarcodeScanner(true)}
        />
      )}

      {activeTab === 'database' && <FoodList />}
    </div>
  );
}

export default App;