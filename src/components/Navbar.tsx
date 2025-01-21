import { LineChart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  onLogin: () => void;
  session?: boolean;
}

export default function Navbar({ onLogin, session }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = () => {
    if (session) {
      navigate('/dashboard/analysis');
    } else {
      onLogin();
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <LineChart className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Linksight</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <a href="#caracteristicas" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Características
            </a>
            <a href="#testimonios" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Testimonios
            </a>
            <a href="#precios" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Precios
            </a>
            <button
              onClick={handleAction}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {session ? 'Ir a mi panel' : 'Iniciar sesión'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <a
              href="#caracteristicas"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            >
              Características
            </a>
            <a
              href="#testimonios"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            >
              Testimonios
            </a>
            <a
              href="#precios"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            >
              Precios
            </a>
            <div className="px-3 py-2">
              <button
                onClick={handleAction}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {session ? 'Ir a mi panel' : 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 