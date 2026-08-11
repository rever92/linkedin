import { useEffect, useState } from 'react';
import { BarChart3, Eye, FileCheck2, Gauge, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { api } from '../../lib/api';
import { ContentTaxonomy, PlannerAnalytics, TaxonomyKind } from '../../types/posts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const ALL = '__all__';
const fields: { kind: TaxonomyKind; label: string }[] = [
  { kind: 'linea_editorial', label: 'Línea editorial' },
  { kind: 'funcion_editorial', label: 'Función editorial' },
  { kind: 'formato', label: 'Formato' },
];
const number = new Intl.NumberFormat('es-ES');

interface Props { taxonomies: ContentTaxonomy[]; }

export default function PlannerAnalyticsView({ taxonomies }: Props) {
  const [filters, setFilters] = useState<Partial<Record<TaxonomyKind, string>>>({});
  const [data, setData] = useState<PlannerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    api.getPlannerAnalytics(filters).then(setData).catch((caught) => setError(caught.message || 'No se pudieron cargar las estadísticas')).finally(() => setLoading(false));
  }, [filters]);

  const summary = data?.summary;
  const cards = summary ? [
    { label: 'Posts publicados', value: number.format(summary.posts), detail: `${summary.posts_with_metrics} con métricas`, icon: FileCheck2, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Visualizaciones', value: number.format(summary.views), detail: `${number.format(summary.average_views)} de media`, icon: Eye, color: 'text-blue-700 bg-blue-50' },
    { label: 'Interacciones', value: number.format(summary.interactions), detail: `${number.format(summary.average_interactions)} de media`, icon: Heart, color: 'text-rose-700 bg-rose-50' },
    { label: 'Engagement medio', value: `${summary.engagement_rate.toLocaleString('es-ES')}%`, detail: 'solo posts con métricas', icon: Gauge, color: 'text-violet-700 bg-violet-50' },
  ] : [];

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><BarChart3 className="h-5 w-5" /></span><div><h2 className="text-xl font-bold text-slate-950">Rendimiento de publicaciones</h2><p className="mt-1 text-sm text-slate-600">Compara el resultado de los posts publicados según tu estrategia editorial.</p></div></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {fields.map((field) => <div key={field.kind}><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{field.label}</label><Select value={filters[field.kind] || ALL} onValueChange={(value) => setFilters((current) => ({ ...current, [field.kind]: value === ALL ? undefined : value }))}><SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todas</SelectItem>{taxonomies.filter((item) => item.kind === field.kind && item.active).map((item) => <SelectItem key={item._id || item.id} value={item.value}>{item.value}</SelectItem>)}</SelectContent></Select></div>)}
      </div>
    </section>

    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">Cargando estadísticas…</div> : data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 inline-flex rounded-xl p-2.5 ${card.color}`}><card.icon className="h-5 w-5" /></div><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{card.value}</p><p className="mt-1 text-xs text-slate-400">{card.detail}</p></div>)}</div>

      <div className="grid gap-5 xl:grid-cols-3">{fields.map((field) => <section key={field.kind} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-900">Por {field.label.toLocaleLowerCase('es-ES')}</h3></div><div className="divide-y divide-slate-100">{data.breakdowns[field.kind].map((row) => <div key={row.value} className="px-5 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{row.value}</p><p className="mt-1 text-xs text-slate-400">{row.posts_with_metrics} con métricas de {row.posts} · {number.format(row.average_views)} vistas/post</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{number.format(row.views)}</p><p className="text-xs text-emerald-600">{row.engagement_rate.toLocaleString('es-ES')}%</p></div></div></div>)}{!data.breakdowns[field.kind].length && <p className="p-8 text-center text-sm text-slate-400">Sin datos</p>}</div></section>)}</div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-900">Detalle de publicaciones</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Publicación</th><th className="px-4 py-3">Clasificación</th><th className="px-4 py-3 text-right">Vistas</th><th className="px-4 py-3 text-right">Reacciones</th><th className="px-4 py-3 text-right">Comentarios</th><th className="px-4 py-3 text-right">Compartidos</th></tr></thead><tbody className="divide-y divide-slate-100">{data.posts.map((post) => <tr key={post._id || post.id} className="hover:bg-slate-50"><td className="max-w-sm px-5 py-4"><p className="truncate font-semibold text-slate-800">{post.titulo || post.content?.slice(0, 80) || 'Sin título'}</p><p className="mt-1 text-xs text-slate-400">{post.scheduled_datetime ? new Date(post.scheduled_datetime).toLocaleDateString('es-ES') : 'Sin fecha'}</p></td><td className="px-4 py-4"><p className="max-w-52 truncate text-slate-600">{post.linea_editorial || 'Sin línea'}</p><p className="mt-1 text-xs text-slate-400">{post.funcion_editorial || 'Sin función'} · {post.formato || 'Sin formato'}</p></td><td className="px-4 py-4 text-right font-semibold">{number.format(post.views || 0)}</td><td className="px-4 py-4 text-right"><Heart className="mr-1 inline h-3.5 w-3.5 text-rose-400" />{number.format(post.likes || 0)}</td><td className="px-4 py-4 text-right"><MessageCircle className="mr-1 inline h-3.5 w-3.5 text-blue-400" />{number.format(post.comments || 0)}</td><td className="px-4 py-4 text-right"><Repeat2 className="mr-1 inline h-3.5 w-3.5 text-violet-400" />{number.format(post.shares || 0)}</td></tr>)}{!data.posts.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No hay publicaciones para estos filtros.</td></tr>}</tbody></table></div></section>
    </>}
  </div>;
}
