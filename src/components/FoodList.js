import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
    } catch (err) {
      console.error('Load error:', err);
      alert('Failed to load foods: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFood = async (id) => {
    if (!window.confirm('Delete this food item?')) return;

    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFoods(foods.filter(f => f.id !== id));
      alert('✅ Food deleted');
    } catch (err) {
      console.error('Delete error:', err);
      alert('❌ Failed to delete: ' + err.message);
    }
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (food.brand && food.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (food.store && food.store.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="card">
        <div className="spinner"></div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading your food database...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">Search Your Foods</label>
          <input
            type="text"
            className="input"
            placeholder="Search by name, brand, or store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredFoods.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No foods found</h3>
          <p style={{ marginTop: '8px' }}>
            {searchQuery ? 'Try a different search term' : 'Start scanning to build your database!'}
          </p>
        </div>
      ) : (
        <div className="food-list">
          {filteredFoods.map(food => (
            <div key={food.id} className="food-item">
              <div className="food-name">{food.name}</div>
              
              {food.brand && (
                <div className="food-brand">{food.brand}</div>
              )}
              
              {food.store && (
                <div className="food-store">📍 {food.store}</div>
              )}
              
              {food.barcode && (
                <div className="food-store">🔢 {food.barcode}</div>
              )}

              <div className="food-macros">
                <div className="macro-badge">
                  <div className="macro-value">{Math.round(food.calories)}</div>
                  <div className="macro-label">Cal</div>
                </div>
                <div className="macro-badge">
                  <div className="macro-value">{Math.round(food.carbs)}</div>
                  <div className="macro-label">Carbs</div>
                </div>
                <div className="macro-badge">
                  <div className="macro-value">{Math.round(food.protein)}</div>
                  <div className="macro-label">Protein</div>
                </div>
                <div className="macro-badge">
                  <div className="macro-value">{Math.round(food.fat)}</div>
                  <div className="macro-label">Fat</div>
                </div>
              </div>

              {food.image_url && (
                <img 
                  src={food.image_url} 
                  alt={food.name}
                  className="food-image"
                />
              )}

              <button 
                className="btn btn-secondary btn-full delete-btn"
                onClick={() => deleteFood(food.id)}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodList;