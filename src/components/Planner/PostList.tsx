import { useMemo, useState } from 'react';
import { Post, PostState, getPostId } from '../../types/posts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Eye, Heart, Lightbulb, Search, CalendarClock, CheckCircle2, CircleDot, ExternalLink, MessageCircle, Repeat2 } from 'lucide-react';

const states: { value: PostState | 'todos'; label: string; icon: typeof Lightbulb }[] = [
  { value: 'todos', label: 'Todas', icon: Lightbulb },
  { value: 'borrador', label: 'Por desarrollar', icon: Lightbulb },
  { value: 'listo', label: 'Listas', icon: CheckCircle2 },
  { value: 'planificado', label: 'En calendario', icon: CalendarClock },
  { value: 'publicado', label: 'Publicadas', icon: CircleDot },
];

interface Props { posts: Post[]; onPostSelect: (post: Post) => void; }

export default function PostList({ posts, onPostSelect }: Props) {
  const [state, setState] = useState<PostState | 'todos'>('borrador');
  const [query, setQuery] = useState('');
  const [linea, setLinea] = useState('todas');
  const filtered = useMemo(() => posts.filter(post => {
    const matchesState = state === 'todos' || post.state === state;
    const search = `${post.titulo || ''} ${post.content} ${post.fuente || ''} ${post.punto_de_vista || ''}`.toLowerCase();
    return matchesState && (linea === 'todas' || post.linea_editorial === linea) && search.includes(query.toLowerCase());
  }), [posts, state, query, linea]);

  return <section className="space-y-5">
    <div className="rounded-2xl bg-slate-900 p-2 flex flex-wrap gap-2">
      {states.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setState(value)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${state === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
        <Icon className="h-4 w-4" /> {label} <span className="text-xs opacity-60">{value === 'todos' ? posts.length : posts.filter(p => p.state === value).length}</span>
      </button>)}
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={e => setQuery(e.target.value)} className="pl-9" placeholder="Busca una idea, fuente o punto de vista…" /></div>
      <Select value={linea} onValueChange={setLinea}><SelectTrigger className="sm:w-72"><SelectValue placeholder="Línea editorial" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas las líneas</SelectItem>{Array.from(new Set(posts.map(p => p.linea_editorial).filter(Boolean))).map(value => <SelectItem key={value} value={value!}>{value}</SelectItem>)}</SelectContent></Select>
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map(post => <button key={getPostId(post)} onClick={() => onPostSelect(post)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between gap-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{post.linea_editorial || 'Sin línea editorial'}</span><span className="text-xs text-slate-400">{post.formato || 'texto'}</span></div>
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{post.titulo || post.content || 'Idea sin título'}</h3>
        {post.punto_de_vista && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.punto_de_vista}</p>}
        {post.state === 'publicado' && <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-2 py-2 text-[11px] font-medium text-emerald-800"><span className="flex items-center justify-center gap-1" title="Visualizaciones"><Eye className="h-3.5 w-3.5" />{(post.views || 0).toLocaleString('es-ES')}</span><span className="flex items-center justify-center gap-1" title="Reacciones"><Heart className="h-3.5 w-3.5" />{(post.likes || 0).toLocaleString('es-ES')}</span><span className="flex items-center justify-center gap-1" title="Comentarios"><MessageCircle className="h-3.5 w-3.5" />{(post.comments || 0).toLocaleString('es-ES')}</span><span className="flex items-center justify-center gap-1" title="Compartidos"><Repeat2 className="h-3.5 w-3.5" />{(post.shares || 0).toLocaleString('es-ES')}</span></div>}
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-slate-500"><span>{post.fuente || 'Añade la fuente'}</span>{post.published_post_url ? <ExternalLink className="h-4 w-4 text-emerald-600" /> : post.scheduled_datetime ? <span className={`flex items-center gap-1 ${post.state === 'publicado' ? 'font-medium text-emerald-700' : ''}`}>{post.state === 'publicado' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />} {post.state === 'publicado' ? 'Publicada' : 'Programada'}</span> : null}</div>
      </button>)}</div>
    {filtered.length === 0 && <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500"><Lightbulb className="mx-auto mb-3 h-7 w-7" />No hay ideas aquí todavía.</div>}
  </section>;
}
