import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure previous camera is released
    const timer = setTimeout(() => {
      startCamera();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setStream(mediaStream);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Cannot access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const checkBlur = (imageData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    
    const gray = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = gray.data;
    
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const value = pixels[i];
      sum += value;
      sumSq += value * value;
    }
    
    const count = pixels.length / 4;
    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    
    return variance > 500;
  };

  const capturePhoto = async () => {
    setCapturing(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const isSharp = checkBlur(imageData);
    
    if (!isSharp) {
      alert("⚠️ Image is blurry. Please retake with better focus.");
      setCapturing(false);
      return;
    }
    
    canvas.toBlob(async (blob) => {
      setProcessing(true);
      
      try {
        const result = await Tesseract.recognize(blob, 'eng', {
          logger: m => console.log(m)
        });
        
        const text = result.data.text;
        console.log("OCR Result:", text);
        
        const nutritionData = extractNutrition(text);
        
        onCapture(blob, nutritionData);
        stopCamera();
      } catch (err) {
        console.error("OCR Error:", err);
        alert("Failed to read label. Please try again.");
        setProcessing(false);
        setCapturing(false);
      }
    }, 'image/jpeg', 0.95);
  };

  const extractNutrition = (text) => {
    const data = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    const calMatch = text.match(/calories?\s*:?\s*(\d+)/i);
    if (calMatch) data.calories = parseInt(calMatch[1]);
    
    const proteinMatch = text.match(/protein\s*:?\s*(\d+\.?\d*)\s*g/i);
    if (proteinMatch) data.protein = parseFloat(proteinMatch[1]);
    
    const carbMatch = text.match(/carbohydrate|total carb|carbs?\s*:?\s*(\d+\.?\d*)\s*g/i);
    if (carbMatch) data.carbs = parseFloat(carbMatch[1]);
    
    const fatMatch = text.match(/total fat|fat\s*:?\s*(\d+\.?\d*)\s*g/i);
    if (fatMatch) data.fat = parseFloat(fatMatch[1]);
    
    return data;
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-pink)' }}>
        Capture Nutrition Label
      </h3>
      
      <div className="camera-viewport">
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="camera-overlay"></div>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {processing && (
        <div className="status-message status-loading">
          <div className="spinner"></div>
          Reading nutrition label...
        </div>
      )}
      
      {!processing && (
        <>
          <div className="status-message status-loading">
            Position nutrition label in frame
          </div>
          
          <button 
            className="btn btn-primary btn-full" 
            onClick={capturePhoto}
            disabled={capturing}
          >
            {capturing ? 'Capturing...' : 'Capture Photo'}
          </button>
          
          <button className="btn btn-secondary btn-full" onClick={onClose}>
            Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default CameraCapture;