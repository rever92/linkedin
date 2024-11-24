import { useState } from 'react';
import { Menu, X, LineChart, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export default function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Mi panel', icon: <LineChart className="w-5 h-5" /> },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-40 
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h2 className={`text-xl font-bold text-gray-800 ${!isOpen && 'lg:hidden'}`}>
              LinkedIn Analytics
            </h2>
          </div>

          <nav className="flex-1 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center px-4 py-3 mb-2 rounded-lg transition-colors
                  ${currentView === item.id 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-blue-50'}`}
              >
                <span className="flex items-center justify-center">{item.icon}</span>
                <span className={`ml-3 ${!isOpen && 'lg:hidden'}`}>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden lg:flex w-full items-center justify-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mb-2"
            >
              <Menu className="w-5 h-5" />
              <span className={`ml-3 ${!isOpen && 'lg:hidden'}`}>Cerrar menú</span>
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className={`ml-3 ${!isOpen && 'lg:hidden'}`}>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 