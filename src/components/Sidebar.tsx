import { Star, LogOut, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate(); const active = currentPath.startsWith('/planner');
  const logout = async () => { await api.logout(); navigate('/'); };
  return <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 border-r border-slate-200 bg-white lg:block"><div className="flex h-full flex-col items-center py-5"><Star className="h-8 w-8 text-blue-600" /><div className="mt-10"><button title="Planificador" onClick={() => navigate('/planner')} className={`rounded-xl p-3 ${active ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><Calendar className="h-5 w-5" /></button></div><button title="Cerrar sesión" onClick={logout} className="mt-auto rounded-xl p-3 text-slate-500 hover:bg-slate-100"><LogOut className="h-5 w-5" /></button></div></aside>;
}
