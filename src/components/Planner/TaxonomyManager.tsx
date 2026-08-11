import { useEffect, useState } from 'react';
import { Pencil, Plus, RotateCcw, Tags, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ContentTaxonomy, TaxonomyKind } from '../../types/posts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const groups: { kind: TaxonomyKind; label: string; description: string }[] = [
  { kind: 'linea_editorial', label: 'Líneas editoriales', description: 'Los territorios temáticos sobre los que publicas.' },
  { kind: 'funcion_editorial', label: 'Funciones editoriales', description: 'El objetivo que cumple cada contenido.' },
  { kind: 'formato', label: 'Formatos', description: 'La forma en la que presentas cada publicación.' },
];

interface Props { onChanged?: () => void | Promise<void>; }

export default function TaxonomyManager({ onChanged }: Props) {
  const [items, setItems] = useState<ContentTaxonomy[]>([]);
  const [newValues, setNewValues] = useState<Partial<Record<TaxonomyKind, string>>>({});
  const [editingId, setEditingId] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async () => setItems(await api.getPlannerTaxonomies(true));
  useEffect(() => { load().catch((caught) => setError(caught.message)); }, []);
  const changed = async () => { await load(); await onChanged?.(); };

  const create = async (kind: TaxonomyKind) => {
    const value = newValues[kind]?.trim();
    if (!value) return;
    setBusyId(kind); setError('');
    try {
      await api.createPlannerTaxonomy({ kind, value });
      setNewValues((current) => ({ ...current, [kind]: '' }));
      await changed();
    } catch (caught: any) { setError(caught.message || 'No se pudo crear el valor'); }
    finally { setBusyId(''); }
  };

  const saveEdit = async (item: ContentTaxonomy) => {
    const id = item._id || item.id || '';
    if (!editingValue.trim()) return;
    setBusyId(id); setError('');
    try {
      await api.updatePlannerTaxonomy(id, { value: editingValue.trim() });
      setEditingId('');
      await changed();
    } catch (caught: any) { setError(caught.message || 'No se pudo guardar el cambio'); }
    finally { setBusyId(''); }
  };

  const setActive = async (item: ContentTaxonomy, active: boolean) => {
    const id = item._id || item.id || '';
    setBusyId(id); setError('');
    try {
      if (active) await api.updatePlannerTaxonomy(id, { active: true });
      else await api.deletePlannerTaxonomy(id);
      await changed();
    } catch (caught: any) { setError(caught.message || 'No se pudo actualizar el valor'); }
    finally { setBusyId(''); }
  };

  return <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><Tags className="h-5 w-5" /></span>
        <div><h2 className="text-xl font-bold text-slate-950">Taxonomías de contenido</h2><p className="mt-1 text-sm text-slate-600">Administra los valores de los desplegables. Al renombrarlos, también se actualizan las publicaciones existentes.</p></div>
      </div>
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>

    <div className="grid gap-5 xl:grid-cols-3">
      {groups.map((group) => {
        const active = items.filter((item) => item.kind === group.kind && item.active);
        const inactive = items.filter((item) => item.kind === group.kind && !item.active);
        return <section key={group.kind} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-950">{group.label}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p></div>
          <div className="p-4">
            <div className="mb-4 flex gap-2">
              <Input value={newValues[group.kind] || ''} onChange={(event) => setNewValues((current) => ({ ...current, [group.kind]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') create(group.kind); }} placeholder="Añadir un valor" className="border-slate-300" />
              <Button onClick={() => create(group.kind)} disabled={!newValues[group.kind]?.trim() || busyId === group.kind} aria-label={`Añadir ${group.label}`}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {active.map((item) => {
                const id = item._id || item.id || '';
                return <div key={id} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  {editingId === id ? <><Input value={editingValue} onChange={(event) => setEditingValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(item); if (event.key === 'Escape') setEditingId(''); }} className="h-8 border-blue-300" autoFocus /><Button size="sm" onClick={() => saveEdit(item)} disabled={busyId === id}>Guardar</Button><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId('')}><X className="h-4 w-4" /></Button></> : <><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{item.value}</span><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500" onClick={() => { setEditingId(id); setEditingValue(item.value); }} aria-label={`Editar ${item.value}`}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setActive(item, false)} disabled={busyId === id} aria-label={`Ocultar ${item.value}`}><Trash2 className="h-4 w-4" /></Button></>}
                </div>;
              })}
              {!active.length && <p className="py-3 text-center text-sm text-slate-400">No hay valores activos.</p>}
            </div>
            {inactive.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Valores ocultos</p>{inactive.map((item) => { const id = item._id || item.id || ''; return <div key={id} className="flex items-center gap-2 py-1.5 text-sm text-slate-400"><span className="min-w-0 flex-1 truncate line-through">{item.value}</span><Button size="sm" variant="ghost" className="h-8 text-xs text-blue-600" onClick={() => setActive(item, true)} disabled={busyId === id}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Restaurar</Button></div>; })}</div>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
