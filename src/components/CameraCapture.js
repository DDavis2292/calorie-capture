import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onCapture, onClose, captureType }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 4032 },  // Max phone camera resolution
          height: { ideal: 3024 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
        setStream(mediaStream);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Cannot access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setPhoto({ blob, url });
    }, 'image/jpeg', 1.0);  // Max quality
  };

  const confirmPhoto = async () => {
    // Product photo - no OCR
    if (captureType === 'product') {
      stopCamera();
      onCapture(photo.blob);
      return;
    }
    
    // Nutrition label - do OCR
    if (captureType === 'nutrition') {
      setProcessing(true);
      
      try {
        console.log("Starting OCR...");
        
        const result = await Tesseract.recognize(photo.blob, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        const text = result.data.text;
        console.log("=== RAW OCR TEXT ===");
        console.log(text);
        console.log("===================");
        
        setOcrText(text); // Show user what OCR read
        
        const nutritionData = extractNutrition(text);
        console.log("Extracted nutrition:", nutritionData);
        
        stopCamera();
        onCapture(photo.blob, nutritionData);
      } catch (err) {
        console.error("OCR Error:", err);
        alert("OCR failed. Check console for details.");
        stopCamera();
        onCapture(photo.blob, {});
      }
    }
  };

  const retakePhoto = () => {
    URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setOcrText('');
  };

  const extractNutrition = (text) => {
    // Clean up text - remove extra spaces and normalize
    const cleanText = text.replace(/\s+/g, ' ').toLowerCase();
    
    const data = {
      servingSize: '',
      calories: 0,
      totalFat: 0,
      saturatedFat: 0,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbs: 0,
      dietaryFiber: 0,
      totalSugars: 0,
      addedSugars: 0,
      protein: 0,
      vitaminD: 0,
      calcium: 0,
      iron: 0,
      potassium: 0
    };
    
    // More flexible regex patterns
    
    // Serving size - try multiple patterns
    let servingMatch = text.match(/serving\s*size[:\s]*([^\n]+)/i);
    if (!servingMatch) servingMatch = text.match(/servings?\s*per\s*container[:\s]*([^\n]+)/i);
    if (servingMatch) data.servingSize = servingMatch[1].trim();
    
    // Calories - try multiple patterns
    let calMatch = text.match(/calories[:\s]*(\d+)/i);
    if (!calMatch) calMatch = text.match(/(\d+)\s*calories/i);
    if (calMatch) data.calories = parseInt(calMatch[1]);
    
    // Total Fat
    let fatMatch = text.match(/total\s*fat[:\s]*(\d+\.?\d*)\s*g/i);
    if (!fatMatch) fatMatch = text.match(/fat[:\s]*(\d+\.?\d*)\s*g/i);
    if (fatMatch) data.totalFat = parseFloat(fatMatch[1]);
    
    // Saturated Fat
    let satMatch = text.match(/saturated\s*fat[:\s]*(\d+\.?\d*)\s*g/i);
    if (!satMatch) satMatch = text.match(/sat\.?\s*fat[:\s]*(\d+\.?\d*)\s*g/i);
    if (satMatch) data.saturatedFat = parseFloat(satMatch[1]);
    
    // Trans Fat
    let transMatch = text.match(/trans\s*fat[:\s]*(\d+\.?\d*)\s*g/i);
    if (transMatch) data.transFat = parseFloat(transMatch[1]);
    
    // Cholesterol
    let cholMatch = text.match(/cholesterol[:\s]*(\d+\.?\d*)\s*mg/i);
    if (cholMatch) data.cholesterol = parseFloat(cholMatch[1]);
    
    // Sodium
    let sodiumMatch = text.match(/sodium[:\s]*(\d+\.?\d*)\s*mg/i);
    if (sodiumMatch) data.sodium = parseFloat(sodiumMatch[1]);
    
    // Total Carbohydrate
    let carbMatch = text.match(/total\s*carbohydrate[:\s]*(\d+\.?\d*)\s*g/i);
    if (!carbMatch) carbMatch = text.match(/carbohydrate[:\s]*(\d+\.?\d*)\s*g/i);
    if (!carbMatch) carbMatch = text.match(/carbs[:\s]*(\d+\.?\d*)\s*g/i);
    if (carbMatch) data.totalCarbs = parseFloat(carbMatch[1]);
    
    // Dietary Fiber
    let fiberMatch = text.match(/dietary\s*fiber[:\s]*(\d+\.?\d*)\s*g/i);
    if (!fiberMatch) fiberMatch = text.match(/fiber[:\s]*(\d+\.?\d*)\s*g/i);
    if (fiberMatch) data.dietaryFiber = parseFloat(fiberMatch[1]);
    
    // Total Sugars
    let sugarMatch = text.match(/total\s*sugars?[:\s]*(\d+\.?\d*)\s*g/i);
    if (!sugarMatch) sugarMatch = text.match(/sugars?[:\s]*(\d+\.?\d*)\s*g/i);
    if (sugarMatch) data.totalSugars = parseFloat(sugarMatch[1]);
    
    // Added Sugars
    let addedMatch = text.match(/added\s*sugars?[:\s]*(\d+\.?\d*)\s*g/i);
    if (!addedMatch) addedMatch = text.match(/includes\s*(\d+\.?\d*)\s*g\s*added\s*sugar/i);
    if (addedMatch) data.addedSugars = parseFloat(addedMatch[1]);
    
    // Protein
    let proteinMatch = text.match(/protein[:\s]*(\d+\.?\d*)\s*g/i);
    if (proteinMatch) data.protein = parseFloat(proteinMatch[1]);
    
    // Vitamin D
    let vitDMatch = text.match(/vitamin\s*d[:\s]*(\d+\.?\d*)\s*(mcg|μg|ug)/i);
    if (vitDMatch) data.vitaminD = parseFloat(vitDMatch[1]);
    
    // Calcium
    let calciumMatch = text.match(/calcium[:\s]*(\d+\.?\d*)\s*mg/i);
    if (calciumMatch) data.calcium = parseFloat(calciumMatch[1]);
    
    // Iron
    let ironMatch = text.match(/iron[:\s]*(\d+\.?\d*)\s*mg/i);
    if (ironMatch) data.iron = parseFloat(ironMatch[1]);
    
    // Potassium
    let potassiumMatch = text.match(/potassium[:\s]*(\d+\.?\d*)\s*mg/i);
    if (potassiumMatch) data.potassium = parseFloat(potassiumMatch[1]);
    
    return data;
  };

  if (photo) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--accent-blue)' }}>
          Review Photo
        </h3>
        
        <div className="camera-viewport-large">
          <img 
            src={photo.url} 
            alt="Captured" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        
        {processing && (
          <div className="status-message status-loading">
            <div className="spinner"></div>
            Reading nutrition label... This may take 30-60 seconds. Check console for progress.
          </div>
        )}
        
        {ocrText && !processing && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            fontSize: '0.75rem',
            maxHeight: '150px',
            overflow: 'auto',
            color: 'var(--text-secondary)'
          }}>
            <strong>OCR Read:</strong><br/>
            {ocrText}
          </div>
        )}
        
        {!processing && (
          <>
            <button className="btn btn-primary btn-full" onClick={confirmPhoto}>
              {captureType === 'nutrition' ? '✓ Use Photo & Read Label' : '✓ Use This Photo'}
            </button>
            
            <button className="btn btn-secondary btn-full" onClick={retakePhoto}>
              ↻ Retake Photo
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-blue)' }}>
        {captureType === 'product' ? 'Capture Product Photo' : 'Capture Nutrition Label'}
      </h3>
      
      <div className="camera-viewport-large">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div className="camera-overlay-vertical"></div>
      </div>
      
      {!cameraReady && (
        <div className="status-message status-loading">
          <div className="spinner"></div>
          Starting camera...
        </div>
      )}
      
      {cameraReady && (
        <>
          <div className="status-message status-loading">
            {captureType === 'product' 
              ? 'Center product in frame' 
              : 'Get CLOSE to label and fill the frame completely'}
          </div>
          
          <button 
            className="btn btn-primary btn-full" 
            onClick={takePhoto}
          >
            📷 TAKE PHOTO
          </button>
          
          <button className="btn btn-secondary btn-full" onClick={onClose}>
            CANCEL
          </button>
        </>
      )}
    </div>
  );
};

export default CameraCapture;