import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onCapture, onClose, captureType }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
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
    // Stop any existing streams first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      // Wait for video to be ready
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
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

  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Increase contrast
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const value = factor * (avg - 128) + 128;
      
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const capturePhoto = async () => {
    setCapturing(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!video || !canvas) {
      alert("Camera not ready. Please try again.");
      setCapturing(false);
      return;
    }
    
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Create original photo blob
    const originalBlob = await new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
    });
    
    // For nutrition labels, do OCR
    if (captureType === 'nutrition') {
      setProcessing(true);
      
      try {
        // Preprocess for better OCR
        const processedCanvas = document.createElement('canvas');
        processedCanvas.width = canvas.width;
        processedCanvas.height = canvas.height;
        const processedCtx = processedCanvas.getContext('2d');
        processedCtx.drawImage(canvas, 0, 0);
        preprocessImage(processedCanvas);
        
        const processedBlob = await new Promise(resolve => {
          processedCanvas.toBlob(blob => resolve(blob), 'image/jpeg', 1.0);
        });
        
        const result = await Tesseract.recognize(processedBlob, 'eng', {
          logger: m => console.log(m)
        });
        
        const text = result.data.text;
        console.log("OCR Result:", text);
        
        const nutritionData = extractNutrition(text);
        
        onCapture(originalBlob, nutritionData);
        stopCamera();
      } catch (err) {
        console.error("OCR Error:", err);
        alert("Failed to read label. You can enter values manually.");
        onCapture(originalBlob, {});
        stopCamera();
      }
    } else {
      // For product photo, just return the image
      onCapture(originalBlob, null);
      stopCamera();
    }
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
    
    // Serving size
    const servingMatch = text.match(/serving\s+size[:\s]+([^\n]+)/i);
    if (servingMatch) data.servingSize = servingMatch[1].trim();
    
    // Calories
    const calMatch = text.match(/calories[:\s]+(\d+)/i);
    if (calMatch) data.calories = parseInt(calMatch[1]);
    
    // Total Fat
    const totalFatMatch = text.match(/total\s+fat[:\s]+(\d+\.?\d*)\s*g/i);
    if (totalFatMatch) data.totalFat = parseFloat(totalFatMatch[1]);
    
    // Saturated Fat
    const satFatMatch = text.match(/saturated\s+fat[:\s]+(\d+\.?\d*)\s*g/i);
    if (satFatMatch) data.saturatedFat = parseFloat(satFatMatch[1]);
    
    // Trans Fat
    const transFatMatch = text.match(/trans\s+fat[:\s]+(\d+\.?\d*)\s*g/i);
    if (transFatMatch) data.transFat = parseFloat(transFatMatch[1]);
    
    // Cholesterol
    const cholMatch = text.match(/cholesterol[:\s]+(\d+\.?\d*)\s*mg/i);
    if (cholMatch) data.cholesterol = parseFloat(cholMatch[1]);
    
    // Sodium
    const sodiumMatch = text.match(/sodium[:\s]+(\d+\.?\d*)\s*mg/i);
    if (sodiumMatch) data.sodium = parseFloat(sodiumMatch[1]);
    
    // Total Carbohydrate
    const carbMatch = text.match(/total\s+carbohydrate[:\s]+(\d+\.?\d*)\s*g/i);
    if (carbMatch) data.totalCarbs = parseFloat(carbMatch[1]);
    
    // Dietary Fiber
    const fiberMatch = text.match(/dietary\s+fiber[:\s]+(\d+\.?\d*)\s*g/i);
    if (fiberMatch) data.dietaryFiber = parseFloat(fiberMatch[1]);
    
    // Total Sugars
    const sugarMatch = text.match(/total\s+sugars[:\s]+(\d+\.?\d*)\s*g/i);
    if (sugarMatch) data.totalSugars = parseFloat(sugarMatch[1]);
    
    // Added Sugars
    const addedSugarMatch = text.match(/added\s+sugars[:\s]+(\d+\.?\d*)\s*g/i);
    if (addedSugarMatch) data.addedSugars = parseFloat(addedSugarMatch[1]);
    
    // Protein
    const proteinMatch = text.match(/protein[:\s]+(\d+\.?\d*)\s*g/i);
    if (proteinMatch) data.protein = parseFloat(proteinMatch[1]);
    
    // Vitamin D
    const vitDMatch = text.match(/vitamin\s+d[:\s]+(\d+\.?\d*)\s*(mcg|μg)/i);
    if (vitDMatch) data.vitaminD = parseFloat(vitDMatch[1]);
    
    // Calcium
    const calciumMatch = text.match(/calcium[:\s]+(\d+\.?\d*)\s*mg/i);
    if (calciumMatch) data.calcium = parseFloat(calciumMatch[1]);
    
    // Iron
    const ironMatch = text.match(/iron[:\s]+(\d+\.?\d*)\s*mg/i);
    if (ironMatch) data.iron = parseFloat(ironMatch[1]);
    
    // Potassium
    const potassiumMatch = text.match(/potassium[:\s]+(\d+\.?\d*)\s*mg/i);
    if (potassiumMatch) data.potassium = parseFloat(potassiumMatch[1]);
    
    return data;
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-pink)' }}>
        {captureType === 'product' ? 'Capture Product Photo' : 'Capture Nutrition Label'}
      </h3>
      
      <div className="camera-viewport-large">
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="camera-overlay-vertical"></div>
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
            {captureType === 'product' 
              ? 'Center product in frame' 
              : 'Position entire nutrition label in frame'}
          </div>
          
          <button 
            className="btn btn-primary btn-full" 
            onClick={capturePhoto}
            disabled={capturing}
          >
            {capturing ? 'Capturing...' : '📷 Capture Photo'}
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