import { useEffect, useState } from 'react';
import { Post, PostState, LineaEditorial, FuncionEditorial, FormatoPost, getPostId } from '../../types/posts';
import { api } from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CalendarClock, Link as LinkIcon, Trash2 } from 'lucide-react';

const lineas: LineaEditorial[] = ['IA para CIOs y C-Level', 'Casos reales y lecciones', 'Frameworks y checklists', 'Opinión sobre tendencias y hype', 'Marca personal y bastidores'];
const funciones: FuncionEditorial[] = ['alcance', 'autoridad', 'conversacion', 'flexible'];
const formatos: FormatoPost[] = ['texto', 'carrusel', 'compartido', 'video', 'meme', 'articulo'];
interface Props { post?: Post | null; initialDate?: string; onClose: () => void; onSave: () => void; allPosts?: Post[]; }

export default function PostEditor({ post, initialDate, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Post>>({});
  const [date, setDate] = useState(''); const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    const scheduled = post?.scheduled_datetime ? new Date(post.scheduled_datetime) : null;
    setForm({ ...post, state: post?.state || (initialDate ? 'planificado' : 'borrador') });
    setDate(scheduled ? scheduled.toISOString().slice(0, 10) : initialDate || '');
    setTime(scheduled ? scheduled.toTimeString().slice(0, 5) : '09:00');
  }, [post, initialDate]);
  const set = (field: keyof Post, value: string) => setForm(current => ({ ...current, [field]: value }));
  const save = async () => {
    setSaving(true); setError('');
    try {
      const state = (form.state || 'borrador') as PostState;
      const data = { ...form, scheduled_datetime: state === 'planificado' && date ? new Date(`${date}T${time || '09:00'}`).toISOString() : null };
      const id = post && getPostId(post);
      if (state === 'publicado' && form.published_post_url && id) await api.publishPlannerPost(id, form.published_post_url);
      else if (id) await api.updatePlannerPost(id, data); else await api.createPlannerPost(data);
      onSave();
    } catch (e: any) { setError(e.message || 'No se pudo guardar la idea'); } finally { setSaving(false); }
  };
  const remove = async () => { if (!post) return; await api.updatePlannerPost(getPostId(post), { state: 'eliminado' }); onSave(); };
  const isScheduled = form.state === 'planificado';
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
    <DialogHeader className="border-b bg-slate-50 px-6 py-5"><DialogTitle>{post ? 'Desarrollar idea' : 'Capturar una idea'}</DialogTitle><DialogDescription>Empieza por el criterio. El texto final puede llegar después.</DialogDescription></DialogHeader>
    <div className="space-y-6 px-6 py-5">
      <div><label className="mb-1.5 block text-sm font-medium">Título</label><Input value={form.titulo || ''} onChange={e => set('titulo', e.target.value)} placeholder="Una frase para reconocer la idea al instante" autoFocus /></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Línea editorial"><Select value={form.linea_editorial || ''} onValueChange={v => set('linea_editorial', v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{lineas.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Función editorial"><Select value={form.funcion_editorial || ''} onValueChange={v => set('funcion_editorial', v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{funciones.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Formato"><Select value={form.formato || ''} onValueChange={v => set('formato', v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{formatos.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Fuente"><Input value={form.fuente || ''} onChange={e => set('fuente', e.target.value)} placeholder="Cliente, reunión, métrica, lectura…" /></Field><Field label="Activo reutilizable"><Input value={form.activo_reutilizable || ''} onChange={e => set('activo_reutilizable', e.target.value)} placeholder="Framework, slide, checklist…" /></Field></div>
      <Field label="Punto de vista"><Textarea value={form.punto_de_vista || ''} onChange={e => set('punto_de_vista', e.target.value)} placeholder="¿Qué tesis propia o criterio hace que esta pieza merezca existir?" /></Field>
      <Field label="Hipótesis"><Textarea value={form.hipotesis || ''} onChange={e => set('hipotesis', e.target.value)} placeholder="¿Qué quieres aprender del mercado con esta publicación?" /></Field>
      <Field label="Borrador del post"><Textarea className="min-h-40" value={form.content || ''} onChange={e => set('content', e.target.value)} placeholder="Desarrolla el post cuando la idea esté lista…" /></Field>
      <div className="rounded-xl border bg-slate-50 p-4"><div className="grid gap-4 md:grid-cols-3"><Field label="Estado"><Select value={form.state || 'borrador'} onValueChange={v => set('state', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="borrador">Idea por desarrollar</SelectItem><SelectItem value="listo">Lista para programar</SelectItem><SelectItem value="planificado">Planificado</SelectItem><SelectItem value="publicado">Publicado</SelectItem></SelectContent></Select></Field>{isScheduled && <><Field label="Fecha"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field><Field label="Hora"><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></Field></>}{form.state === 'publicado' && <div className="md:col-span-2"><Field label="URL del post publicado"><div className="relative"><LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" value={form.published_post_url || ''} onChange={e => set('published_post_url', e.target.value)} placeholder="https://www.linkedin.com/posts/..." /></div></Field></div>}</div>{!isScheduled && form.scheduled_datetime && <p className="mt-3 text-xs text-slate-500">Al salir de “Planificado” se elimina la fecha y la idea vuelve al funnel.</p>}</div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
    <DialogFooter className="sticky bottom-0 border-t bg-white px-6 py-4"><div className="mr-auto">{post && <Button variant="ghost" onClick={remove} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>}</div><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving || (isScheduled && !date)}>{saving ? 'Guardando…' : 'Guardar idea'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>{children}</div>; }
