import React from 'react';
import { 
  BarChart3, 
  Leaf, 
  Users, 
  BookOpen, 
  Scale, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/' },
    { name: 'Inventory', icon: Leaf, path: '/inventory' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Recipes', icon: BookOpen, path: '/recipes' },
    { name: 'Balance Sheet', icon: Scale, path: '/balance' },
  ];

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Leaf size={32} />
          {!isCollapsed && <span>NZ Tea Co.</span>}
        </div>
        
        {/* Mobile only close button */}
        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <item.icon size={20} />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <button 
        className="btn-collapse"
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          marginTop: 'auto',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}
      >
        {isCollapsed ? <ChevronRight size={20} /> : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ChevronLeft size={20} />
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </div>
        )}
      </button>
    </div>
  );
};

export default Sidebar;
