import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  BookOpen,
  LogOut,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import Footer from './Footer'; // Import the Footer

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/ledger', icon: BookOpen, label: 'Ledger' },
    { path: '/transactions', icon: Wallet, label: 'Transactions' },
    { path: '/friends', icon: Users, label: 'Contacts' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 px-4 py-3 flex justify-between items-center">
        {!logoError ? (
          <img 
            src="/peerledger-logo.png" 
            alt="PeerLedger" 
            className="h-8 w-auto object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <h1 className="text-xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Peer
            </span>
            <span className="text-gray-800">Ledger</span>
          </h1>
        )}
        <button
          onClick={toggleMobileMenu}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed left-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 z-50
        lg:translate-x-0 lg:w-72
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
      `}>
        <div className="p-6 lg:p-8">
          <div className="flex items-center h-14 lg:h-16">
            {!logoError ? (
              <img 
                src="/peerledger-logo.png" 
                alt="PeerLedger" 
                className="h-10 lg:h-14 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  Peer
                </span>
                <span className="text-gray-800">Ledger</span>
              </h1>
            )}
          </div>
          <p className="text-xs lg:text-sm text-gray-600 mt-3 truncate">Welcome, {user?.name}</p>
        </div>
        
        <nav className="mt-2 lg:mt-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center px-6 lg:px-8 py-3 lg:py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`
              }
            >
              <Icon size={20} className="lg:w-6 lg:h-6 mr-3 lg:mr-4 flex-shrink-0" />
              <span className="text-sm lg:text-base font-medium">{label}</span>
            </NavLink>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 lg:px-8 py-3 lg:py-4 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors mt-auto"
          >
            <LogOut size={20} className="lg:w-6 lg:h-6 mr-3 lg:mr-4 flex-shrink-0" />
            <span className="text-sm lg:text-base font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`
        transition-all duration-300 flex-1
        lg:ml-72 p-4 lg:p-8 pt-16 lg:pt-8
      `}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Action Button - Mobile Optimized */}
      <button
        onClick={() => navigate('/transactions/new')}
        className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 lg:p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-colors z-20"
        aria-label="Add new transaction"
      >
        <PlusCircle size={20} className="lg:w-6 lg:h-6" />
      </button>
    </div>
  );
};

export default Layout;