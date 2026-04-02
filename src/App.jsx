import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Recipes from './pages/Recipes';
import BalanceSheet from './pages/BalanceSheet';

const App = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {/* Background Overlay for mobile sidebar */}
        <div 
          className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`}
          onClick={() => setIsMobileOpen(false)}
        ></div>

        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        
        <main className="main-content" style={{ 
          marginLeft: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          paddingTop: '0'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />} />
            <Route path="/inventory" element={<Inventory isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />} />
            <Route path="/customers" element={<Customers isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />} />
            <Route path="/recipes" element={<Recipes isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />} />
            <Route path="/balance" element={<BalanceSheet isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
