import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ContentTaxonomy, TaxonomyKind } from '../../types/posts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';

const CREATE_VALUE = '__create_taxonomy__';
const controlClass = 'border-slate-300 bg-white shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-offset-0';

interface Props {
  kind: TaxonomyKind;
  value: string;
  placeholder: string;
  taxonomies: ContentTaxonomy[];
  onChange: (value: string) => void;
  onCreated?: (taxonomy: ContentTaxonomy) => void;
}

export default function TaxonomySelect({ kind, value, placeholder, taxonomies, onChange, onCreated }: Props) {
  const [creating, setCreating] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const options = useMemo(() => {
    const values = taxonomies.filter((item) => item.kind === kind && item.active).map((item) => item.value);
    if (value && !values.includes(value)) values.unshift(value);
    return Array.from(new Set(values));
  }, [kind, taxonomies, value]);

  const create = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    setSaving(true);
    setError('');
    try {
      const taxonomy = await api.createPlannerTaxonomy({ kind, value: trimmed });
      onCreated?.(taxonomy);
      onChange(taxonomy.value);
      setNewValue('');
      setCreating(false);
    } catch (caught: any) {
      setError(caught.message || 'No se pudo crear el valor');
    } finally {
      setSaving(false);
    }
  };

  return <div>
    <Select value={value || ''} onValueChange={(next) => {
      if (next === CREATE_VALUE) {
        setCreating(true);
        return;
      }
      onChange(next);
    }}>
      <SelectTrigger className={controlClass}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="z-[70]">
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        {options.length > 0 && <SelectSeparator />}
        <SelectItem value={CREATE_VALUE} className="font-semibold text-blue-700"><Plus className="mr-2 inline h-4 w-4" />Crear nuevo valor…</SelectItem>
      </SelectContent>
    </Select>
    {creating && <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5">
      <div className="flex gap-2">
        <Input
          className="h-9 border-blue-200 bg-white"
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); create(); } }}
          placeholder="Nombre del nuevo valor"
          autoFocus
        />
        <Button size="sm" onClick={create} disabled={saving || !newValue.trim()}>{saving ? 'Creando…' : 'Crear'}</Button>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setCreating(false); setError(''); }} aria-label="Cancelar nuevo valor"><X className="h-4 w-4" /></Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>}
  </div>;
}
