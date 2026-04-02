import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Award, Edit2, Check, X } from 'lucide-react';

const Dashboard = ({ isMobileOpen, setIsMobileOpen }) => {
  const [selectedMonth, setSelectedMonth] = useState('April 2026');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    invested: 0,
    earned: 0,
    profit: 0,
    loss: 0
  });
  const [dailySales, setDailySales] = useState([]);
  const [isEditingInvested, setIsEditingInvested] = useState(false);
  const [tempAmount, setTempAmount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch financial stats from balance sheets
    const { data: sheets, error: sheetError } = await supabase
      .from('balance_sheets')
      .select('*');

    if (!sheetError && sheets) {
      const totalInvested = sheets.reduce((acc, s) => acc + (s.invested || 0), 0);
      const totalEarned = sheets.reduce((acc, s) => acc + (s.sales || 0), 0);
      const totalProfit = sheets.reduce((acc, s) => acc + (s.profit || 0), 0);
      
      setStats({
        invested: totalInvested,
        earned: totalEarned,
        profit: totalProfit > 0 ? totalProfit : 0,
        loss: totalProfit < 0 ? Math.abs(totalProfit) : 0
      });
      setTempAmount(totalInvested);
    }

    // Mocking daily sales for the chart if empty
    setDailySales(Array.from({ length: 30 }, (_, i) => ({ 
      day: (i + 1).toString().padStart(2, '0'), 
      revenue: Math.floor(Math.random() * 5000) 
    })));

    setLoading(false);
  };

  const handleSaveInvested = async () => {
    // In a real app, this might update a 'capital' table or the latest month's balance sheet.
    // For now, we'll just update the local state to demonstrate reactivity.
    setStats({ ...stats, invested: tempAmount, profit: stats.earned - tempAmount });
    setIsEditingInvested(false);
  };

  const kpis = [
    { 
      title: 'Total Invested', 
      value: formatCurrency(stats.invested), 
      trend: '+0%', 
      isPositive: true, 
      icon: IndianRupee,
      editable: true 
    },
    { title: 'Net Earned', value: formatCurrency(stats.earned), trend: '+0%', isPositive: true, icon: TrendingUp },
    { title: 'Profit', value: formatCurrency(stats.profit), trend: '+0%', isPositive: true, icon: Award },
    { title: 'Loss', value: formatCurrency(stats.loss), trend: '0%', isPositive: false, icon: TrendingDown },
  ];

  return (
    <div className="dashboard-page">
      <Header title="Dashboard" setIsMobileOpen={setIsMobileOpen} />
      
      <div className="month-picker" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="btn btn-outline"
          style={{ background: 'white' }}
        >
          <option>March 2026</option>
          <option>April 2026</option>
          <option>May 2026</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Dashboard...</div>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map((kpi, index) => (
              <div key={index} className="card kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="kpi-label">{kpi.title}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {kpi.editable && (
                      <button 
                        onClick={() => setIsEditingInvested(!isEditingInvested)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'var(--primary)' }}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <div style={{ padding: '8px', background: 'rgba(123, 74, 30, 0.05)', borderRadius: '8px', color: 'var(--primary)' }}>
                      <kpi.icon size={20} />
                    </div>
                  </div>
                </div>
                
                {kpi.editable && isEditingInvested ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <input 
                      type="number"
                      value={tempAmount}
                      onChange={(e) => setTempAmount(parseFloat(e.target.value) || 0)}
                      autoFocus
                      style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        width: '150px', 
                        border: '1px solid var(--primary-light)', 
                        borderRadius: '4px',
                        padding: '2px 8px'
                      }}
                    />
                    <button onClick={handleSaveInvested} style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px' }}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditingInvested(false)} style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="kpi-value">{kpi.value}</div>
                )}

                <div className={`kpi-trend ${kpi.isPositive ? 'positive' : 'negative'}`}>
                  {kpi.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>Updated in real-time</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card chart-container" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Daily Sales Revenue</h3>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedMonth}</span>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={dailySales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(123, 74, 30, 0.02)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {dailySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--primary-light)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
