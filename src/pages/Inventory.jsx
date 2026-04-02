import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Plus, Trash2, Leaf, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';

const Inventory = ({ setIsMobileOpen }) => {
  const [teas, setTeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'Black Tea', price: '', stock: '', description: '', status: 'In Stock' });

  useEffect(() => {
    fetchTeas();
  }, []);

  const fetchTeas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tea_varieties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teas:', error);
    } else {
      setTeas(data || []);
    }
    setLoading(false);
  };

  const filteredTeas = filter === 'All' ? teas : teas.filter(t => t.category === filter);

  const handleOpenModal = () => {
    setFormData({ name: '', category: 'Black Tea', price: '', stock: '', description: '', status: 'In Stock' });
    setShowModal(true);
  };

  const handleSaveTea = async (e) => {
    e.preventDefault();
    const teaData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
    };

    const { error } = await supabase
      .from('tea_varieties')
      .insert([teaData]);

    if (error) {
      alert('Error saving tea: ' + error.message);
    } else {
      setShowModal(false);
      fetchTeas();
    }
  };

  const handleDeleteTea = async (id) => {
    if (window.confirm('Are you sure you want to delete this variety?')) {
      const { error } = await supabase
        .from('tea_varieties')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error deleting tea: ' + error.message);
      } else {
        fetchTeas();
      }
    }
  };

  return (
    <div className="inventory-page">
      <Header title="Tea Inventory" setIsMobileOpen={setIsMobileOpen} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['All', 'Black Tea', 'Green Tea', 'White Tea', 'Oolong', 'Herbal'].map(cat => (
            <button 
              key={cat}
              className={`btn btn-outline ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', background: filter === cat ? 'var(--primary)' : 'white', color: filter === cat ? 'white' : 'var(--primary)' }}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <Plus size={18} /> Add New Variety
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Inventory...</div>
      ) : (
        <div className="tea-grid">
          {filteredTeas.length > 0 ? filteredTeas.map((tea) => (
            <div key={tea.id} className="card tea-card">
              <div className="tea-image">
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1, display: 'flex', gap: '4px' }}>
                  <button 
                    className="btn-icon" 
                    onClick={() => handleDeleteTea(tea.id)}
                    style={{ background: 'white', borderRadius: '50%', padding: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: 'rgba(123, 74, 30, 0.1)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Leaf size={40} />
                </div>
              </div>
              <div className="tea-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{tea.name}</h3>
                  <span className={`tea-status-pill ${
                    tea.status === 'In Stock' ? 'status-in' : 
                    tea.status === 'Low Stock' ? 'status-low' : 'status-out'
                  }`}>
                    {tea.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', height: '40px', overflow: 'hidden' }}>
                  {tea.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock Quantity</div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{tea.stock} units</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price per unit</div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>{formatCurrency(tea.price)}</div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              No tea varieties found. Add your first one above!
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h2 style={{ fontSize: '1.5rem' }}>Add New Tea Variety</h2>
               <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSaveTea}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Tea Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Darjeeling Special"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option>Black Tea</option>
                    <option>Green Tea</option>
                    <option>White Tea</option>
                    <option>Oolong</option>
                    <option>Herbal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price (INR)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="250"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Stock Quantity</label>
                  <input 
                    type="number" 
                    required
                    placeholder="100"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option>In Stock</option>
                    <option>Low Stock</option>
                    <option>Out of Stock</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                <textarea 
                  placeholder="Short description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', height: '80px', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn">Add Variety</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
