import React, { useState, useEffect } from 'react'
import Header from '../components/Header';
import { Download, Filter, TrendingUp, TrendingDown, IndianRupee, Edit2, Check, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';

const BalanceSheet = ({ setIsMobileOpen }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    fetchBalanceSheets();
  }, []);

  const fetchBalanceSheets = async () => {
    setLoading(true);
    const { data: sheets, error } = await supabase
      .from('balance_sheets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching balance sheets:', error);
    } else {
      setData(sheets || []);
    }
    setLoading(false);
  };

  const handleEdit = (index, value) => {
    setEditingIndex(index);
    setTempValue(value);
  };

  const handleSave = async (index) => {
    const row = data[index];
    const invested = parseFloat(tempValue) || 0;
    
    // Recalculate profit and closing balance based on the new investment
    const profit = row.sales - (row.expenses + invested);
    const closing = row.opening + profit;

    const { error } = await supabase
      .from('balance_sheets')
      .update({ 
        invested: invested,
        profit: profit,
        closing: closing
      })
      .eq('id', row.id);

    if (error) {
      alert('Error updating balance sheet: ' + error.message);
    } else {
      setEditingIndex(null);
      fetchBalanceSheets();
    }
  };

  const netProfit = data.reduce((acc, row) => acc + row.profit, 0);
  const currentAssets = data.length > 0 ? data[data.length - 1].closing : 0;

  return (
    <div className="balance-sheet-page">
      <Header title="Balance Sheet" setIsMobileOpen={setIsMobileOpen} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--primary)', color: 'white' }}>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Current Assets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(currentAssets)}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '12px', background: 'rgba(45, 80, 22, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Net Profit (YTD)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(netProfit)}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '12px', background: 'rgba(211, 47, 47, 0.1)', borderRadius: '12px', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Liabilities</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(0)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Financial Summary (2026)</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white' }}>
            <Filter size={18} /> Filter Years
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white' }}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Balance Sheet...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Opening Bal</th>
                  <th>Invested (Editable)</th>
                  <th>Total Sales</th>
                  <th>Expenses</th>
                  <th>Net Profit/Loss</th>
                  <th>Closing Bal</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? data.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600 }}>{row.month}</td>
                    <td>{formatCurrency(row.opening)}</td>
                    <td style={{ cursor: 'pointer' }}>
                      {editingIndex === idx ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input 
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            autoFocus
                            style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid var(--primary)' }}
                          />
                          <button onClick={() => handleSave(idx)} style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingIndex(null)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleEdit(idx, row.invested)}>
                          {formatCurrency(row.invested)}
                          <Edit2 size={12} style={{ opacity: 0.3 }} />
                        </div>
                      )}
                    </td>
                    <td>{formatCurrency(row.sales)}</td>
                    <td>{formatCurrency(row.expenses)}</td>
                    <td style={{ color: row.profit > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {row.profit > 0 ? '+' : ''}{formatCurrency(row.profit)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(row.closing)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      No financial data found in Supabase.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
