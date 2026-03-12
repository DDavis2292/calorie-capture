import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import BarcodeScanner from './components/BarcodeScanner';
import CameraCapture from './components/CameraCapture';
import FoodForm from './components/FoodForm';

function App() {
  const [step, setStep] = useState('home');
  const [barcode, setBarcode] = useState('');
  const [nutritionData, setNutritionData] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [savedFoods, setSavedFoods] = useState([]);

  // Restore the Home Screen database fetch logic
  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedFoods(data || []);
    } catch (err) {
      console.error("Error fetching foods:", err.message);
    }
  };

  const handleBarcodeScanned = (code) => {
    setBarcode(code);
    setStep('capture'); // Direct transition to label capture
  };

  const handleCapture = (blob, data) => {
    setPhotoBlob(blob);
    setNutritionData(data);
    setStep('form');
  };

  const resetApp = () => {
    fetchFoods(); // Refresh database list on home screen
    setStep('home');
    setBarcode('');
    setNutritionData(null);
    setPhotoBlob(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Calorie<span>Capture</span></h1>
        <p className="tagline">Scan. Track. Achieve.</p>
      </header>

      {step === 'home' && (
        <div className="home-screen">
          <div className="card hero-card">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Start Tracking</h2>
            <button className="btn btn-primary btn-full" onClick={() => setStep('scanner')}>
              🔍 Scan Food
            </button>
          </div>
          
          <h2 className="section-title">Logged Foods</h2>
          <div className="food-list">
            {savedFoods.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No foods logged yet.</p>
            ) : (
              savedFoods.map(food => (
                <div key={food.id} className="card food-item">
                  <div className="food-info">
                    <strong>{food.name}</strong>
                    <div className="food-stats">
                      {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                    </div>
                  </div>
                  {food.image_url && (
                    <img src={food.image_url} alt={food.name} className="food-thumb" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {step === 'scanner' && (
        <BarcodeScanner onScan={handleBarcodeScanned} onClose={resetApp} />
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