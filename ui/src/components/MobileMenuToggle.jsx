import React from 'react';
import { Menu, X } from 'lucide-react';

function MobileMenuToggle({ isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white/90 backdrop-blur rounded-lg shadow-lg hover:bg-white transition-colors focus:ring-2 focus:ring-cdo-red"
      aria-label="Toggle mobile menu"
    >
      {isOpen ? (
        <X className="w-6 h-6 text-gray-700" />
      ) : (
        <Menu className="w-6 h-6 text-gray-700" />
      )}
    </button>
  );
}

export default MobileMenuToggle;
