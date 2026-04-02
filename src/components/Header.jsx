import React from 'react';
import { User, Bell, Search, Calendar, Menu } from 'lucide-react';

const Header = ({ title, setIsMobileOpen }) => {
  const today = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="header" style={{ paddingTop: '2.5rem' }}>
      <div className="header-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Mobile Only Menu Trigger */}
          <button 
            className="mobile-only-btn" 
            onClick={() => setIsMobileOpen(true)}
            style={{ 
              display: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: 'var(--primary)'
            }}
          >
            <Menu size={24} />
          </button>
          <h1 style={{ marginBottom: '4px' }}>{title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Calendar size={14} />
          <span>{today}</span>
        </div>
      </div>
      
      <div className="header-right" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div className="search-bar" style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(0, 0, 0, 0.03)', 
          borderRadius: '12px', 
          padding: '0.625rem 1rem' 
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              marginLeft: '0.5rem', 
              outline: 'none', 
              color: 'var(--text-dark)' 
            }} 
          />
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-icon" style={{ position: 'relative' }}>
            <Bell size={20} />
            <span style={{ 
              position: 'absolute', 
              top: '8px', 
              right: '8px', 
              width: '8px', 
              height: '8px', 
              background: 'var(--primary)', 
              borderRadius: '50%',
              border: '2px solid white'
            }} />
          </button>
          
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <div className="avatar" style={{ 
              width: '40px', 
              height: '40px', 
              background: 'var(--primary-light)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <User size={24} />
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .mobile-only-btn { display: block !important; }
        }
      `}} />
    </header>
  );
};

export default Header;
