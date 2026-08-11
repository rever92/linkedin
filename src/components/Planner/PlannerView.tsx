import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Route, Routes } from 'react-router-dom';
import { format } from 'date-fns';
import { BarChart3, CalendarDays, Lightbulb, Plus, Tags } from 'lucide-react';
import { api } from '../../lib/api';
import { ContentTaxonomy, Post } from '../../types/posts';
import { Button } from '../ui/button';
import Calendar from './Calendar';
import PlannerAnalyticsView from './PlannerAnalyticsView';
import PostEditor from './PostEditor';
import PostList from './PostList';
import TaxonomyManager from './TaxonomyManager';

const navigation = [
  { path: '/planner', label: 'Funnel de ideas', icon: Lightbulb, exact: true },
  { path: '/planner/calendar', label: 'Calendario', icon: CalendarDays },
  { path: '/planner/analytics', label: 'Estadísticas', icon: BarChart3 },
  { path: '/planner/taxonomies', label: 'Taxonomías', icon: Tags },
];

export default function PlannerView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [taxonomies, setTaxonomies] = useState<ContentTaxonomy[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [date, setDate] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const loadPosts = async () => { try { setPosts(await api.getPlannerPosts()); } catch (error) { console.error(error); } };
  const loadTaxonomies = async () => { try { setTaxonomies(await api.getPlannerTaxonomies()); } catch (error) { console.error(error); } };
  useEffect(() => { loadPosts(); loadTaxonomies(); }, []);

  const close = () => { setSelected(null); setDate(''); setOpen(false); };
  const edit = (post: Post) => { setSelected(post); setDate(''); setOpen(true); };
  const addTaxonomy = (taxonomy: ContentTaxonomy) => setTaxonomies((current) => [...current.filter((item) => (item._id || item.id) !== (taxonomy._id || taxonomy.id)), taxonomy]);
  const markPublished = async (post: Post) => {
    const updated = await api.updatePlannerPost(post._id || post.id || '', { state: 'publicado' });
    setPosts((current) => current.map((item) => (item._id || item.id) === (updated._id || updated.id) ? updated : item));
  };

  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">LinkSight · Content OS</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Del insight al post que aprende.</h1><p className="mt-2 max-w-2xl text-slate-600">Captura el criterio, desarrolla la idea y llévala al calendario sin perder el contexto.</p></div>
      <Button size="lg" onClick={() => { setSelected(null); setDate(''); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nueva idea</Button>
    </header>

    <nav className="mb-6 flex gap-1 overflow-x-auto border-b" aria-label="Secciones del planificador">
      {navigation.map((item) => {
        const active = item.exact ? location.pathname === item.path || location.pathname === `${item.path}/` : location.pathname.startsWith(item.path);
        return <button key={item.path} onClick={() => navigate(item.path)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><item.icon className="h-4 w-4" />{item.label}</button>;
      })}
    </nav>

    <Routes>
      <Route index element={<PostList posts={posts} onPostSelect={edit} />} />
      <Route path="calendar" element={<Calendar posts={posts.filter((post) => post.state === 'planificado' || post.state === 'publicado')} onPostSelect={edit} onPostPublish={markPublished} onDateSelect={(selectedDate) => { setSelected(null); setDate(format(selectedDate, 'yyyy-MM-dd')); setOpen(true); }} />} />
      <Route path="analytics" element={<PlannerAnalyticsView taxonomies={taxonomies} />} />
      <Route path="taxonomies" element={<TaxonomyManager onChanged={loadTaxonomies} />} />
    </Routes>

    {open && <PostEditor post={selected} initialDate={date} onClose={close} onSave={() => { loadPosts(); close(); }} taxonomies={taxonomies} onTaxonomyCreated={addTaxonomy} />}
  </div>;
}
