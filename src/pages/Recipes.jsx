import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Book, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Recipes = ({ setIsMobileOpen }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', notes: '', baseTeas: [{ name: '', proportion: 100 }] });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    setFormData({ name: '', notes: '', baseTeas: [{ name: '', proportion: 100 }] });
    setShowModal(true);
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    const recipeData = {
      name: formData.name,
      notes: formData.notes,
      composition: formData.baseTeas
    };

    const { error } = await supabase
      .from('recipes')
      .insert([recipeData]);

    if (error) {
      alert('Error saving recipe: ' + error.message);
    } else {
      setShowModal(false);
      fetchRecipes();
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (window.confirm('Delete this blend recipe?')) {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error deleting recipe: ' + error.message);
      } else {
        fetchRecipes();
      }
    }
  };

  return (
    <div className="recipes-page">
      <Header title="Master Blends" setIsMobileOpen={setIsMobileOpen} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Curated artisan tea blends and composition details.</p>
        <button className="btn" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add New Blend
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Master Blends...</div>
      ) : (
        <div className="tea-grid">
          {recipes.length > 0 ? recipes.map((recipe) => (
            <div key={recipe.id} className="card tea-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: '8px', color: 'var(--primary)' }}>
                    < Book size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem' }}>{recipe.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => handleDeleteRecipe(recipe.id)}>
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                "{recipe.notes}"
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>Composition</div>
                <div style={{ height: '32px', width: '100%', display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                  {(recipe.composition || []).map((tea, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        width: `${tea.proportion}%`, 
                        background: idx % 2 === 0 ? 'var(--primary)' : 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: idx % 2 === 0 ? 'white' : 'var(--primary)',
                        fontSize: '0.625rem',
                        fontWeight: 700
                      }}
                    >
                      {tea.proportion}%
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {(recipe.composition || []).map((tea, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: idx % 2 === 0 ? 'var(--primary)' : 'var(--primary-light)' }}></div>
                      <span style={{ fontWeight: 600 }}>{tea.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.875rem' }}>
                  View Full Details
                </button>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              No master blends found. Create your first blend!
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h2 style={{ fontSize: '1.5rem' }}>Add New Blend</h2>
               <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSaveRecipe}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Blend Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Primary Ingredient</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Royal Assam Gold (100%)"
                  value={formData.baseTeas[0].name}
                  onChange={(e) => setFormData({...formData, baseTeas: [{ name: e.target.value, proportion: 100 }]})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description / Notes</label>
                <textarea 
                   rows="3"
                   value={formData.notes}
                   onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn">Save Blend</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
