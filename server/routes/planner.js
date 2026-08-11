import { Router } from 'express';
import auth from '../middleware/auth.js';
import PlannerPost from '../models/PlannerPost.js';
import PostOptimization from '../models/PostOptimization.js';
import ContentStrategyProfile from '../models/ContentStrategyProfile.js';
import ContentPlan from '../models/ContentPlan.js';
import ContentPlanItem from '../models/ContentPlanItem.js';
import Recommendation from '../models/Recommendation.js';
import LinkedInPost from '../models/LinkedInPost.js';
import ContentTaxonomy, { TAXONOMY_KINDS } from '../models/ContentTaxonomy.js';
import { generateContentPlan, generatePlannedPostContent, optimizePlannedPost } from '../services/geminiPlannerService.js';

const router = Router();
const metricDefinitions = [
  { field: 'impresiones', legacy: 'views' },
  { field: 'reacciones', legacy: 'likes' },
  { field: 'comentarios', legacy: 'comments' },
  { field: 'compartidos', legacy: 'shares' },
  { field: 'guardados', legacy: 'saves' },
];
const metricFields = metricDefinitions.map(({ field }) => field);
const editableFields = ['content', 'content_type', 'state', 'scheduled_datetime', 'plan_item_id', 'titulo', 'linea_editorial', 'funcion_editorial', 'formato', 'fuente', 'punto_de_vista', 'hipotesis', 'activo_reutilizable', 'published_post_url'];
const pickEditable = (body) => Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
const metricValue = (post, field) => {
  const definition = metricDefinitions.find((item) => item.field === field);
  return Number(post[field] ?? post[definition.legacy] ?? 0);
};
const pickMetrics = (body) => Object.fromEntries(metricDefinitions.flatMap(({ field, legacy }) => {
  if (body[field] !== undefined) return [[field, body[field]]];
  if (body[legacy] !== undefined) return [[field, body[legacy]]];
  return [];
}));
const hasRecordedMetrics = (post) => metricFields.some((metric) => metricValue(post, metric) > 0);
const normalizeSearchText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es-ES')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const defaultTaxonomies = {
  linea_editorial: ['IA para CIOs y C-Level', 'Casos reales y lecciones', 'Frameworks y checklists', 'Opinión sobre tendencias y hype', 'Marca personal y bastidores'],
  funcion_editorial: ['alcance', 'autoridad', 'conversacion', 'flexible'],
  formato: ['texto', 'carrusel', 'compartido', 'video', 'meme', 'articulo'],
};
const taxonomyFieldMap = {
  linea_editorial: 'linea_editorial',
  funcion_editorial: 'funcion_editorial',
  formato: 'formato',
};
const normalizeTaxonomyValue = (value) => String(value || '').trim().toLocaleLowerCase('es-ES');

async function ensureDefaultTaxonomies(userId) {
  const operations = Object.entries(defaultTaxonomies).flatMap(([kind, values]) => values.map((value, index) => ({
    updateOne: {
      filter: { user_id: userId, kind, normalized_value: normalizeTaxonomyValue(value) },
      update: { $setOnInsert: { user_id: userId, kind, value, normalized_value: normalizeTaxonomyValue(value), active: true, is_default: true, sort_order: index } },
      upsert: true,
    },
  })));
  await ContentTaxonomy.bulkWrite(operations);

  // Preserve free-form values that already exist in historical content.
  const discovered = await Promise.all(TAXONOMY_KINDS.map(async (kind) => {
    const [plannerValues, linkedinValues] = await Promise.all([
      PlannerPost.distinct(taxonomyFieldMap[kind], { user_id: userId }),
      LinkedInPost.distinct(taxonomyFieldMap[kind], { user_id: userId }),
    ]);
    return { kind, values: Array.from(new Set([...plannerValues, ...linkedinValues].filter(Boolean))) };
  }));
  const discoveredOperations = discovered.flatMap(({ kind, values }) => values.map((value) => ({
    updateOne: {
      filter: { user_id: userId, kind, normalized_value: normalizeTaxonomyValue(value) },
      update: { $setOnInsert: { user_id: userId, kind, value, normalized_value: normalizeTaxonomyValue(value), active: true, is_default: false } },
      upsert: true,
    },
  })));
  if (discoveredOperations.length) await ContentTaxonomy.bulkWrite(discoveredOperations);
}

function buildAnalyticsBreakdown(posts, field) {
  const groups = new Map();
  posts.forEach((post) => {
    const value = post[field] || 'Sin clasificar';
    const current = groups.get(value) || { value, posts: 0, posts_with_metrics: 0, impresiones: 0, reacciones: 0, comentarios: 0, compartidos: 0, guardados: 0, engagement_rate_sum: 0, engagement_rate_samples: 0 };
    current.posts += 1;
    metricFields.forEach((metric) => { current[metric] += metricValue(post, metric); });
    if (hasRecordedMetrics(post)) {
      current.posts_with_metrics += 1;
      const postInteractions = metricValue(post, 'reacciones') + metricValue(post, 'comentarios') + metricValue(post, 'compartidos') + metricValue(post, 'guardados');
      if (metricValue(post, 'impresiones') > 0) {
        current.engagement_rate_sum += (postInteractions / metricValue(post, 'impresiones')) * 100;
        current.engagement_rate_samples += 1;
      }
    }
    groups.set(value, current);
  });
  return Array.from(groups.values()).map((group) => {
    const interactions = group.reacciones + group.comentarios + group.compartidos + group.guardados;
    const divisor = group.posts_with_metrics;
    return {
      value: group.value,
      posts: group.posts,
      posts_with_metrics: group.posts_with_metrics,
      views: group.impresiones,
      likes: group.reacciones,
      comments: group.comentarios,
      shares: group.compartidos,
      saves: group.guardados,
      impresiones: group.impresiones,
      reacciones: group.reacciones,
      comentarios: group.comentarios,
      compartidos: group.compartidos,
      guardados: group.guardados,
      interactions,
      average_views: divisor ? Math.round(group.impresiones / divisor) : 0,
      average_interactions: divisor ? Math.round((interactions / divisor) * 10) / 10 : 0,
      engagement_rate: group.engagement_rate_samples ? Math.round((group.engagement_rate_sum / group.engagement_rate_samples) * 100) / 100 : 0,
    };
  }).sort((a, b) => b.views - a.views);
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

async function getDefaultStrategyProfile(userId) {
  return ContentStrategyProfile.findOne({
    user_id: userId,
    is_default: true,
  }).sort({ updatedAt: -1 });
}

async function serializePlan(plan) {
  const items = await ContentPlanItem.find({
    plan_id: plan._id,
    user_id: plan.user_id,
  }).sort({ week_index: 1, suggested_date: 1, createdAt: 1 });

  return {
    ...plan.toObject(),
    items,
  };
}

function buildLookbackWindow(planStartDate) {
  const start = new Date(planStartDate);
  const windowStart = new Date(start);
  windowStart.setDate(windowStart.getDate() - 30);
  return { windowStart, planStart: start };
}

function normalizePublishedLookbackPost(post) {
  return {
    source: 'published',
    date: post.date,
    text: post.text || '',
    content_type: post.post_type || '',
    metrics: {
      views: post.views || 0,
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
    },
  };
}

function normalizePlannedLookbackPost(post) {
  return {
    source: 'planned',
    date: post.scheduled_datetime,
    text: post.content || '',
    content_type: post.state === 'planificado' ? 'planner_scheduled' : 'planner_ready',
    metrics: null,
  };
}

function normalizeLockedCalendarPost(post) {
  return {
    id: String(post._id),
    scheduled_datetime: post.scheduled_datetime,
    state: post.state,
    content: post.content || '',
  };
}

async function getPlanningContext(userId, planStartDate) {
  const { windowStart, planStart } = buildLookbackWindow(planStartDate);

  const [recommendation, publishedLookbackPosts, plannedLookbackPosts] = await Promise.all([
    Recommendation.findOne({ user_id: userId }).sort({ date_generated: -1 }),
    LinkedInPost.find({
      user_id: userId,
      date: { $gte: windowStart, $lt: planStart },
    }).sort({ date: 1 }),
    PlannerPost.find({
      user_id: userId,
      state: { $in: ['listo', 'planificado'] },
      scheduled_datetime: { $gte: windowStart, $lt: planStart },
    }).sort({ scheduled_datetime: 1 }),
  ]);

  const recentEditorialContext = [
    ...publishedLookbackPosts.map((post) => normalizePublishedLookbackPost(post)),
    ...plannedLookbackPosts.map((post) => normalizePlannedLookbackPost(post)),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    recommendation,
    publishedLookbackPosts,
    plannedLookbackPosts,
    recentEditorialContext,
  };
}

function getGenerationContext(strategy, planInput, recommendation, planningContext, styleFingerprint) {
  return {
    strategy_snapshot: strategy,
    recommendation_summary: recommendation ? {
      id: recommendation._id,
      tipos_de_contenido: recommendation.tipos_de_contenido,
      mejores_horarios: recommendation.mejores_horarios,
      longitud_optima: recommendation.longitud_optima,
      frecuencia_recomendada: recommendation.frecuencia_recomendada,
      estrategias_de_engagement: recommendation.estrategias_de_engagement,
    } : null,
    lookback_window_days: 30,
    published_lookback_count: planningContext.publishedLookbackPosts.length,
    planned_lookback_count: planningContext.plannedLookbackPosts.length,
    locked_calendar_posts_count: planningContext.lockedCalendarPosts?.length || 0,
    style_fingerprint: styleFingerprint,
    plan_input: planInput,
  };
}

function buildPlanTitle(planInput) {
  const startDate = planInput.start_date ? new Date(planInput.start_date) : new Date();
  const month = startDate.toLocaleString('es-ES', { month: 'long' });
  return planInput.title || `Plan LinkedIn ${month} ${startDate.getFullYear()}`;
}

function validatePlanStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === 'archived' && nextStatus !== 'archived') return false;
  if (currentStatus === 'approved' && nextStatus === 'draft') return false;
  return ['draft', 'approving', 'approved', 'archived'].includes(nextStatus);
}

function buildPlannerPostContentFromItem(item) {
  return [
    item.hook_idea,
    '',
    `Tema: ${item.topic}`,
    `Enfoque: ${item.angle}`,
    item.pain_point ? `Dolor: ${item.pain_point}` : '',
    item.contrarian_insight ? `Idea contraintuitiva: ${item.contrarian_insight}` : '',
    '',
    ...(item.supporting_points || []).map((point) => `- ${point}`),
    '',
    `CTA sugerido: ${item.cta}`,
  ].filter(Boolean).join('\n');
}

async function buildOrUpdatePostFromPlanItem({
  userId,
  item,
  strategy,
  plan,
  recommendation,
  recentEditorialContext,
  styleFingerprint,
}) {
  const planContext = {
    strategy,
    plan,
    planItem: item,
  };

  const generatedContent = await generatePlannedPostContent({
    planContext,
    recentRecommendation: recommendation,
    recentEditorialContext,
    styleFingerprint,
  });

  const scheduledDateTime = item.suggested_date
    ? new Date(item.suggested_date)
    : null;

  if (scheduledDateTime && item.suggested_time) {
    const [hours, minutes] = item.suggested_time.split(':').map((value) => Number(value || 0));
    scheduledDateTime.setHours(hours || 0, minutes || 0, 0, 0);
  }

  let post = null;
  if (item.linked_planner_post_id) {
    post = await PlannerPost.findOne({
      _id: item.linked_planner_post_id,
      user_id: userId,
    });
  }

    if (!post) {
      post = await PlannerPost.create({
        user_id: userId,
        content: generatedContent,
        content_type: item.content_type || '',
        state: scheduledDateTime ? 'planificado' : 'listo',
        scheduled_datetime: scheduledDateTime ? scheduledDateTime.toISOString() : null,
        plan_item_id: item._id,
      });
    } else {
      post.content = generatedContent;
      post.content_type = item.content_type || post.content_type || '';
      post.state = scheduledDateTime ? 'planificado' : 'listo';
      post.scheduled_datetime = scheduledDateTime ? scheduledDateTime.toISOString() : null;
      post.plan_item_id = item._id;
    await post.save();
  }

  item.linked_planner_post_id = post._id;
  item.status = 'converted_to_post';
  await item.save();

  return post;
}

// GET /api/planner/posts - Get all planner posts
router.get('/posts', auth, async (req, res, next) => {
  try {
    const filter = {
      user_id: req.userId,
      state: { $ne: 'eliminado' },
    };
    if (req.query.state) filter.state = req.query.state;
    if (req.query.linea_editorial) filter.linea_editorial = req.query.linea_editorial;
    const posts = await PlannerPost.find(filter).sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/posts/find-by-text - Resolve a screenshot excerpt to a planner _id.
router.get('/posts/find-by-text', auth, async (req, res, next) => {
  try {
    const text = normalizeSearchText(req.query.text);
    if (text.length < 3) return res.status(400).json({ error: 'Indica al menos 3 caracteres de texto' });

    const candidates = await PlannerPost.find({ user_id: req.userId, state: { $ne: 'eliminado' } })
      .select('_id titulo content state')
      .sort({ updatedAt: -1 });
    const matches = candidates.flatMap((post) => {
      const content = normalizeSearchText(post.content);
      const position = content.indexOf(text);
      if (position < 0) return [];
      const matchType = position === 0 ? 'empieza_por' : 'contiene';
      const coverage = Math.min(1, text.length / Math.max(content.length, 1));
      const stateBoost = post.state === 'publicado' ? 0.08 : 0;
      const score = Math.round(((position === 0 ? 1 : 0.72) + coverage * 0.2 + stateBoost - Math.min(position, 500) / 5000) * 1000) / 1000;
      return [{
        _id: post._id,
        titulo: post.titulo || '',
        content_preview: String(post.content || '').split('\n').slice(0, 3).join('\n').slice(0, 500),
        state: post.state,
        match_type: matchType,
        similarity_score: score,
      }];
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    res.json(matches.slice(0, 20));
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/taxonomies - List the user's content taxonomies.
router.get('/taxonomies', auth, async (req, res, next) => {
  try {
    await ensureDefaultTaxonomies(req.userId);
    const filter = { user_id: req.userId };
    if (req.query.include_inactive !== 'true') filter.active = true;
    const taxonomies = await ContentTaxonomy.find(filter).sort({ kind: 1, sort_order: 1, value: 1 });
    res.json(taxonomies);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/taxonomies - Create or reactivate a taxonomy value.
router.post('/taxonomies', auth, async (req, res, next) => {
  try {
    const kind = String(req.body.kind || '');
    const value = String(req.body.value || '').trim();
    if (!TAXONOMY_KINDS.includes(kind)) return res.status(400).json({ error: 'Tipo de taxonomía no válido' });
    if (!value) return res.status(400).json({ error: 'El valor es obligatorio' });

    await ensureDefaultTaxonomies(req.userId);
    const normalizedValue = normalizeTaxonomyValue(value);
    const existing = await ContentTaxonomy.findOne({ user_id: req.userId, kind, normalized_value: normalizedValue });
    if (existing?.active) return res.status(409).json({ error: 'Ese valor ya existe' });
    if (existing) {
      existing.value = value;
      existing.active = true;
      await existing.save();
      return res.json(existing);
    }

    const last = await ContentTaxonomy.findOne({ user_id: req.userId, kind }).sort({ sort_order: -1 });
    const taxonomy = await ContentTaxonomy.create({
      user_id: req.userId,
      kind,
      value,
      normalized_value: normalizedValue,
      active: true,
      sort_order: Number(last?.sort_order || 0) + 1,
    });
    res.status(201).json(taxonomy);
  } catch (error) {
    next(error);
  }
});

// PUT /api/planner/taxonomies/:id - Rename, reorder, or reactivate a taxonomy.
router.put('/taxonomies/:id', auth, async (req, res, next) => {
  try {
    const taxonomy = await ContentTaxonomy.findOne({ _id: req.params.id, user_id: req.userId });
    if (!taxonomy) return res.status(404).json({ error: 'Taxonomía no encontrada' });

    const previousValue = taxonomy.value;
    if (req.body.value !== undefined) {
      const value = String(req.body.value || '').trim();
      if (!value) return res.status(400).json({ error: 'El valor es obligatorio' });
      const normalizedValue = normalizeTaxonomyValue(value);
      const duplicate = await ContentTaxonomy.findOne({
        _id: { $ne: taxonomy._id },
        user_id: req.userId,
        kind: taxonomy.kind,
        normalized_value: normalizedValue,
      });
      if (duplicate) return res.status(409).json({ error: 'Ese valor ya existe' });
      taxonomy.value = value;
      taxonomy.normalized_value = normalizedValue;
    }
    if (req.body.active !== undefined) taxonomy.active = Boolean(req.body.active);
    if (req.body.sort_order !== undefined) taxonomy.sort_order = Number(req.body.sort_order || 0);
    await taxonomy.save();

    if (taxonomy.value !== previousValue) {
      const field = taxonomyFieldMap[taxonomy.kind];
      await Promise.all([
        PlannerPost.updateMany({ user_id: req.userId, [field]: previousValue }, { $set: { [field]: taxonomy.value } }),
        LinkedInPost.updateMany({ user_id: req.userId, [field]: previousValue }, { $set: { [field]: taxonomy.value } }),
      ]);
    }
    res.json(taxonomy);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/planner/taxonomies/:id - Hide a value without altering historical posts.
router.delete('/taxonomies/:id', auth, async (req, res, next) => {
  try {
    const taxonomy = await ContentTaxonomy.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { active: false },
      { new: true }
    );
    if (!taxonomy) return res.status(404).json({ error: 'Taxonomía no encontrada' });
    res.json(taxonomy);
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/analytics - Published post performance with editorial filters.
router.get('/analytics', auth, async (req, res, next) => {
  try {
    const filter = { user_id: req.userId, state: 'publicado' };
    TAXONOMY_KINDS.forEach((kind) => {
      if (req.query[kind]) filter[kind] = req.query[kind];
    });
    const posts = await PlannerPost.find(filter).sort({ scheduled_datetime: -1, createdAt: -1 });
    const canonicalTotals = posts.reduce((acc, post) => {
      metricFields.forEach((metric) => { acc[metric] += metricValue(post, metric); });
      return acc;
    }, { impresiones: 0, reacciones: 0, comentarios: 0, compartidos: 0, guardados: 0 });
    const totals = {
      views: canonicalTotals.impresiones,
      likes: canonicalTotals.reacciones,
      comments: canonicalTotals.comentarios,
      shares: canonicalTotals.compartidos,
      saves: canonicalTotals.guardados,
    };
    const postsWithMetrics = posts.filter(hasRecordedMetrics);
    const interactions = totals.likes + totals.comments + totals.shares + totals.saves;
    const engagementRates = postsWithMetrics
      .filter((post) => metricValue(post, 'impresiones') > 0)
      .map((post) => ((metricValue(post, 'reacciones') + metricValue(post, 'comentarios') + metricValue(post, 'compartidos') + metricValue(post, 'guardados')) / metricValue(post, 'impresiones')) * 100);
    const metricDivisor = postsWithMetrics.length;
    const summary = {
      posts: posts.length,
      posts_with_metrics: metricDivisor,
      ...canonicalTotals,
      ...totals,
      interactions,
      average_views: metricDivisor ? Math.round(totals.views / metricDivisor) : 0,
      average_interactions: metricDivisor ? Math.round((interactions / metricDivisor) * 10) / 10 : 0,
      average_likes: metricDivisor ? Math.round((totals.likes / metricDivisor) * 10) / 10 : 0,
      average_comments: metricDivisor ? Math.round((totals.comments / metricDivisor) * 10) / 10 : 0,
      average_shares: metricDivisor ? Math.round((totals.shares / metricDivisor) * 10) / 10 : 0,
      average_saves: metricDivisor ? Math.round((totals.saves / metricDivisor) * 10) / 10 : 0,
      engagement_rate: engagementRates.length ? Math.round((engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length) * 100) / 100 : 0,
    };
    res.json({
      summary,
      breakdowns: {
        linea_editorial: buildAnalyticsBreakdown(posts, 'linea_editorial'),
        funcion_editorial: buildAnalyticsBreakdown(posts, 'funcion_editorial'),
        formato: buildAnalyticsBreakdown(posts, 'formato'),
      },
      posts,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/posts - Create a new planner post
router.post('/posts', auth, async (req, res, next) => {
  try {
    const { content, content_type, state = 'borrador', scheduled_datetime, plan_item_id, ...metadata } = pickEditable(req.body);
    const metrics = pickMetrics(req.body);
    const measurementDate = req.body.fecha_medicion ?? req.body.metrics_updated_at;
    if (Object.keys(metrics).length) metadata.fecha_medicion = measurementDate ? new Date(measurementDate) : new Date();

    const post = new PlannerPost({
      user_id: req.userId,
      content: content || '',
      content_type: content_type || '',
      state,
      scheduled_datetime: ['planificado', 'publicado'].includes(state) ? (scheduled_datetime || null) : null,
      plan_item_id: plan_item_id || null,
      ...metadata,
      ...metrics,
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// PUT /api/planner/posts/:id - Update a planner post
router.put('/posts/:id', auth, async (req, res, next) => {
  try {
    const { content, content_type, state, scheduled_datetime, plan_item_id, ...metadata } = pickEditable(req.body);
    const updates = { ...metadata };
    const metrics = pickMetrics(req.body);
    const measurementDate = req.body.fecha_medicion ?? req.body.metrics_updated_at;
    if (Object.keys(metrics).length) {
      Object.assign(updates, metrics);
      metricDefinitions.forEach(({ field, legacy }) => { if (metrics[field] === null) updates[legacy] = null; });
      updates.fecha_medicion = measurementDate ? new Date(measurementDate) : new Date();
    }

    if (content !== undefined) updates.content = content;
    if (content_type !== undefined) updates.content_type = content_type;
    if (state !== undefined) updates.state = state;
    if (state !== undefined && !['planificado', 'publicado'].includes(state)) updates.scheduled_datetime = null;
    else if (scheduled_datetime !== undefined) updates.scheduled_datetime = scheduled_datetime;
    if (plan_item_id !== undefined) updates.plan_item_id = plan_item_id;

    const post = await PlannerPost.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/posts/:id/publish - close the idea → metrics loop.
router.post('/posts/:id/publish', auth, async (req, res, next) => {
  try {
    const { published_post_url, scheduled_datetime } = req.body;
    const metrics = pickMetrics(req.body);
    const updates = { state: 'publicado', ...metrics };
    metricDefinitions.forEach(({ field, legacy }) => { if (metrics[field] === null) updates[legacy] = null; });
    if (published_post_url !== undefined) updates.published_post_url = published_post_url;
    if (scheduled_datetime !== undefined) updates.scheduled_datetime = scheduled_datetime;
    if (Object.keys(metrics).length) updates.fecha_medicion = req.body.fecha_medicion ? new Date(req.body.fecha_medicion) : new Date();
    const post = await PlannerPost.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    res.json(post);
  } catch (error) { next(error); }
});

// PUT /api/planner/posts/:id/metrics - Metrics are always keyed by planner _id.
router.put('/posts/:id/metrics', auth, async (req, res, next) => {
  try {
    if (!PlannerPost.base.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'El id del planner no es válido' });
    }
    const metrics = pickMetrics(req.body);
    if (!Object.keys(metrics).length && req.body.fecha_medicion === undefined) {
      return res.status(400).json({ error: 'Incluye al menos una métrica o fecha_medicion' });
    }
    for (const [field, value] of Object.entries(metrics)) {
      if (value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        return res.status(400).json({ error: `${field} debe ser un número positivo o null` });
      }
      metrics[field] = value === null ? null : Number(value);
    }
    const fechaMedicion = req.body.fecha_medicion === null
      ? null
      : req.body.fecha_medicion ? new Date(req.body.fecha_medicion) : new Date();
    if (fechaMedicion instanceof Date && Number.isNaN(fechaMedicion.getTime())) {
      return res.status(400).json({ error: 'fecha_medicion no es una fecha válida' });
    }
    const updates = { ...metrics, fecha_medicion: fechaMedicion };
    // Clearing canonical metrics must also clear legacy fallbacks.
    metricDefinitions.forEach(({ field, legacy }) => { if (metrics[field] === null) updates[legacy] = null; });
    const post = await PlannerPost.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ error: 'Post del planner no encontrado' });
    res.json(post);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/posts/:id/optimizations - Save post optimization
router.post('/posts/:id/optimizations', auth, async (req, res, next) => {
  try {
    const { original_content, optimized_content, plan_item_id } = req.body;

    const optimization = new PostOptimization({
      post_id: req.params.id,
      user_id: req.userId,
      plan_item_id: plan_item_id || null,
      original_content,
      optimized_content,
    });

    await optimization.save();
    res.status(201).json(optimization);
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/strategy
router.get('/strategy', auth, async (req, res, next) => {
  try {
    const strategy = await getDefaultStrategyProfile(req.userId);
    res.json(strategy);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/strategy
router.post('/strategy', auth, async (req, res, next) => {
  try {
    const payload = {
      user_id: req.userId,
      target_audience: req.body.target_audience || '',
      tone: req.body.tone || '',
      core_topics: normalizeStringArray(req.body.core_topics),
      goals: normalizeStringArray(req.body.goals),
      content_formats: normalizeStringArray(req.body.content_formats),
      extra_instructions: req.body.extra_instructions || '',
      channel: 'linkedin',
      is_default: req.body.is_default !== false,
    };

    let strategy = await getDefaultStrategyProfile(req.userId);
    if (strategy) {
      Object.assign(strategy, payload);
      await strategy.save();
    } else {
      strategy = await ContentStrategyProfile.create(payload);
    }

    res.status(201).json(strategy);
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/plans
router.get('/plans', auth, async (req, res, next) => {
  try {
    const plans = await ContentPlan.find({ user_id: req.userId }).sort({ createdAt: -1 });
    const planIds = plans.map((plan) => plan._id);
    const items = await ContentPlanItem.find({
      user_id: req.userId,
      plan_id: { $in: planIds },
    }).sort({ week_index: 1, suggested_date: 1, createdAt: 1 });

    const itemsByPlan = items.reduce((acc, item) => {
      const key = String(item.plan_id);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    res.json(plans.map((plan) => ({
      ...plan.toObject(),
      items: itemsByPlan[String(plan._id)] || [],
    })));
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/plans/generate
router.post('/plans/generate', auth, async (req, res, next) => {
  try {
    const strategyInput = req.body.strategy || {};
    const planInput = req.body.plan || {};

    const strategy = await ContentStrategyProfile.findOneAndUpdate(
      { user_id: req.userId, is_default: true },
      {
        user_id: req.userId,
        target_audience: strategyInput.target_audience || '',
        tone: strategyInput.tone || '',
        core_topics: normalizeStringArray(strategyInput.core_topics),
        goals: normalizeStringArray(strategyInput.goals),
        content_formats: normalizeStringArray(strategyInput.content_formats),
        extra_instructions: strategyInput.extra_instructions || '',
        channel: 'linkedin',
        is_default: true,
      },
      { new: true, upsert: true }
    );

    const startDate = planInput.start_date ? new Date(planInput.start_date) : new Date();
    const durationInWeeks = Math.max(Number(planInput.duration_in_weeks || 4), 1);
    const endDate = planInput.end_date
      ? new Date(planInput.end_date)
      : new Date(startDate.getTime() + ((durationInWeeks * 7) - 1) * 24 * 60 * 60 * 1000);

    const [planningContext, lockedCalendarPosts] = await Promise.all([
      getPlanningContext(req.userId, startDate),
      PlannerPost.find({
        user_id: req.userId,
        state: { $ne: 'eliminado' },
        scheduled_datetime: { $gte: startDate, $lte: endDate },
      }).sort({ scheduled_datetime: 1 }),
    ]);

    const generationResult = await generateContentPlan({
      strategy: strategy.toObject(),
      planConfig: {
        ...planInput,
        start_date: startDate,
        end_date: endDate,
      },
      recommendation: planningContext.recommendation,
      recentEditorialContext: planningContext.recentEditorialContext,
      lockedCalendarPosts: lockedCalendarPosts.map((post) => normalizeLockedCalendarPost(post)),
    });

    const contentPlan = await ContentPlan.create({
      user_id: req.userId,
      strategy_profile_id: strategy._id,
      title: buildPlanTitle(planInput),
      status: 'draft',
      start_date: startDate,
      end_date: endDate,
      cadence_mode: planInput.cadence_mode || 'weekly_frequency',
      cadence: {
        posts_per_week: Number(planInput.posts_per_week || 2),
        preferred_days: normalizeStringArray(planInput.preferred_days),
        preferred_times: normalizeStringArray(planInput.preferred_times),
        duration_in_weeks: durationInWeeks,
      },
      generation_context: {
        summary: generationResult.summary,
        ...getGenerationContext(
          strategy.toObject(),
          planInput,
          planningContext.recommendation,
          {
            ...planningContext,
            lockedCalendarPosts,
          },
          generationResult.styleFingerprint
        ),
      },
      source_recommendation_id: planningContext.recommendation?._id || null,
    });

    const items = await ContentPlanItem.insertMany(
      (generationResult.items || []).map((item, index) => ({
        plan_id: contentPlan._id,
        user_id: req.userId,
        week_index: Number(item.week_index || Math.floor(index / Math.max(Number(planInput.posts_per_week || 2), 1)) + 1),
        suggested_date: item.suggested_date ? new Date(item.suggested_date) : null,
        suggested_time: item.suggested_time || '',
        content_type: item.content_type || '',
        topic: item.topic || '',
        angle: item.angle || '',
        pain_point: item.pain_point || '',
        contrarian_insight: item.contrarian_insight || '',
        objective: item.objective || '',
        cta: item.cta || '',
        hook_idea: item.hook_idea || '',
        supporting_points: normalizeStringArray(item.supporting_points),
        extra_instructions: item.extra_instructions || item.notes || '',
        status: 'draft',
        linked_planner_post_id: item.existing_post_id || null,
      }))
    );

    res.status(201).json({
      ...contentPlan.toObject(),
      items,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/plans/:id
router.get('/plans/:id', auth, async (req, res, next) => {
  try {
    const plan = await ContentPlan.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(await serializePlan(plan));
  } catch (error) {
    next(error);
  }
});

// PUT /api/planner/plans/:id
router.put('/plans/:id', auth, async (req, res, next) => {
  try {
    const plan = await ContentPlan.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const nextStatus = req.body.status;
    if (nextStatus && !validatePlanStatusTransition(plan.status, nextStatus)) {
      return res.status(400).json({ error: 'Transición de estado no permitida' });
    }

    if (req.body.title !== undefined) plan.title = req.body.title;
    if (req.body.status !== undefined) plan.status = req.body.status;
    if (req.body.start_date !== undefined) plan.start_date = req.body.start_date;
    if (req.body.end_date !== undefined) plan.end_date = req.body.end_date;
    if (req.body.cadence_mode !== undefined) plan.cadence_mode = req.body.cadence_mode;
    if (req.body.cadence !== undefined) plan.cadence = req.body.cadence;

    await plan.save();
    res.json(await serializePlan(plan));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/planner/plans/:id
router.delete('/plans/:id', auth, async (req, res, next) => {
  try {
    const plan = await ContentPlan.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const items = await ContentPlanItem.find({
      plan_id: plan._id,
      user_id: req.userId,
    });

    const linkedPostIds = items
      .map((item) => item.linked_planner_post_id)
      .filter(Boolean);

    if (linkedPostIds.length > 0) {
      await PlannerPost.deleteMany({
        _id: { $in: linkedPostIds },
        user_id: req.userId,
      });

      await PostOptimization.deleteMany({
        post_id: { $in: linkedPostIds },
        user_id: req.userId,
      });
    }

    await ContentPlanItem.deleteMany({
      plan_id: plan._id,
      user_id: req.userId,
    });

    await ContentPlan.deleteOne({
      _id: plan._id,
      user_id: req.userId,
    });

    res.json({
      success: true,
      deleted_plan_id: req.params.id,
      deleted_posts: linkedPostIds.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/plans/:id/approve
router.post('/plans/:id/approve', auth, async (req, res, next) => {
  let plan = null;
  try {
    plan = await ContentPlan.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    if (plan.status === 'archived') {
      return res.status(400).json({ error: 'No se puede aprobar un plan archivado' });
    }

    if (plan.status === 'approving') {
      return res.status(409).json({ error: 'Este plan ya se está aprobando y generando.' });
    }

    plan.status = 'approving';
    await plan.save();

    const [strategy, planningContext, items] = await Promise.all([
      ContentStrategyProfile.findOne({
        _id: plan.strategy_profile_id,
        user_id: req.userId,
      }),
      getPlanningContext(req.userId, plan.start_date),
      ContentPlanItem.find({
        plan_id: plan._id,
        user_id: req.userId,
      }).sort({ week_index: 1, suggested_date: 1, createdAt: 1 }),
    ]);

    if (!items.length) {
      return res.status(400).json({ error: 'El plan no tiene piezas para aprobar' });
    }

    for (const item of items) {
      await buildOrUpdatePostFromPlanItem({
        userId: req.userId,
        item,
        strategy,
        plan,
        recommendation: planningContext.recommendation,
        recentEditorialContext: planningContext.recentEditorialContext,
        styleFingerprint: plan.generation_context?.style_fingerprint || null,
      });
    }

    plan.status = 'approved';
    await plan.save();

    res.json(await serializePlan(plan));
  } catch (error) {
    if (plan && plan.status === 'approving') {
      plan.status = 'draft';
      await plan.save().catch(() => null);
    }
    next(error);
  }
});

// PUT /api/planner/plans/:planId/items/:itemId
router.put('/plans/:planId/items/:itemId', auth, async (req, res, next) => {
  try {
    const item = await ContentPlanItem.findOne({
      _id: req.params.itemId,
      plan_id: req.params.planId,
      user_id: req.userId,
    });

    if (!item) {
      return res.status(404).json({ error: 'Pieza no encontrada' });
    }

    const fields = [
      'week_index',
      'suggested_time',
      'content_type',
      'topic',
      'angle',
      'pain_point',
      'contrarian_insight',
      'objective',
      'cta',
      'hook_idea',
      'extra_instructions',
      'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    if (req.body.suggested_date !== undefined) {
      item.suggested_date = req.body.suggested_date ? new Date(req.body.suggested_date) : null;
    }
    if (req.body.supporting_points !== undefined) {
      item.supporting_points = normalizeStringArray(req.body.supporting_points);
    }

    await item.save();
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/plans/:planId/items/:itemId/regenerate
router.post('/plans/:planId/items/:itemId/regenerate', auth, async (req, res, next) => {
  try {
    const [plan, item] = await Promise.all([
      ContentPlan.findOne({ _id: req.params.planId, user_id: req.userId }),
      ContentPlanItem.findOne({
        _id: req.params.itemId,
        plan_id: req.params.planId,
        user_id: req.userId,
      }),
    ]);

    if (!plan || !item) {
      return res.status(404).json({ error: 'Plan o pieza no encontrados' });
    }

    const strategy = await ContentStrategyProfile.findOne({ _id: plan.strategy_profile_id, user_id: req.userId });
    const planningContext = await getPlanningContext(req.userId, plan.start_date);

    const generated = await generateContentPlan({
      strategy: strategy?.toObject() || {},
      planConfig: {
        title: plan.title,
        start_date: plan.start_date,
        end_date: plan.end_date,
        posts_per_week: plan.cadence?.posts_per_week || 2,
        duration_in_weeks: plan.cadence?.duration_in_weeks || 4,
        preferred_days: plan.cadence?.preferred_days || [],
        preferred_times: plan.cadence?.preferred_times || [],
        extra_instructions: req.body.extra_instructions || item.extra_instructions || '',
      },
      recommendation: planningContext.recommendation,
      recentEditorialContext: planningContext.recentEditorialContext,
    });

    const candidate = generated.items?.[0];
    if (!candidate) {
      return res.status(500).json({ error: 'No se pudo regenerar la pieza' });
    }

    item.content_type = candidate.content_type || item.content_type;
    item.topic = candidate.topic || item.topic;
    item.angle = candidate.angle || item.angle;
    item.pain_point = candidate.pain_point || item.pain_point;
    item.contrarian_insight = candidate.contrarian_insight || item.contrarian_insight;
    item.objective = candidate.objective || item.objective;
    item.cta = candidate.cta || item.cta;
    item.hook_idea = candidate.hook_idea || item.hook_idea;
    item.supporting_points = normalizeStringArray(candidate.supporting_points);
    item.extra_instructions = req.body.extra_instructions || candidate.extra_instructions || item.extra_instructions;
    item.suggested_time = candidate.suggested_time || item.suggested_time;
    if (candidate.suggested_date) item.suggested_date = new Date(candidate.suggested_date);
    item.status = 'draft';
    await item.save();

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/plans/:planId/items/:itemId/convert
router.post('/plans/:planId/items/:itemId/convert', auth, async (req, res, next) => {
  try {
    const [plan, item] = await Promise.all([
      ContentPlan.findOne({ _id: req.params.planId, user_id: req.userId }),
      ContentPlanItem.findOne({
        _id: req.params.itemId,
        plan_id: req.params.planId,
        user_id: req.userId,
      }),
    ]);

    if (!plan || !item) {
      return res.status(404).json({ error: 'Pieza no encontrada' });
    }

    const [strategy, planningContext] = await Promise.all([
      ContentStrategyProfile.findOne({
        _id: plan.strategy_profile_id,
        user_id: req.userId,
      }),
      getPlanningContext(req.userId, plan.start_date),
    ]);

    const post = await buildOrUpdatePostFromPlanItem({
      userId: req.userId,
      item,
      strategy,
      plan,
      recommendation: planningContext.recommendation,
      recentEditorialContext: planningContext.recentEditorialContext,
      styleFingerprint: plan.generation_context?.style_fingerprint || null,
    });

    res.status(201).json({
      post,
      item,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planner/plans/:planId/items/:itemId/context
router.get('/plans/:planId/items/:itemId/context', auth, async (req, res, next) => {
  try {
    const [plan, item, strategy, planningContext] = await Promise.all([
      ContentPlan.findOne({ _id: req.params.planId, user_id: req.userId }),
      ContentPlanItem.findOne({ _id: req.params.itemId, plan_id: req.params.planId, user_id: req.userId }),
      ContentPlan.findOne({ _id: req.params.planId, user_id: req.userId })
        .then((doc) => doc ? ContentStrategyProfile.findById(doc.strategy_profile_id) : null),
      ContentPlan.findOne({ _id: req.params.planId, user_id: req.userId })
        .then((doc) => doc ? getPlanningContext(req.userId, doc.start_date) : null),
    ]);

    if (!plan || !item) {
      return res.status(404).json({ error: 'Plan o pieza no encontrados' });
    }

    res.json({
      plan,
      planItem: item,
      strategy,
      recommendation: planningContext?.recommendation || null,
      historicalPosts: planningContext?.recentEditorialContext || [],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/posts/:id/optimize
router.post('/posts/:id/optimize', auth, async (req, res, next) => {
  try {
    const post = await PlannerPost.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const draftContent = req.body.content || post.content || '';
    if (!draftContent.trim()) {
      return res.status(400).json({ error: 'No hay contenido para optimizar' });
    }

    let planContext = null;
    let planItem = null;
    let plan = null;
    let strategy = await getDefaultStrategyProfile(req.userId);

    if (post.plan_item_id) {
      planItem = await ContentPlanItem.findOne({ _id: post.plan_item_id, user_id: req.userId });
      if (planItem) {
        plan = await ContentPlan.findOne({ _id: planItem.plan_id, user_id: req.userId });
        if (plan) {
          strategy = await ContentStrategyProfile.findOne({
            _id: plan.strategy_profile_id,
            user_id: req.userId,
          });
        }
      }
    }

    const planningContext = await getPlanningContext(req.userId, plan?.start_date || new Date());

    planContext = {
      strategy,
      plan,
      planItem,
    };

    const optimizedContent = await optimizePlannedPost({
      draftContent,
      planContext,
      recentRecommendation: planningContext.recommendation,
      historicalPosts: planningContext.recentEditorialContext,
    });

    res.json({
      optimized_content: optimizedContent,
      context_used: {
        has_strategy: Boolean(strategy),
        has_plan_item: Boolean(planItem),
        has_recommendation: Boolean(planningContext.recommendation),
        historical_posts_count: planningContext.recentEditorialContext.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
