import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const FoodForm = ({ barcode, nutritionData, photoBlob, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    store: '',
    barcode: barcode || '',
    calories: nutritionData?.calories || 0,
    protein: nutritionData?.protein || 0,
    carbs: nutritionData?.carbs || 0,
    fat: nutritionData?.fat || 0
  });
  
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'brand' || name === 'store' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = null;

      if (photoBlob) {
        const fileName = `${Date.now()}_${formData.name.replace(/\s/g, '_')}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('nutrition-labels')
          .upload(fileName, photoBlob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('nutrition-labels')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('foods')
        .insert([
          {
            name: formData.name,
            brand: formData.brand,
            store: formData.store,
            barcode: formData.barcode,
            calories: formData.calories,
            protein: formData.protein,
            carbs: formData.carbs,
            fat: formData.fat,
            image_url: imageUrl
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

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-pink)' }}>
        Add Food Details
      </h3>

      <form onSubmit={handleSubmit}>
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
          <input
            type="text"
            name="barcode"
            className="input"
            value={formData.barcode}
            onChange={handleChange}
            placeholder="UPC/EAN code"
          />
        </div>

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
          <label className="input-label">Carbs (g)</label>
          <input
            type="number"
            name="carbs"
            className="input"
            value={formData.carbs}
            onChange={handleChange}
            step="0.1"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Fat (g)</label>
          <input
            type="number"
            name="fat"
            className="input"
            value={formData.fat}
            onChange={handleChange}
            step="0.1"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Food'}
        </button>
      </form>
    </div>
  );
};

export default FoodForm;