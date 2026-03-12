import React from 'react';
import { BookOpen, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              PeerLedger
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-500">
            © {currentYear} PeerLedger. All rights reserved.
          </p>

          {/* Made with love */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>Made with</span>
            <Heart size={12} className="text-red-500 fill-red-500" />
            <span>by the community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;