import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Search, UserPlus, CheckCircle, Clock, AlertCircle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';

const Customers = ({ setIsMobileOpen }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', status: 'Paid', totalAmount: '', pendingAmount: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Paid': return <CheckCircle size={18} color="var(--success)" />;
      case 'Pending': return <Clock size={18} color="rgba(123, 74, 30, 0.4)" />;
      case 'Partial': return <AlertCircle size={18} color="var(--warning)" />;
      default: return null;
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const total = parseFloat(newCustomer.totalAmount) || 0;
    const pending = newCustomer.status === 'Paid' ? 0 : (parseFloat(newCustomer.pendingAmount) || total);
    
    const customerData = {
      name: newCustomer.name,
      total_amount: total,
      amount_paid: total - pending,
      pending_balance: pending,
      status: pending === 0 ? 'Paid' : (pending === total ? 'Pending' : 'Partial'),
      last_purchase: new Date().toISOString()
    };

    const { error } = await supabase
      .from('customers')
      .insert([customerData]);

    if (error) {
      alert('Error adding customer: ' + error.message);
    } else {
      setShowAddModal(false);
      setNewCustomer({ name: '', status: 'Paid', totalAmount: '', pendingAmount: '' });
      fetchCustomers();
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Delete this customer record?')) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error deleting customer: ' + error.message);
      } else {
        fetchCustomers();
      }
    }
  };

  const handleStatusChange = async (customer, newStatus) => {
    let amountPaid = customer.amount_paid;
    let pending = customer.pending_balance;
    
    if (newStatus === 'Paid') {
      amountPaid = customer.total_amount;
      pending = 0;
    } else if (newStatus === 'Pending') {
      amountPaid = 0;
      pending = customer.total_amount;
    }

    const { error } = await supabase
      .from('customers')
      .update({ 
        status: pending === 0 ? 'Paid' : (pending === customer.total_amount ? 'Pending' : 'Partial'),
        amount_paid: amountPaid,
        pending_balance: pending
      })
      .eq('id', customer.id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      fetchCustomers();
    }
  };

  return (
    <div className="customers-page">
      <Header title="Our Customers" setIsMobileOpen={setIsMobileOpen} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', width: '60%' }}>
          <div className="search-bar" style={{ flex: 1, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by customer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', background: 'white' }}
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Partial</option>
          </select>
        </div>
        <button className="btn" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} /> Add New Customer
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Customers...</div>
        ) : (
          <>
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Total Order</th>
                    <th>Pending Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem' }}>
                            {customer.name?.charAt(0)}
                          </div>
                          <div style={{ fontWeight: 600 }}>{customer.name}</div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(customer.total_amount)}</td>
                      <td style={{ color: customer.pending_balance > 0 ? 'var(--danger)' : 'inherit', fontWeight: 600 }}>
                        {customer.pending_balance > 0 ? formatCurrency(customer.pending_balance) : 'Settled'}
                      </td>
                      <td>
                        <select 
                          value={customer.status}
                          onChange={(e) => handleStatusChange(customer, e.target.value)}
                          style={{ 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(0,0,0,0.1)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: 'transparent',
                            cursor: 'pointer',
                            color: customer.status === 'Paid' ? 'var(--success)' : (customer.status === 'Partial' ? 'var(--warning)' : 'var(--text-muted)')
                          }}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Partial">Partial</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => handleDeleteCustomer(customer.id)}>
                            <Trash2 size={18} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        No customers found. Register your first customer above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-only mobile-grid">
              {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                <div key={customer.id} className="mobile-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: '1rem' }}>
                      {customer.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{customer.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                        {getStatusIcon(customer.status)}
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>{customer.status}</span>
                      </div>
                    </div>
                    <button className="btn-icon" onClick={() => handleDeleteCustomer(customer.id)}>
                      <Trash2 size={18} color="var(--danger)" />
                    </button>
                  </div>

                  <div className="mobile-card-row">
                    <span className="mobile-label">Total Bills</span>
                    <span className="mobile-value">{formatCurrency(customer.total_amount)}</span>
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-label">Pending</span>
                    <span className="mobile-value" style={{ color: customer.pending_balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {customer.pending_balance > 0 ? formatCurrency(customer.pending_balance) : 'Settled'}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <label className="mobile-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Update Payment Status</label>
                    <select 
                      value={customer.status}
                      onChange={(e) => handleStatusChange(customer, e.target.value)}
                      className="btn btn-outline"
                      style={{ 
                        width: '100%',
                        padding: '0.75rem', 
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(0,0,0,0.08)'
                      }}
                    >
                      <option value="Paid">Mark as Paid Fully</option>
                      <option value="Pending">Mark as Fully Pending</option>
                      <option value="Partial">Mark as Partially Paid</option>
                    </select>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  No customers found. Register your first customer above!
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Register Customer</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Customer Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Full Name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Total Bill (INR)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="0"
                    value={newCustomer.totalAmount}
                    onChange={(e) => setNewCustomer({...newCustomer, totalAmount: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Initial Status</label>
                  <select 
                    value={newCustomer.status}
                    onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="Paid">Paid Fully</option>
                    <option value="Partial">Partial Pay</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {(newCustomer.status === 'Partial' || newCustomer.status === 'Pending') && (
                <div style={{ marginBottom: '1.25rem' }}>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Pending Amount (INR)</label>
                   <input 
                     type="number" 
                     placeholder={newCustomer.status === 'Pending' ? newCustomer.totalAmount : "0"}
                     value={newCustomer.pendingAmount}
                     onChange={(e) => setNewCustomer({...newCustomer, pendingAmount: e.target.value})}
                     style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                   />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
