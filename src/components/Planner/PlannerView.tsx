import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import { Post } from '../../types/posts';
import PostList from './PostList';
import PostEditor from './PostEditor';
import Calendar from './Calendar';
import { Button } from '../ui/button';
import { CalendarDays, Lightbulb, Plus } from 'lucide-react';

export default function PlannerView() {
  const [posts, setPosts] = useState<Post[]>([]); const [selected, setSelected] = useState<Post | null>(null);
  const [date, setDate] = useState(''); const [open, setOpen] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  const load = async () => { try { setPosts(await api.getPlannerPosts()); } catch (error) { console.error(error); } };
  useEffect(() => { load(); }, []);
  const calendar = location.pathname.includes('/calendar');
  const close = () => { setSelected(null); setDate(''); setOpen(false); };
  const edit = (post: Post) => { setSelected(post); setDate(''); setOpen(true); };
  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">LinkSight · Content OS</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Del insight al post que aprende.</h1><p className="mt-2 max-w-2xl text-slate-600">Captura el criterio, desarrolla la idea y llévala al calendario sin perder el contexto.</p></div><Button size="lg" onClick={() => { setSelected(null); setDate(''); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nueva idea</Button></header>
    <div className="mb-6 flex gap-2 border-b"><button onClick={() => navigate('/planner')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${!calendar ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}><Lightbulb className="h-4 w-4" />Funnel de ideas</button><button onClick={() => navigate('/planner/calendar')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${calendar ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}><CalendarDays className="h-4 w-4" />Calendario</button></div>
    <Routes><Route index element={<PostList posts={posts} onPostSelect={edit} />} /><Route path="calendar" element={<Calendar posts={posts.filter(p => p.state === 'planificado')} onPostSelect={edit} onDateSelect={d => { setSelected(null); setDate(format(d, 'yyyy-MM-dd')); setOpen(true); }} />} /></Routes>
    {open && <PostEditor post={selected} initialDate={date} onClose={close} onSave={() => { load(); close(); }} allPosts={posts} />}
  </div>;
}
