import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onCapture, onClose, captureType }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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
    }, 'image/jpeg', 0.95);
  };

  const confirmPhoto = async () => {
    // If this is the PRODUCT photo, return immediately (no OCR)
    if (captureType === 'product') {
      stopCamera();
      onCapture(photo.blob);
      return;
    }
    
    // If this is the NUTRITION label, do OCR
    if (captureType === 'nutrition') {
      setProcessing(true);
      
      try {
        const result = await Tesseract.recognize(photo.blob, 'eng', {
          logger: m => console.log(m)
        });
        
        const text = result.data.text;
        console.log("OCR Result:", text);
        
        const nutritionData = extractNutrition(text);
        
        stopCamera();
        onCapture(photo.blob, nutritionData);
      } catch (err) {
        console.error("OCR Error:", err);
        alert("OCR failed. You can enter values manually.");
        stopCamera();
        onCapture(photo.blob, {});
      }
    }
  };

  const retakePhoto = () => {
    URL.revokeObjectURL(photo.url);
    setPhoto(null);
  };

  const extractNutrition = (text) => {
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
    
    const servingMatch = text.match(/serving\s+size[:\s]+([^\n]+)/i);
    if (servingMatch) data.servingSize = servingMatch[1].trim();
    
    const calMatch = text.match(/calories[:\s]+(\d+)/i);
    if (calMatch) data.calories = parseInt(calMatch[1]);
    
    const totalFatMatch = text.match(/total\s+fat[:\s]+(\d+\.?\d*)\s*g/i);
    if (totalFatMatch) data.totalFat = parseFloat(totalFatMatch[1]);
    
    const satFatMatch = text.match(/saturated\s+fat[:\s]+(\d+\.?\d*)\s*g/i);
    if (satFatMatch) data.saturatedFat = parseFloat(satFatMatch[1]);
    
    const transFatMatch = text.match(/trans\s+fat[:\s]+(\d+\.?\d*)\s*g/i);
    if (transFatMatch) data.transFat = parseFloat(transFatMatch[1]);
    
    const cholMatch = text.match(/cholesterol[:\s]+(\d+\.?\d*)\s*mg/i);
    if (cholMatch) data.cholesterol = parseFloat(cholMatch[1]);
    
    const sodiumMatch = text.match(/sodium[:\s]+(\d+\.?\d*)\s*mg/i);
    if (sodiumMatch) data.sodium = parseFloat(sodiumMatch[1]);
    
    const carbMatch = text.match(/total\s+carbohydrate[:\s]+(\d+\.?\d*)\s*g/i);
    if (carbMatch) data.totalCarbs = parseFloat(carbMatch[1]);
    
    const fiberMatch = text.match(/dietary\s+fiber[:\s]+(\d+\.?\d*)\s*g/i);
    if (fiberMatch) data.dietaryFiber = parseFloat(fiberMatch[1]);
    
    const sugarMatch = text.match(/total\s+sugars[:\s]+(\d+\.?\d*)\s*g/i);
    if (sugarMatch) data.totalSugars = parseFloat(sugarMatch[1]);
    
    const addedSugarMatch = text.match(/added\s+sugars[:\s]+(\d+\.?\d*)\s*g/i);
    if (addedSugarMatch) data.addedSugars = parseFloat(addedSugarMatch[1]);
    
    const proteinMatch = text.match(/protein[:\s]+(\d+\.?\d*)\s*g/i);
    if (proteinMatch) data.protein = parseFloat(proteinMatch[1]);
    
    const vitDMatch = text.match(/vitamin\s+d[:\s]+(\d+\.?\d*)\s*(mcg|μg)/i);
    if (vitDMatch) data.vitaminD = parseFloat(vitDMatch[1]);
    
    const calciumMatch = text.match(/calcium[:\s]+(\d+\.?\d*)\s*mg/i);
    if (calciumMatch) data.calcium = parseFloat(calciumMatch[1]);
    
    const ironMatch = text.match(/iron[:\s]+(\d+\.?\d*)\s*mg/i);
    if (ironMatch) data.iron = parseFloat(ironMatch[1]);
    
    const potassiumMatch = text.match(/potassium[:\s]+(\d+\.?\d*)\s*mg/i);
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
            Reading nutrition label... This may take 20-30 seconds
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
              : 'Position entire nutrition label in frame'}
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