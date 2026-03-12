import React, { useRef, useState, useEffect, useCallback } from 'react';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = async () => {
    setCapturing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      setProcessing(true);
      try {
        const result = await Tesseract.recognize(blob, 'eng');
        const nutritionData = extractNutrition(result.data.text);
        onCapture(blob, nutritionData);
        stopCamera();
      } catch (err) {
        setProcessing(false);
        setCapturing(false);
      }
    }, 'image/jpeg', 0.95);
  };

  const extractNutrition = (text) => {
    const data = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const calMatch = text.match(/calories?\s*:?\s*(\d+)/i);
    if (calMatch) data.calories = parseInt(calMatch[1]);
    return data;
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-pink)' }}>Capture Label</h3>
      <div className="camera-viewport">
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!processing ? (
        <>
          <button className="btn btn-primary btn-full" onClick={capturePhoto} disabled={capturing}>
            {capturing ? 'Capturing...' : 'Capture Photo'}
          </button>
          <button className="btn btn-secondary btn-full" onClick={onClose}>Cancel</button>
        </>
      ) : (
        <div className="status-message status-loading">Processing...</div>
      )}
    </div>
  );
};

export default CameraCapture;