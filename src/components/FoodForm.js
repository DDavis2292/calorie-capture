import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import CameraCapture from './CameraCapture';

const FoodForm = ({ initialBarcode, onComplete, onCancel, onScanBarcode }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    store: '',
    barcode: initialBarcode || '',
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
  });
  
  const [productPhoto, setProductPhoto] = useState(null);
  const [nutritionPhoto, setNutritionPhoto] = useState(null);
  const [showNutritionCamera, setShowNutritionCamera] = useState(false);
  const [showProductCamera, setShowProductCamera] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumberField = !['name', 'brand', 'store', 'barcode', 'servingSize'].includes(name);
    setFormData(prev => ({
      ...prev,
      [name]: isNumberField ? parseFloat(value) || 0 : value
    }));
  };

  const handleNutritionPhotoCapture = (photoBlob, nutritionData) => {
    setNutritionPhoto(photoBlob);
    setShowNutritionCamera(false);
    
    // Auto-fill nutrition data from OCR
    if (nutritionData) {
      setFormData(prev => ({
        ...prev,
        servingSize: nutritionData.servingSize || prev.servingSize,
        calories: nutritionData.calories || prev.calories,
        totalFat: nutritionData.totalFat || prev.totalFat,
        saturatedFat: nutritionData.saturatedFat || prev.saturatedFat,
        transFat: nutritionData.transFat || prev.transFat,
        cholesterol: nutritionData.cholesterol || prev.cholesterol,
        sodium: nutritionData.sodium || prev.sodium,
        totalCarbs: nutritionData.totalCarbs || prev.totalCarbs,
        dietaryFiber: nutritionData.dietaryFiber || prev.dietaryFiber,
        totalSugars: nutritionData.totalSugars || prev.totalSugars,
        addedSugars: nutritionData.addedSugars || prev.addedSugars,
        protein: nutritionData.protein || prev.protein,
        vitaminD: nutritionData.vitaminD || prev.vitaminD,
        calcium: nutritionData.calcium || prev.calcium,
        iron: nutritionData.iron || prev.iron,
        potassium: nutritionData.potassium || prev.potassium
      }));
    }
  };

  const handleProductPhotoCapture = (photoBlob) => {
    setProductPhoto(photoBlob);
    setShowProductCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let productImageUrl = null;
      let nutritionImageUrl = null;

      // Upload product photo
      if (productPhoto) {
        const productFileName = `${Date.now()}_product_${formData.name.replace(/\s/g, '_')}.jpg`;
        const { error: productUploadError } = await supabase.storage
          .from('nutrition-labels')
          .upload(productFileName, productPhoto);

        if (productUploadError) throw productUploadError;

        const { data: { publicUrl: productUrl } } = supabase.storage
          .from('nutrition-labels')
          .getPublicUrl(productFileName);

        productImageUrl = productUrl;
      }

      // Upload nutrition label photo
      if (nutritionPhoto) {
        const nutritionFileName = `${Date.now()}_nutrition_${formData.name.replace(/\s/g, '_')}.jpg`;
        const { error: nutritionUploadError } = await supabase.storage
          .from('nutrition-labels')
          .upload(nutritionFileName, nutritionPhoto);

        if (nutritionUploadError) throw nutritionUploadError;

        const { data: { publicUrl: nutritionUrl } } = supabase.storage
          .from('nutrition-labels')
          .getPublicUrl(nutritionFileName);

        nutritionImageUrl = nutritionUrl;
      }

      // Insert food data
      const { error } = await supabase
        .from('foods')
        .insert([
          {
            name: formData.name,
            brand: formData.brand,
            store: formData.store,
            barcode: formData.barcode,
            serving_size: formData.servingSize,
            calories: formData.calories,
            total_fat: formData.totalFat,
            saturated_fat: formData.saturatedFat,
            trans_fat: formData.transFat,
            cholesterol: formData.cholesterol,
            sodium: formData.sodium,
            total_carbs: formData.totalCarbs,
            dietary_fiber: formData.dietaryFiber,
            total_sugars: formData.totalSugars,
            added_sugars: formData.addedSugars,
            protein: formData.protein,
            vitamin_d: formData.vitaminD,
            calcium: formData.calcium,
            iron: formData.iron,
            potassium: formData.potassium,
            product_image_url: productImageUrl,
            nutrition_image_url: nutritionImageUrl
          }
        ]);

      if (error) throw error;

      alert('✅ Food saved successfully!');
      onComplete();
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Failed to save food: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (showNutritionCamera) {
    return (
      <CameraCapture
        captureType="nutrition"
        onCapture={handleNutritionPhotoCapture}
        onClose={() => setShowNutritionCamera(false)}
      />
    );
  }

  if (showProductCamera) {
    return (
      <CameraCapture
        captureType="product"
        onCapture={handleProductPhotoCapture}
        onClose={() => setShowProductCamera(false)}
      />
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-blue)' }}>
        Add Food Details
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="input-group">
          <label className="input-label">Product Name *</label>
          <input
            type="text"
            name="name"
            className="input"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Quest Protein Bar"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Brand</label>
          <input
            type="text"
            name="brand"
            className="input"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g., Quest Nutrition"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Store *</label>
          <input
            type="text"
            name="store"
            className="input"
            value={formData.store}
            onChange={handleChange}
            placeholder="e.g., Target, Whole Foods"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Barcode</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="barcode"
              className="input"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="UPC/EAN code"
            />
            <button 
              type="button"
              className="btn btn-icon btn-secondary"
              onClick={onScanBarcode}
            >
              📷
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Serving Size</label>
          <input
            type="text"
            name="servingSize"
            className="input"
            value={formData.servingSize}
            onChange={handleChange}
            placeholder="e.g., 1 bar (60g)"
          />
        </div>

        {/* Nutrition Label Scanner */}
        <h4 className="section-header">Nutrition Facts</h4>
        
        <button 
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => setShowNutritionCamera(true)}
        >
          📷 {nutritionPhoto ? 'Retake Nutrition Label' : 'Scan Nutrition Label'}
        </button>
        
        {nutritionPhoto && (
          <div className="status-message status-success">
            ✓ Nutrition label photo captured
          </div>
        )}

        {/* Nutrition Fields */}
        <div className="input-group">
          <label className="input-label">Calories</label>
          <input
            type="number"
            name="calories"
            className="input"
            value={formData.calories}
            onChange={handleChange}
            step="1"
          />
        </div>

        <div className="nutrition-grid">
          <div className="input-group">
            <label className="input-label">Total Fat (g)</label>
            <input
              type="number"
              name="totalFat"
              className="input"
              value={formData.totalFat}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Saturated Fat (g)</label>
            <input
              type="number"
              name="saturatedFat"
              className="input"
              value={formData.saturatedFat}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Trans Fat (g)</label>
            <input
              type="number"
              name="transFat"
              className="input"
              value={formData.transFat}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Cholesterol (mg)</label>
            <input
              type="number"
              name="cholesterol"
              className="input"
              value={formData.cholesterol}
              onChange={handleChange}
              step="1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Sodium (mg)</label>
            <input
              type="number"
              name="sodium"
              className="input"
              value={formData.sodium}
              onChange={handleChange}
              step="1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Total Carbs (g)</label>
            <input
              type="number"
              name="totalCarbs"
              className="input"
              value={formData.totalCarbs}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Dietary Fiber (g)</label>
            <input
              type="number"
              name="dietaryFiber"
              className="input"
              value={formData.dietaryFiber}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Total Sugars (g)</label>
            <input
              type="number"
              name="totalSugars"
              className="input"
              value={formData.totalSugars}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Added Sugars (g)</label>
            <input
              type="number"
              name="addedSugars"
              className="input"
              value={formData.addedSugars}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Protein (g)</label>
            <input
              type="number"
              name="protein"
              className="input"
              value={formData.protein}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Vitamin D (mcg)</label>
            <input
              type="number"
              name="vitaminD"
              className="input"
              value={formData.vitaminD}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Calcium (mg)</label>
            <input
              type="number"
              name="calcium"
              className="input"
              value={formData.calcium}
              onChange={handleChange}
              step="1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Iron (mg)</label>
            <input
              type="number"
              name="iron"
              className="input"
              value={formData.iron}
              onChange={handleChange}
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Potassium (mg)</label>
            <input
              type="number"
              name="potassium"
              className="input"
              value={formData.potassium}
              onChange={handleChange}
              step="1"
            />
          </div>
        </div>

        {/* Product Photo */}
        <h4 className="section-header">Product Photo</h4>
        
        <button 
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => setShowProductCamera(true)}
        >
          📷 {productPhoto ? 'Retake Product Photo' : 'Add Product Photo'}
        </button>
        
        {productPhoto && (
          <div className="status-message status-success">
            ✓ Product photo captured
          </div>
        )}

        {/* Action Buttons */}
        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={saving}
          style={{ marginTop: '32px' }}
        >
          {saving ? 'Saving...' : '💾 Save Food'}
        </button>

        <button 
          type="button"
          className="btn btn-secondary btn-full"
          onClick={onCancel}
        >
          ← Back to Home
        </button>
      </form>
    </div>
  );
};

export default FoodForm;