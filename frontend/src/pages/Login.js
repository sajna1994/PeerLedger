import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(formData.email, formData.password);
    setLoading(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Faded Background Logo - Using your actual image file */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <img 
          src="/peerledger-logo.png" 
          alt="PeerLedger Background" 
          className="w-full max-w-4xl opacity-30 object-contain"
          style={{ transform: 'rotate(12deg) scale(1.5)' }}
        />
      </div>

      {/* Optional: Add a subtle pattern overlay with repeated logo */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none select-none"
        style={{
          backgroundImage: 'url("/peerledger-logo.png")',
          backgroundSize: '200px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          filter: 'blur(1px)'
        }}
      />

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10 backdrop-blur-sm bg-opacity-95">
        <div className="text-center mb-8">
          {/* Styled PeerLedger text similar to the image */}
          <div className="mb-4">
            <h1 className="text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                Peer
              </span>
              <span className="text-gray-800">Ledger</span>
            </h1>
            <div className="mt-2 relative">
              <p className="text-sm font-medium text-gray-500 tracking-[0.2em] uppercase">
                TRACK YOUR DEBITS & CREDITS
              </p>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white bg-opacity-90"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white bg-opacity-90"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;