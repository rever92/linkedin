import { useState } from 'react';
import { Star, LineChart, LogOut, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export default function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const menuItems = [
    { id: 'analysis', label: 'Análisis', icon: <LineChart className="w-5 h-5" /> },
    { id: 'planner', label: 'Planificador', icon: <Calendar className="w-5 h-5" /> },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative">
      <div
        className="fixed top-0 left-0 h-full bg-white border-r border-[#e5e7eb] transition-all duration-300 ease-in-out z-40 w-20 hover:w-64 group rounded-r-[20px] rounded-tl-[0%] rounded-bl-[0%]"
      >
        <div className="flex flex-col h-full py-4">
          <div className="px-4 mb-6">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-xl font-bold text-foreground transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                Linksight
              </h2>
            </div>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center px-3 py-2.5 transition-all relative text-black
                  group-hover:rounded-lg group-hover:px-3 
                  ${currentView !== item.id && 'hover:bg-black/5'}
                  ${currentView === item.id 
                    ? 'bg-primary text-white group-hover:rounded-full !rounded-full group-hover:!rounded-full [&_svg]:text-white' 
                    : ''} rounded-full`}
              >
                <span className={`flex items-center justify-center flex-shrink-0 transition-all
                  ${currentView === item.id ? 'w-9 h-9 group-hover:w-5 group-hover:h-5' : 'w-5 h-5'}`}>
                  {item.icon}
                </span>
                <span className={`ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap
                  ${currentView === item.id ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="px-4 space-y-4 rounded-br-[10px] rounded-bl-[20px]">
            <div className="transition-opacity duration-200 opacity-0 group-hover:opacity-100">
              <ThemeToggle />
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-black hover:bg-black/5"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 