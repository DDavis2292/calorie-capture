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
    let mounted = true;
    
    const initCamera = async () => {
      if (mounted) {
        await startCamera();
      }
    };
    
    initCamera();
    
    return () => {
      mounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 4032 },
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
    }, 'image/jpeg', 1.0);
  };

  const preprocessImage = async (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          
          const contrast = 2.0;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          let value = factor * (avg - 128) + 128;
          
          value = value > 128 ? 255 : 0;
          
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob(resolve, 'image/jpeg', 1.0);
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const confirmPhoto = async () => {
    stopCamera();
    
    if (captureType === 'product') {
      onCapture(photo.blob);
      return;
    }
    
    if (captureType === 'nutrition') {
      setProcessing(true);
      
      try {
        console.log("Starting OCR with preprocessing...");
        
        const processedBlob = await preprocessImage(photo.blob);
        
        const result = await Tesseract.recognize(processedBlob, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,%:g()',
        });
        
        const text = result.data.text;
        console.log("=== RAW OCR TEXT ===");
        console.log(text);
        console.log("===================");
        
        setOcrText(text);
        
        const nutritionData = extractNutrition(text);
        console.log("Extracted nutrition:", nutritionData);
        
        onCapture(photo.blob, nutritionData);
      } catch (err) {
        console.error("OCR Error:", err);
        alert("OCR failed. You can enter values manually.");
        onCapture(photo.blob, {});
      }
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
    
    const findValue = (keywords, unit = '') => {
      for (const keyword of keywords) {
        const pattern1 = new RegExp(keyword + '[\\s:]*([0-9]+\\.?[0-9]*)\\s*' + unit, 'i');
        const match1 = text.match(pattern1);
        if (match1) return parseFloat(match1[1]);
        
        const pattern2 = new RegExp(keyword + '[:\\s]+([0-9]+\\.?[0-9]*)', 'i');
        const match2 = text.match(pattern2);
        if (match2) return parseFloat(match2[1]);
        
        const pattern3 = new RegExp('([0-9]+\\.?[0-9]*)\\s*' + unit + '?\\s*' + keyword, 'i');
        const match3 = text.match(pattern3);
        if (match3) return parseFloat(match3[1]);
      }
      return null;
    };
    
    const servingMatch = text.match(/serving\s*size[:\s]*([^\n]{5,40})/i);
    if (servingMatch) data.servingSize = servingMatch[1].trim();
    
    const cal = findValue(['calories', 'calorie', 'cal']);
    if (cal !== null) data.calories = cal;
    
    const fat = findValue(['total\\s*fat', 'fat'], 'g');
    if (fat !== null) data.totalFat = fat;
    
    const satFat = findValue(['saturated\\s*fat', 'sat\\.?\\s*fat'], 'g');
    if (satFat !== null) data.saturatedFat = satFat;
    
    const transFat = findValue(['trans\\s*fat'], 'g');
    if (transFat !== null) data.transFat = transFat;
    
    const chol = findValue(['cholesterol', 'chol'], 'mg');
    if (chol !== null) data.cholesterol = chol;
    
    const sodium = findValue(['sodium'], 'mg');
    if (sodium !== null) data.sodium = sodium;
    
    const carbs = findValue(['total\\s*carbohydrate', 'carbohydrate', 'carbs'], 'g');
    if (carbs !== null) data.totalCarbs = carbs;
    
    const fiber = findValue(['dietary\\s*fiber', 'fiber'], 'g');
    if (fiber !== null) data.dietaryFiber = fiber;
    
    const sugars = findValue(['total\\s*sugars', 'sugars'], 'g');
    if (sugars !== null) data.totalSugars = sugars;
    
    const addedSugars = findValue(['added\\s*sugars', 'includes.*added\\s*sugar'], 'g');
    if (addedSugars !== null) data.addedSugars = addedSugars;
    
    const protein = findValue(['protein'], 'g');
    if (protein !== null) data.protein = protein;
    
    const vitD = findValue(['vitamin\\s*d'], '(mcg|μg|ug)');
    if (vitD !== null) data.vitaminD = vitD;
    
    const calcium = findValue(['calcium'], 'mg');
    if (calcium !== null) data.calcium = calcium;
    
    const iron = findValue(['iron'], 'mg');
    if (iron !== null) data.iron = iron;
    
    const potassium = findValue(['potassium'], 'mg');
    if (potassium !== null) data.potassium = potassium;
    
    return data;
  };

  const retakePhoto = () => {
    URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setOcrText('');
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
              : 'Get CLOSE to label - fill the entire frame'}
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