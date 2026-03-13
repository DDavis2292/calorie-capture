import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onCapture, onClose, captureType }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: { 
    facingMode: 'environment',
    width: { ideal: 4032 },   // Higher resolution
    height: { ideal: 3024 },
    zoom: true                 // Enable zoom if supported
  }
});
        
        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                setCameraReady(true);
              }).catch(err => {
                console.error("Video play error:", err);
              });
            }
          };
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Cannot access camera. Please check permissions.");
      }
    };
    
    // Small delay to ensure cleanup from previous component
    const timer = setTimeout(() => {
      initCamera();
    }, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const detectAndRotateImage = async (canvas) => {
    // Get device orientation
    const orientation = window.screen.orientation?.angle || 0;
    
    // Create a new canvas for rotation
    const rotatedCanvas = document.createElement('canvas');
    const ctx = rotatedCanvas.getContext('2d');
    
    // Determine rotation based on device orientation
    let rotationAngle = 0;
    if (orientation === 90) rotationAngle = -90;
    if (orientation === 270) rotationAngle = 90;
    if (orientation === 180) rotationAngle = 180;
    
    if (rotationAngle === 0) {
      return canvas; // No rotation needed
    }
    
    // Set canvas size based on rotation
    if (Math.abs(rotationAngle) === 90) {
      rotatedCanvas.width = canvas.height;
      rotatedCanvas.height = canvas.width;
    } else {
      rotatedCanvas.width = canvas.width;
      rotatedCanvas.height = canvas.height;
    }
    
    // Apply rotation
    ctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    return rotatedCanvas;
  };

  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const value = Math.max(0, Math.min(255, factor * (avg - 128) + 128));
      
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const capturePhoto = async (skipOCR = false) => {
  if (!cameraReady) {
    alert("Camera is not ready. Please wait.");
    return;
  }
  
  setCapturing(true);
  
  const canvas = canvasRef.current;
  const video = videoRef.current;
  
  if (!video || !canvas || !video.videoWidth) {
    alert("Camera not ready. Please try again.");
    setCapturing(false);
    return;
  }
  
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  
  // Only rotate for nutrition labels (product photos don't need it)
  let finalCanvas = canvas;
  if (captureType === 'nutrition') {
    finalCanvas = await detectAndRotateImage(canvas);
  }
  
  // Create original photo blob
  const originalBlob = await new Promise(resolve => {
    finalCanvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
  });
  
  if (!originalBlob) {
    alert("Failed to capture photo. Please try again.");
    setCapturing(false);
    return;
  }
  
  // For nutrition labels, do OCR (unless skipped)
  if (captureType === 'nutrition' && !skipOCR) {
    setProcessing(true);
    
    try {
      const processedCanvas = document.createElement('canvas');
      processedCanvas.width = finalCanvas.width;
      processedCanvas.height = finalCanvas.height;
      const processedCtx = processedCanvas.getContext('2d');
      processedCtx.drawImage(finalCanvas, 0, 0);
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
    // For product photo or skipped OCR, just return the image immediately
    onCapture(originalBlob, captureType === 'nutrition' ? {} : null);
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

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-pink)' }}>
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
      
      <div className="camera-viewport-large">
  <video 
    ref={videoRef} 
    autoPlay 
    playsInline 
    muted
    style={{ 
      width: '100%', 
      height: '100%', 
      objectFit: 'cover',
      transform: 'scale(1.2)'  // Zoom in 20% by default
    }} 
  />
  <div className="camera-overlay-vertical"></div>
</div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {cameraReady && !processing && (
  <>
    <div className="status-message status-loading">
      {captureType === 'product' 
        ? 'Center product in frame (horizontal or vertical)' 
        : 'Position entire nutrition label in frame'}
    </div>
    
    <button 
      className="btn btn-primary btn-full" 
      onClick={() => capturePhoto(false)}
      disabled={capturing || !cameraReady}
    >
      {capturing ? 'CAPTURING...' : '📷 CAPTURE & READ LABEL'}
    </button>
    
    {captureType === 'nutrition' && (
      <button 
        className="btn btn-secondary btn-full" 
        onClick={() => capturePhoto(true)}
        disabled={capturing || !cameraReady}
      >
        📷 CAPTURE ONLY (Enter Manually)
      </button>
    )}
    
    <button className="btn btn-secondary btn-full" onClick={() => {
      stopCamera();
      onClose();
    }}>
      CANCEL
    </button>
  </>
)}
    </div>
  );
};

export default CameraCapture;