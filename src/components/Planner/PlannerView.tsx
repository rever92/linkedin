import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Brain, CheckCircle2, CalendarRange, FileText, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import {
  ContentPlan,
  ContentPlanItem,
  GeneratePlanRequest,
  PlanEditorContext,
  Post,
  StrategyProfile,
  getPostId,
} from '../../types/posts';
import PostList from './PostList';
import PostEditor from './PostEditor';
import Calendar from './Calendar';
import ContentPlanWizard from './ContentPlanWizard';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { LINKEDIN_CONTENT_FORMATS } from './linkedinFormats';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type PlannerTab = 'plans' | 'posts' | 'calendar';

function getTabFromPath(pathname: string): PlannerTab {
  if (pathname.includes('/calendar')) return 'calendar';
  if (pathname.includes('/posts')) return 'posts';
  return 'plans';
}

function formatShortDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return format(new Date(value), "d MMM yyyy", { locale: es });
}

const emptyStrategy: StrategyProfile = {
  target_audience: '',
  tone: '',
  core_topics: [],
  goals: [],
  content_formats: [],
  extra_instructions: '',
  channel: 'linkedin',
  is_default: true,
};

export default function PlannerView() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = getTabFromPath(location.pathname);

  const [posts, setPosts] = useState<Post[]>([]);
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [strategy, setStrategy] = useState<StrategyProfile | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [approvalMeta, setApprovalMeta] = useState<{ title: string; items: number } | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [editorContext, setEditorContext] = useState<PlanEditorContext | null>(null);
  const [itemDraft, setItemDraft] = useState<Partial<ContentPlanItem>>({});
  const [strategyDraft, setStrategyDraft] = useState<StrategyProfile>(emptyStrategy);
  const [planToDelete, setPlanToDelete] = useState<ContentPlan | null>(null);
  const [planError, setPlanError] = useState('');

  const selectedPlan = useMemo(
    () => plans.find((plan) => getPostId(plan) === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const selectedItem = useMemo(
    () => selectedPlan?.items.find((item) => getPostId(item) === selectedItemId) || null,
    [selectedPlan, selectedItemId]
  );

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      const latest = plans[0];
      setSelectedPlanId(getPostId(latest));
      if (latest.items[0]) setSelectedItemId(getPostId(latest.items[0]));
    }
  }, [plans, selectedPlanId]);

  useEffect(() => {
    if (selectedItem) {
      setItemDraft({
        ...selectedItem,
        supporting_points: [...(selectedItem.supporting_points || [])],
      });
    } else {
      setItemDraft({});
    }
  }, [selectedItem]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [postsData, plansData, strategyData] = await Promise.all([
        api.getPlannerPosts(),
        api.getContentPlans(),
        api.getStrategyProfile().catch(() => null),
      ]);

      setPosts(postsData || []);
      setPlans(plansData || []);
      setStrategy(strategyData || emptyStrategy);
      setStrategyDraft(strategyData || emptyStrategy);
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo cargar el planificador.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPlans = async (preferredPlanId?: string, preferredItemId?: string) => {
    const plansData = await api.getContentPlans();
    setPlans(plansData || []);

    const requestedPlanId = preferredPlanId || selectedPlanId || null;
    const chosenPlan = plansData.find((plan) => getPostId(plan) === requestedPlanId) || plansData[0] || null;
    const planId = chosenPlan ? getPostId(chosenPlan) : null;
    setSelectedPlanId(planId);

    const itemId = preferredItemId || selectedItemId || (chosenPlan?.items[0] ? getPostId(chosenPlan.items[0]) : null);
    setSelectedItemId(itemId);
  };

  const refreshPosts = async () => {
    const postsData = await api.getPlannerPosts();
    setPosts(postsData || []);
  };

  const handleCreatePost = () => {
    setSelectedPost(null);
    setSelectedDate('');
    setEditorContext(null);
    setIsEditorOpen(true);
  };

  const handlePostSelect = async (post: Post) => {
    setSelectedPost(post);
    setSelectedDate('');
    setEditorContext(null);

    if (post.plan_item_id) {
      const plan = plans.find((candidate) => candidate.items.some((item) => getPostId(item) === post.plan_item_id));
      if (plan) {
        try {
          const context = await api.getPlanEditorContext(getPostId(plan), post.plan_item_id);
          setEditorContext(context);
        } catch {
          setEditorContext(null);
        }
      }
    }

    setIsEditorOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedPost(null);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setEditorContext(null);
    setIsEditorOpen(true);
  };

  const handleGeneratePlan = async (payload: GeneratePlanRequest) => {
    setIsGenerating(true);
    setPlanError('');
    try {
      const createdPlan = await api.generateContentPlan(payload);
      const persistedStrategy = await api.saveStrategyProfile(payload.strategy);
      setStrategy(persistedStrategy);
      setIsWizardOpen(false);
      await refreshPlans(getPostId(createdPlan), createdPlan.items?.[0] ? getPostId(createdPlan.items[0]) : undefined);
      navigate('/planner');
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo generar el plan.');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGlobalFormat = (format: string) => {
    setStrategyDraft((current) => {
      const currentFormats = current.content_formats || [];
      const exists = currentFormats.includes(format);
      return {
        ...current,
        content_formats: exists
          ? currentFormats.filter((item) => item !== format)
          : [...currentFormats, format],
      };
    });
  };

  const handleSaveStrategy = async () => {
    setIsSavingStrategy(true);
    setPlanError('');
    try {
      const saved = await api.saveStrategyProfile({
        ...strategyDraft,
        channel: 'linkedin',
        is_default: true,
      });
      setStrategy(saved);
      setStrategyDraft(saved);
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo guardar la estrategia global.');
    } finally {
      setIsSavingStrategy(false);
    }
  };

  const handleSaveItem = async () => {
    if (!selectedPlan || !selectedItem) return;

    setIsSavingItem(true);
    setPlanError('');
    try {
      const planId = getPostId(selectedPlan);
      const itemId = getPostId(selectedItem);
      await api.updateContentPlanItem(planId, itemId, {
        ...itemDraft,
        supporting_points: Array.isArray(itemDraft.supporting_points)
          ? itemDraft.supporting_points
          : String(itemDraft.supporting_points || '')
              .split('\n')
              .map((point) => point.trim())
              .filter(Boolean),
      });
      await refreshPlans(planId, itemId);
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo guardar la pieza.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleRegenerateItem = async () => {
    if (!selectedPlan || !selectedItem) return;

    setIsSavingItem(true);
    setPlanError('');
    try {
      const planId = getPostId(selectedPlan);
      const itemId = getPostId(selectedItem);
      const regenerated = await api.regenerateContentPlanItem(planId, itemId, itemDraft.extra_instructions || '');
      await refreshPlans(planId, getPostId(regenerated));
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo regenerar la pieza.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!selectedPlan) return;
    setIsApproving(true);
    setApprovalMeta({
      title: selectedPlan.title,
      items: selectedPlan.items.length,
    });
    setPlanError('');
    try {
      const approved = await api.approveContentPlan(getPostId(selectedPlan));
      await refreshPosts();
      await refreshPlans(getPostId(approved), selectedItem ? getPostId(selectedItem) : undefined);
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo aprobar el plan.');
    } finally {
      setIsApproving(false);
      setApprovalMeta(null);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    setIsDeletingPlan(true);
    setPlanError('');
    try {
      await api.deleteContentPlan(getPostId(planToDelete));
      await refreshPosts();
      await refreshPlans();
      if (selectedPlanId === getPostId(planToDelete)) {
        setSelectedPlanId(null);
        setSelectedItemId(null);
      }
      setPlanToDelete(null);
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo eliminar el plan.');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const handleOpenFromPlan = async () => {
    if (!selectedPlan || !selectedItem) return;
    setIsConverting(true);
    setPlanError('');
    try {
      const planId = getPostId(selectedPlan);
      const itemId = getPostId(selectedItem);
      const { post } = await api.createPlannerPostFromPlanItem(planId, itemId);
      const context = await api.getPlanEditorContext(planId, itemId);
      await refreshPosts();
      await refreshPlans(planId, itemId);
      setSelectedPost(post);
      setSelectedDate('');
      setEditorContext(context);
      setIsEditorOpen(true);
      navigate('/planner/posts');
    } catch (error: any) {
      setPlanError(error.message || 'No se pudo abrir la pieza en el editor.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'calendar') navigate('/planner/calendar');
    else if (tab === 'posts') navigate('/planner/posts');
    else navigate('/planner');
  };

  const renderPlansView = () => (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <div className="space-y-4">
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Estrategia base</p>
              <h2 className="text-lg font-semibold text-gray-900">Perfil editorial</h2>
            </div>
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Target global</label>
              <Input
                value={strategyDraft.target_audience || ''}
                onChange={(e) => setStrategyDraft((current) => ({ ...current, target_audience: e.target.value }))}
                placeholder="Ej. founders B2B, directores de marketing..."
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Tono global</label>
              <Input
                value={strategyDraft.tone || ''}
                onChange={(e) => setStrategyDraft((current) => ({ ...current, tone: e.target.value }))}
                placeholder="Ej. cercano, experto, práctico..."
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Temáticas clave</label>
              <Textarea
                className="min-h-[100px]"
                value={(strategyDraft.core_topics || []).join(', ')}
                onChange={(e) => setStrategyDraft((current) => ({
                  ...current,
                  core_topics: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                }))}
                placeholder="IA, liderazgo, productividad, ventas..."
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Objetivos</label>
              <Textarea
                className="min-h-[90px]"
                value={(strategyDraft.goals || []).join(', ')}
                onChange={(e) => setStrategyDraft((current) => ({
                  ...current,
                  goals: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                }))}
                placeholder="Autoridad, leads, engagement..."
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Formatos preferidos</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LINKEDIN_CONTENT_FORMATS.map((format) => {
                  const selected = (strategyDraft.content_formats || []).includes(format);
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() => toggleGlobalFormat(format)}
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
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Instrucciones extra</label>
              <Textarea
                className="min-h-[110px]"
                value={strategyDraft.extra_instructions || ''}
                onChange={(e) => setStrategyDraft((current) => ({ ...current, extra_instructions: e.target.value }))}
                placeholder="Notas estratégicas permanentes para tu cuenta"
              />
            </div>
          </div>
          <Button className="mt-4 w-full" variant="outline" onClick={handleSaveStrategy} disabled={isSavingStrategy}>
            {isSavingStrategy ? 'Guardando estrategia...' : 'Guardar estrategia global'}
          </Button>
          <Button className="mt-3 w-full" variant="outline" onClick={() => setIsWizardOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Crear o regenerar plan
          </Button>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Planes guardados</h3>
            <span className="text-xs text-gray-500">{plans.length} planes</span>
          </div>
          <div className="mt-4 space-y-3">
            {plans.map((plan) => {
              const planId = getPostId(plan);
              const isSelected = planId === selectedPlanId;
              return (
                <button
                  key={planId}
                  onClick={() => {
                    setSelectedPlanId(planId);
                    if (plan.items[0]) setSelectedItemId(getPostId(plan.items[0]));
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{plan.title}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">
                      {plan.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatShortDate(plan.start_date)} - {formatShortDate(plan.end_date)}
                  </p>
                  <p className="mt-2 text-xs text-gray-600">
                    {plan.items.length} piezas · {(plan.cadence?.posts_per_week || 0)} por semana
                  </p>
                </button>
              );
            })}

            {plans.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                Aún no has generado ningún plan editorial.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {selectedPlan ? (
          <>
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CalendarRange className="h-4 w-4" />
                    Plan IA de LinkedIn
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">{selectedPlan.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-gray-600">
                    {(selectedPlan.generation_context?.summary as string) || 'Calendario generado a partir de la estrategia e historial disponible.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-3 py-1">{selectedPlan.status}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {selectedPlan.cadence?.duration_in_weeks || 0} semanas
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {selectedPlan.cadence?.posts_per_week || 0} posts/semana
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={loadAll}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recargar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPlanToDelete(selectedPlan)}
                    disabled={isApproving || selectedPlan.status === 'approving'}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar plan
                  </Button>
                  <Button onClick={handleApprovePlan} disabled={isApproving || selectedPlan.status === 'approved' || selectedPlan.status === 'approving'}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isApproving || selectedPlan.status === 'approving'
                      ? 'Aprobando y generando...'
                      : selectedPlan.status === 'approved'
                      ? 'Plan aprobado'
                      : 'Aprobar plan'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.9fr]">
              <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Calendario y briefs</h3>
                  <span className="text-xs text-gray-500">Selecciona una pieza para editarla</span>
                </div>
                <div className="mt-4 space-y-5">
                  {Array.from(new Set(selectedPlan.items.map((item) => item.week_index))).map((week) => (
                    <div key={week} className="rounded-2xl border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Semana {week}</h4>
                        <span className="text-xs text-gray-500">
                          {selectedPlan.items.filter((item) => item.week_index === week).length} piezas
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedPlan.items
                          .filter((item) => item.week_index === week)
                          .map((item) => {
                            const itemId = getPostId(item);
                            const isSelected = itemId === selectedItemId;
                            return (
                              <button
                                key={itemId}
                                onClick={() => setSelectedItemId(itemId)}
                                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">{item.content_type || 'formato'}</span>
                                      <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">{item.status}</span>
                                      {item.linked_planner_post_id && (
                                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                                          Basado en publicación existente
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">{formatShortDate(item.suggested_date)}</span>
                                    </div>
                                    <h5 className="mt-2 text-base font-semibold text-gray-900">{item.topic}</h5>
                                    <p className="mt-1 text-sm text-gray-600">{item.angle}</p>
                                  </div>
                                  <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Edición de brief</h3>
                  {selectedItem && (
                    <span className="text-xs text-gray-500">
                      Pieza #{selectedItem.week_index}
                    </span>
                  )}
                </div>

                {selectedItem ? (
                  <div className="mt-4 space-y-4">
                    {selectedItem.linked_planner_post_id && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Esta pieza está vinculada a una publicación que ya existía en el calendario. Si apruebas el plan, esa publicación se sustituirá por la nueva versión generada desde este brief.
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Tema</label>
                      <Input
                        value={itemDraft.topic || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, topic: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Formato</label>
                      <Input
                        value={itemDraft.content_type || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, content_type: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Objetivo</label>
                      <Input
                        value={itemDraft.objective || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, objective: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Ángulo</label>
                      <Textarea
                        className="min-h-[90px]"
                        value={itemDraft.angle || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, angle: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Pain point</label>
                      <Textarea
                        className="min-h-[90px]"
                        value={itemDraft.pain_point || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, pain_point: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contrarian insight</label>
                      <Textarea
                        className="min-h-[90px]"
                        value={itemDraft.contrarian_insight || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, contrarian_insight: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Hook</label>
                      <Textarea
                        className="min-h-[90px]"
                        value={itemDraft.hook_idea || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, hook_idea: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CTA</label>
                      <Textarea
                        className="min-h-[80px]"
                        value={itemDraft.cta || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, cta: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Puntos de apoyo</label>
                      <Textarea
                        className="min-h-[120px]"
                        value={Array.isArray(itemDraft.supporting_points) ? itemDraft.supporting_points.join('\n') : ''}
                        onChange={(e) => setItemDraft((current) => ({
                          ...current,
                          supporting_points: e.target.value.split('\n').map((point) => point.trim()).filter(Boolean),
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Instrucciones extra</label>
                      <Textarea
                        className="min-h-[120px]"
                        value={itemDraft.extra_instructions || ''}
                        onChange={(e) => setItemDraft((current) => ({ ...current, extra_instructions: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Fecha sugerida</label>
                        <Input
                          type="date"
                          value={itemDraft.suggested_date ? String(itemDraft.suggested_date).slice(0, 10) : ''}
                          onChange={(e) => setItemDraft((current) => ({ ...current, suggested_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Hora sugerida</label>
                        <Input
                          type="time"
                          value={itemDraft.suggested_time || ''}
                          onChange={(e) => setItemDraft((current) => ({ ...current, suggested_time: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button variant="outline" onClick={handleSaveItem} disabled={isSavingItem}>
                        {isSavingItem ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                      <Button variant="outline" onClick={handleRegenerateItem} disabled={isSavingItem}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerar pieza
                      </Button>
                      <Button onClick={handleOpenFromPlan} disabled={isConverting}>
                        {isConverting ? 'Abriendo...' : 'Desarrollar en editor'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500">
                    Selecciona una pieza del plan para editar su brief.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-300 bg-white px-8 py-14 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Construye tu calendario con IA</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
              Define audiencia, tono, temáticas, objetivos y formatos. La IA generará un plan inicial por semanas con briefs listos para validar y desarrollar.
            </p>
            <Button className="mt-6" onClick={() => setIsWizardOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Crear primer plan con IA
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Planificador de Contenido</h1>
          <p className="mt-1 text-sm text-gray-600">
            Diseña tu estrategia, valida el calendario con IA y convierte cada pieza en contenido editable.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva publicación
          </Button>
          <Button onClick={() => setIsWizardOpen(true)} disabled={isGenerating}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generando...' : 'Crear plan con IA'}
          </Button>
        </div>
      </div>

      {planError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {planError}
        </div>
      )}

      {isApproving && approvalMeta && (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900 shadow-sm">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-blue-700" />
            <div>
              <p className="font-semibold">
                Aprobando plan y generando publicaciones finales
              </p>
              <p className="mt-1 text-blue-800">
                `{approvalMeta.title}` está pasando de borrador a operativo. Se están generando {approvalMeta.items} posts definitivos con IA y, cuando termine, aparecerán en el calendario como publicaciones normales.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-[520px] grid-cols-3 bg-white shadow-sm">
          <TabsTrigger value="plans">Planes IA</TabsTrigger>
          <TabsTrigger value="posts">Publicaciones</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>
      </Tabs>

      {currentTab === 'plans' && renderPlansView()}
      {currentTab === 'posts' && (
        <PostList posts={posts} onPostSelect={handlePostSelect} onPostUpdate={refreshPosts} />
      )}
      {currentTab === 'calendar' && (
        <Calendar
          posts={posts.filter((post) => post.state === 'planificado')}
          onPostSelect={handlePostSelect}
          onDateSelect={handleDateSelect}
        />
      )}

      <ContentPlanWizard
        open={isWizardOpen}
        initialStrategy={strategy}
        onClose={() => setIsWizardOpen(false)}
        onGenerate={handleGeneratePlan}
      />

      {isEditorOpen && (
        <PostEditor
          post={selectedPost}
          initialDate={selectedDate}
          onClose={() => {
            setSelectedPost(null);
            setSelectedDate('');
            setEditorContext(null);
            setIsEditorOpen(false);
          }}
          onSave={() => {
            refreshPosts();
            refreshPlans();
            setSelectedPost(null);
            setSelectedDate('');
            setEditorContext(null);
            setIsEditorOpen(false);
          }}
          allPosts={posts}
          planContext={editorContext}
        />
      )}

      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Eliminar plan</DialogTitle>
            <DialogDescription>
              Esta acción eliminará el plan, todos sus briefs y, si ya estaba aprobado, también los posts generados que aparezcan en el calendario.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
            <p><strong>Plan:</strong> {planToDelete?.title || 'Sin título'}</p>
            <p><strong>Piezas:</strong> {planToDelete?.items.length || 0}</p>
            <p><strong>Estado:</strong> {planToDelete?.status || 'draft'}</p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPlanToDelete(null)} disabled={isDeletingPlan}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} disabled={isDeletingPlan}>
              {isDeletingPlan ? 'Eliminando...' : 'Eliminar plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
