import { useEffect, useMemo, useState } from 'react';
import { GeneratePlanRequest, StrategyProfile } from '../../types/posts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { CalendarRange, Plus, X } from 'lucide-react';
import { LINKEDIN_CONTENT_FORMATS } from './linkedinFormats';

interface ContentPlanWizardProps {
  open: boolean;
  initialStrategy: StrategyProfile | null;
  onClose: () => void;
  onGenerate: (payload: GeneratePlanRequest) => Promise<void>;
}

const dayOptions = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const defaultStrategy: StrategyProfile = {
  target_audience: '',
  tone: '',
  core_topics: [],
  goals: [],
  content_formats: [],
  extra_instructions: '',
  channel: 'linkedin',
  is_default: true,
};

function parseTags(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTags(values: string[] | undefined) {
  return (values || []).join(', ');
}

function getNextMonday() {
  const date = new Date();
  const day = date.getDay();
  const diff = ((8 - day) % 7) || 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function addWeeks(dateString: string, weeks: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + (weeks * 7) - 1);
  return date.toISOString().slice(0, 10);
}

export default function ContentPlanWizard({
  open,
  initialStrategy,
  onClose,
  onGenerate,
}: ContentPlanWizardProps) {
  const [strategyForm, setStrategyForm] = useState({
    target_audience: '',
    tone: '',
    core_topics: '',
    goals: '',
    content_formats: '',
    extra_instructions: '',
  });
  const [planForm, setPlanForm] = useState({
    title: '',
    start_date: getNextMonday(),
    end_date: addWeeks(getNextMonday(), 4),
    posts_per_week: '2',
    preferred_days: ['Martes', 'Jueves'] as string[],
    preferred_times: ['09:00'] as string[],
  });
  const [newPreferredTime, setNewPreferredTime] = useState('');
  const [useGlobalStrategyAsBase, setUseGlobalStrategyAsBase] = useState(true);
  const [showStrategyOverride, setShowStrategyOverride] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const seededStrategy = useMemo(
    () => initialStrategy || defaultStrategy,
    [initialStrategy]
  );

  useEffect(() => {
    if (!open) return;

    setStrategyForm({
      target_audience: seededStrategy.target_audience || '',
      tone: seededStrategy.tone || '',
      core_topics: formatTags(seededStrategy.core_topics),
      goals: formatTags(seededStrategy.goals),
      content_formats: formatTags(seededStrategy.content_formats),
      extra_instructions: seededStrategy.extra_instructions || '',
    });
    setUseGlobalStrategyAsBase(true);
    setShowStrategyOverride(false);
  }, [open, seededStrategy]);

  const handleStrategyChange = (field: keyof typeof strategyForm, value: string) => {
    setStrategyForm((current) => ({ ...current, [field]: value }));
  };

  const handlePlanChange = (field: keyof typeof planForm, value: string | string[]) => {
    setPlanForm((current) => ({ ...current, [field]: value }));
  };

  const togglePreferredDay = (day: string) => {
    setPlanForm((current) => {
      const exists = current.preferred_days.includes(day);
      return {
        ...current,
        preferred_days: exists
          ? current.preferred_days.filter((item) => item !== day)
          : [...current.preferred_days, day],
      };
    });
  };

  const toggleFormat = (format: string) => {
    setStrategyForm((current) => {
      const currentFormats = parseTags(current.content_formats);
      const exists = currentFormats.includes(format);
      return {
        ...current,
        content_formats: exists
          ? currentFormats.filter((item) => item !== format).join(', ')
          : [...currentFormats, format].join(', '),
      };
    });
  };

  const addPreferredTime = () => {
    if (!newPreferredTime || planForm.preferred_times.includes(newPreferredTime)) return;
    setPlanForm((current) => ({
      ...current,
      preferred_times: [...current.preferred_times, newPreferredTime].sort(),
    }));
    setNewPreferredTime('');
  };

  const removePreferredTime = (time: string) => {
    setPlanForm((current) => ({
      ...current,
      preferred_times: current.preferred_times.filter((item) => item !== time),
    }));
  };

  const getDurationInWeeks = () => {
    const start = new Date(planForm.start_date);
    const end = new Date(planForm.end_date);
    const diff = end.getTime() - start.getTime();
    return Math.max(Math.ceil((diff + 1) / (1000 * 60 * 60 * 24 * 7)), 1);
  };

  const handleSubmit = async () => {
    const effectiveStrategy = useGlobalStrategyAsBase && !showStrategyOverride
      ? seededStrategy
      : {
          ...seededStrategy,
          target_audience: strategyForm.target_audience.trim(),
          tone: strategyForm.tone.trim(),
          core_topics: parseTags(strategyForm.core_topics),
          goals: parseTags(strategyForm.goals),
          content_formats: parseTags(strategyForm.content_formats),
          extra_instructions: strategyForm.extra_instructions.trim(),
          channel: 'linkedin' as const,
          is_default: true,
        };

    if (!effectiveStrategy.target_audience?.trim() || !effectiveStrategy.tone?.trim() || !(effectiveStrategy.core_topics || []).length) {
      setError('La estrategia aplicada al plan necesita target, tono y temáticas clave.');
      return;
    }

    if (!planForm.start_date || !planForm.end_date) {
      setError('Selecciona un rango de fechas para el plan.');
      return;
    }

    if (new Date(planForm.end_date) < new Date(planForm.start_date)) {
      setError('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      await onGenerate({
        strategy: effectiveStrategy,
        plan: {
          title: planForm.title.trim(),
          start_date: planForm.start_date,
          end_date: planForm.end_date,
          duration_in_weeks: getDurationInWeeks(),
          posts_per_week: Number(planForm.posts_per_week || 2),
          preferred_days: planForm.preferred_days,
          preferred_times: planForm.preferred_times,
          cadence_mode: 'weekly_frequency',
          extra_instructions: effectiveStrategy.extra_instructions || '',
        },
      });
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear plan con IA</DialogTitle>
          <DialogDescription>
            Parte de tu estrategia global de cuenta y ajusta solo lo necesario para este plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Estrategia aplicada al plan</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Se usará la estrategia global guardada en la cuenta, pero puedes retocarla solo para este plan.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUseGlobalStrategyAsBase(true);
                  setShowStrategyOverride((current) => !current);
                }}
              >
                {showStrategyOverride ? 'Ocultar edición' : 'Editar para este plan'}
              </Button>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <p><strong>Target:</strong> {seededStrategy.target_audience || 'Sin definir'}</p>
              <p><strong>Tono:</strong> {seededStrategy.tone || 'Sin definir'}</p>
              <p className="md:col-span-2"><strong>Temas:</strong> {(seededStrategy.core_topics || []).join(', ') || 'Sin definir'}</p>
            </div>

            {showStrategyOverride && (
              <div className="mt-5 grid grid-cols-1 gap-5 border-t border-gray-200 pt-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Target</label>
                    <Input
                      value={strategyForm.target_audience}
                      onChange={(e) => handleStrategyChange('target_audience', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tono</label>
                    <Input
                      value={strategyForm.tone}
                      onChange={(e) => handleStrategyChange('tone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Temáticas clave</label>
                    <Textarea
                      value={strategyForm.core_topics}
                      onChange={(e) => handleStrategyChange('core_topics', e.target.value)}
                      className="min-h-[110px]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Objetivos</label>
                    <Textarea
                      value={strategyForm.goals}
                      onChange={(e) => handleStrategyChange('goals', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Formatos</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {LINKEDIN_CONTENT_FORMATS.map((format) => {
                        const selected = parseTags(strategyForm.content_formats).includes(format);
                        return (
                          <button
                            key={format}
                            type="button"
                            onClick={() => toggleFormat(format)}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              selected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {format}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Instrucciones extra</label>
                    <Textarea
                      value={strategyForm.extra_instructions}
                      onChange={(e) => handleStrategyChange('extra_instructions', e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Configuración del plan</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre del plan</label>
                  <Input
                    value={planForm.title}
                    onChange={(e) => handlePlanChange('title', e.target.value)}
                    placeholder="Ej. Abril - autoridad y captación"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Fecha inicial</label>
                    <Input
                      type="date"
                      value={planForm.start_date}
                      onChange={(e) => handlePlanChange('start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha final</label>
                    <Input
                      type="date"
                      value={planForm.end_date}
                      onChange={(e) => handlePlanChange('end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Posts por semana</label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={planForm.posts_per_week}
                    onChange={(e) => handlePlanChange('posts_per_week', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium">Días preferidos</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dayOptions.map((day) => {
                      const selected = planForm.preferred_days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => togglePreferredDay(day)}
                          className={`rounded-full border px-3 py-2 text-sm transition ${
                            selected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Horas preferidas</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {planForm.preferred_times.map((time) => (
                      <span
                        key={time}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        {time}
                        <button type="button" onClick={() => removePreferredTime(time)} className="text-gray-400 hover:text-gray-700">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      type="time"
                      value={newPreferredTime}
                      onChange={(e) => setNewPreferredTime(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={addPreferredTime}>
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir hora
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? 'Generando plan...' : 'Generar plan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
