import { useEffect, useState } from 'react';
import { ContentTaxonomy, Post, PostState, getPostId } from '../../types/posts';
import { api } from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart3, Bookmark, CalendarClock, Eye, FileText, Heart, Lightbulb, Link as LinkIcon, MessageCircle, Repeat2, Trash2 } from 'lucide-react';
import TaxonomySelect from './TaxonomySelect';

const controlClass = 'border-slate-300 bg-white shadow-sm transition-colors hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
type MetricFieldName = 'views' | 'likes' | 'comments' | 'shares' | 'saves';

interface Props {
  post?: Post | null;
  initialDate?: string;
  onClose: () => void;
  onSave: () => void;
  taxonomies?: ContentTaxonomy[];
  onTaxonomyCreated?: (taxonomy: ContentTaxonomy) => void;
}

export default function PostEditor({ post, initialDate, onClose, onSave, taxonomies = [], onTaxonomyCreated }: Props) {
  const [form, setForm] = useState<Partial<Post>>({});
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const scheduled = post?.scheduled_datetime ? new Date(post.scheduled_datetime) : null;
    setForm({ ...post, state: post?.state || (initialDate ? 'planificado' : 'borrador') });
    setDate(scheduled ? scheduled.toISOString().slice(0, 10) : initialDate || '');
    setTime(scheduled ? scheduled.toTimeString().slice(0, 5) : '09:00');
  }, [post, initialDate]);

  const set = (field: keyof Post, value: string | number) => setForm((current) => ({ ...current, [field]: value }));
  const setMetric = (field: MetricFieldName, value: string) => {
    const parsed = Number.parseInt(value, 10);
    setForm((current) => ({ ...current, [field]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }));
  };
  const state = (form.state || 'borrador') as PostState;
  const isScheduled = state === 'planificado';
  const isPublished = state === 'publicado';
  const keepsPublicationDate = isScheduled || isPublished;
  const interactions = (form.likes || 0) + (form.comments || 0) + (form.shares || 0) + (form.saves || 0);
  const engagementRate = form.views ? (interactions / form.views) * 100 : 0;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const scheduledDateTime = keepsPublicationDate && date
        ? new Date(`${date}T${time || '09:00'}`).toISOString()
        : null;
      const data = { ...form, scheduled_datetime: scheduledDateTime };
      const id = post && getPostId(post);

      if (id) {
        await api.updatePlannerPost(id, data);
      } else {
        await api.createPlannerPost(data);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || 'No se pudo guardar la idea');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!post) return;
    await api.updatePlannerPost(getPostId(post), { state: 'eliminado' as PostState });
    onSave();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-6 py-5 pr-14 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-blue-700 shadow-sm">
              {post ? <FileText className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl text-slate-950 sm:text-2xl">
                {post ? 'Editar publicación' : 'Crear una publicación'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-600">
                Define la idea, desarrolla el contenido y decide cuándo publicarlo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 px-4 py-5 sm:px-8 sm:py-6">
          <div className="space-y-5">
            <Section
              icon={<Lightbulb className="h-4 w-4" />}
              title="Idea y enfoque"
              description="La información que permite reconocer y clasificar la publicación."
            >
              <Field label="Título">
                <Input
                  className={controlClass}
                  value={form.titulo || ''}
                  onChange={(e) => set('titulo', e.target.value)}
                  placeholder="Una frase para reconocer la idea al instante"
                  autoFocus
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Línea editorial">
                  <TaxonomySelect kind="linea_editorial" value={form.linea_editorial || ''} placeholder="Selecciona" taxonomies={taxonomies} onChange={(value) => set('linea_editorial', value)} onCreated={onTaxonomyCreated} />
                </Field>
                <Field label="Función editorial">
                  <TaxonomySelect kind="funcion_editorial" value={form.funcion_editorial || ''} placeholder="Selecciona" taxonomies={taxonomies} onChange={(value) => set('funcion_editorial', value)} onCreated={onTaxonomyCreated} />
                </Field>
                <Field label="Formato">
                  <TaxonomySelect kind="formato" value={form.formato || ''} placeholder="Selecciona" taxonomies={taxonomies} onChange={(value) => set('formato', value)} onCreated={onTaxonomyCreated} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fuente">
                  <Input className={controlClass} value={form.fuente || ''} onChange={(e) => set('fuente', e.target.value)} placeholder="Cliente, reunión, métrica, lectura…" />
                </Field>
                <Field label="Activo reutilizable">
                  <Input className={controlClass} value={form.activo_reutilizable || ''} onChange={(e) => set('activo_reutilizable', e.target.value)} placeholder="Framework, slide, checklist…" />
                </Field>
              </div>
            </Section>

            <Section
              icon={<FileText className="h-4 w-4" />}
              title="Desarrollo"
              description="Aterriza el criterio antes de trabajar el texto definitivo."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Punto de vista">
                  <Textarea className={`${controlClass} min-h-28 resize-y`} value={form.punto_de_vista || ''} onChange={(e) => set('punto_de_vista', e.target.value)} placeholder="¿Qué tesis propia o criterio hace que esta pieza merezca existir?" />
                </Field>
                <Field label="Hipótesis">
                  <Textarea className={`${controlClass} min-h-28 resize-y`} value={form.hipotesis || ''} onChange={(e) => set('hipotesis', e.target.value)} placeholder="¿Qué quieres aprender del mercado con esta publicación?" />
                </Field>
              </div>
              <Field label="Borrador del post">
                <Textarea className={`${controlClass} min-h-52 resize-y font-normal leading-relaxed`} value={form.content || ''} onChange={(e) => set('content', e.target.value)} placeholder="Desarrolla el post cuando la idea esté lista…" />
              </Field>
            </Section>

            <Section
              icon={<CalendarClock className="h-4 w-4" />}
              title="Estado y publicación"
              description="La fecha se conserva tanto al planificar como al marcar una publicación como publicada."
              tone="blue"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Estado">
                  <Select value={state} onValueChange={(value) => set('state', value)}>
                    <SelectTrigger className={controlClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="borrador">Idea por desarrollar</SelectItem>
                      <SelectItem value="listo">Lista para programar</SelectItem>
                      <SelectItem value="planificado">Planificado</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {keepsPublicationDate && (
                  <>
                    <Field label={isPublished ? 'Fecha de publicación' : 'Fecha'}>
                      <Input className={controlClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </Field>
                    <Field label="Hora">
                      <Input className={controlClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </Field>
                  </>
                )}
              </div>

              {isPublished && (
                <>
                  <Field label="URL del post publicado" hint="Opcional. Si coincide con un post importado, sus métricas se sincronizarán automáticamente.">
                    <div className="relative">
                      <LinkIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input className={`${controlClass} pl-9`} value={form.published_post_url || ''} onChange={(e) => set('published_post_url', e.target.value)} placeholder="https://www.linkedin.com/posts/…" />
                    </div>
                  </Field>

                  <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-2 border-b border-emerald-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold text-slate-900"><BarChart3 className="h-4 w-4 text-emerald-600" />Analytics</h4>
                        <p className="mt-1 text-xs text-slate-500">Puedes introducirlas manualmente, mediante MCP o importando los datos de LinkedIn.</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Engagement</p>
                        <p className="text-lg font-bold text-emerald-900">{engagementRate.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <MetricInput icon={<Eye />} label="Visualizaciones" value={form.views || 0} onChange={(value) => setMetric('views', value)} />
                      <MetricInput icon={<Heart />} label="Reacciones" value={form.likes || 0} onChange={(value) => setMetric('likes', value)} />
                      <MetricInput icon={<MessageCircle />} label="Comentarios" value={form.comments || 0} onChange={(value) => setMetric('comments', value)} />
                      <MetricInput icon={<Repeat2 />} label="Compartidos" value={form.shares || 0} onChange={(value) => setMetric('shares', value)} />
                      <MetricInput icon={<Bookmark />} label="Guardados" value={form.saves || 0} onChange={(value) => setMetric('saves', value)} />
                    </div>
                    {form.metrics_updated_at && <p className="mt-3 text-right text-[11px] text-slate-400">Actualizadas {new Date(form.metrics_updated_at).toLocaleString('es-ES')}</p>}
                  </div>
                </>
              )}

              {!keepsPublicationDate && Boolean(post?.scheduled_datetime) && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  Al guardar fuera de “Planificado” o “Publicado” se eliminará la fecha y la idea volverá al funnel.
                </p>
              )}
            </Section>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:px-8 sm:space-x-0">
          <div className="mr-auto">
            {post && (
              <Button variant="ghost" onClick={remove} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" />Eliminar
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose} className="border-slate-300">Cancelar</Button>
          <Button onClick={save} disabled={saving || (isScheduled && !date)} className="min-w-32 shadow-sm">
            {saving ? 'Guardando…' : post ? 'Guardar cambios' : 'Crear publicación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetricInput({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-emerald-600">{icon}</span>
        {label}
      </span>
      <Input className={`${controlClass} tabular-nums`} type="number" min="0" step="1" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
  tone = 'white',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: 'white' | 'blue';
}) {
  return (
    <section className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${tone === 'blue' ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'}`}>
      <div className="mb-4 flex items-start gap-3 border-b border-slate-200/80 pb-4">
        <div className={`rounded-lg p-2 ${tone === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{icon}</div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
