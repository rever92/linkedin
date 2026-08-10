import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_PRIORITY = [
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
];

const GENERIC_FILLERS = [
  'innovación',
  'liderazgo',
  'productividad',
  'negocio',
  'transformación digital',
  'adopción tecnológica',
];

const GENERIC_BRIEF_PHRASES = [
  'conecta',
  'desde una perspectiva práctica y diferenciada',
  'aborda un único dolor concreto',
  'hook específico y fuerte',
  'cta concreto',
  'punto 1',
  'punto 2',
  'punto 3',
  'tema/editorial concreto del subtema',
  'objetivo de negocio o contenido',
  'nota útil de desarrollo',
  'por qué esta pieza tiene sentido',
  'genera conversación',
  'reforzar posicionamiento',
];

const PAIN_LIBRARY = {
  default: [
    {
      pain: 'la audiencia sabe que tiene que moverse, pero no sabe por dónde empezar',
      angle: 'desmonta el primer error de enfoque que bloquea el avance',
      hook: 'La mayoría no fracasa por falta de intención, sino por arrancar por el sitio equivocado.',
      cta: '¿En qué punto concreto ves más bloqueo ahora mismo?',
      points: [
        'El síntoma visible que suele confundirse con el problema real.',
        'La decisión práctica que debería tomarse primero.',
        'Cómo detectar rápido si se está yendo por el camino equivocado.',
      ],
    },
    {
      pain: 'la audiencia tiene presión por obtener resultados, pero opera con expectativas poco realistas',
      angle: 'enfoca la conversación en una expectativa equivocada que conviene corregir',
      hook: 'El problema no es querer resultados rápidos, sino medir el progreso con la vara incorrecta.',
      cta: '¿Qué expectativa poco realista ves más repetida en tu entorno?',
      points: [
        'Qué promesa simplista suele comprarse demasiado pronto.',
        'Qué indicador o evidencia sí sirve para evaluar progreso.',
        'Qué conversación incómoda conviene abrir antes de seguir invirtiendo.',
      ],
    },
  ],
  ia: [
    {
      pain: 'quieren lanzar IA cuanto antes, pero no tienen un caso de uso con impacto económico claro',
      angle: 'plantea cómo elegir un primer caso de uso de IA sin caer en demos vistosas y poco útiles',
      hook: 'Muchos proyectos de IA fallan antes de empezar: se elige una demo atractiva en lugar de un problema caro.',
      cta: '¿Qué criterio usas hoy para decidir si un caso de IA merece priorizarse?',
      points: [
        'Qué señales indican que un caso de uso es más teatro que palanca de negocio.',
        'Qué proceso o cuello de botella sí justificaría empezar ya.',
        'Qué dato o métrica pedirías antes de aprobar el proyecto.',
      ],
    },
    {
      pain: 'compran herramientas de IA pero nadie cambia realmente su forma de trabajar',
      angle: 'explica por qué la fricción de adopción mata más iniciativas que la tecnología',
      hook: 'El mayor enemigo de la IA en empresa rara vez es el modelo: suele ser la adopción cotidiana.',
      cta: '¿Dónde ves más resistencia: en dirección, mandos intermedios o equipos?',
      points: [
        'Qué microfricciones hacen que la herramienta no llegue al día a día.',
        'Qué comportamiento concreto hay que rediseñar para que la IA se use de verdad.',
        'Qué señal temprana te diría que la adopción va a fracasar.',
      ],
    },
    {
      pain: 'la empresa habla de gobernanza, pero en realidad nadie sabe quién decide qué se puede usar',
      angle: 'aterriza la gobernanza de IA en decisiones operativas y ownership real',
      hook: 'Muchas compañías no tienen un problema de gobernanza de IA: tienen un problema de ambigüedad.',
      cta: '¿Quién tiene hoy la última palabra sobre uso, riesgos y priorización de IA en tu organización?',
      points: [
        'Qué decisiones de IA no deberían quedar en tierra de nadie.',
        'Qué ownership mínimo necesitas definir desde el principio.',
        'Qué riesgo aparece cuando “todos opinan” pero nadie responde.',
      ],
    },
    {
      pain: 'se quiere escalar IA, pero los datos y procesos siguen siendo demasiado caóticos',
      angle: 'muestra por qué muchas ambiciones de IA chocan antes con procesos rotos que con límites del modelo',
      hook: 'Antes de escalar IA, muchas empresas deberían preguntarse si su proceso actual merece ser escalado.',
      cta: '¿Qué proceso roto ves que más se intenta “parchear” con IA?',
      points: [
        'Qué tipo de caos operativo invalida un caso de IA aunque la tecnología funcione.',
        'Qué precondición mínima debería exigirse antes de automatizar.',
        'Cómo distinguir una ineficiencia resoluble de un problema estructural.',
      ],
    },
  ],
  gobernanza: [
    {
      pain: 'hay interés en IA, pero no existe un marco claro de riesgo, aprobación y supervisión',
      angle: 'convierte gobernanza en un sistema mínimo de decisión y control, no en burocracia',
      hook: 'La gobernanza útil no ralentiza la IA: evita que la organización improvise cada decisión crítica.',
      cta: '¿Qué decisión de riesgo IA se está tomando hoy sin marco claro?',
      points: [
        'Qué nivel de riesgo conviene clasificar desde el inicio.',
        'Qué decisiones deben escalarse y cuáles no.',
        'Qué error de gobernanza genera más retrasos después.',
      ],
    },
  ],
  transformacion: [
    {
      pain: 'la transformación se presenta como roadmap, pero en los equipos se vive como ruido adicional',
      angle: 'explica cómo traducir una transformación ambiciosa en cambios concretos del trabajo diario',
      hook: 'Una transformación no falla solo por estrategia: falla cuando nadie entiende qué cambia el lunes a las 9.',
      cta: '¿Qué parte de la transformación se percibe hoy más como ruido que como ayuda real?',
      points: [
        'Qué mensaje estratégico no está aterrizando en el equipo.',
        'Qué comportamiento cotidiano debería cambiar primero.',
        'Qué evidencia mostraría que la transformación ya se nota de verdad.',
      ],
    },
  ],
  liderazgo: [
    {
      pain: 'la dirección pide velocidad, pero el equipo percibe contradicciones en prioridades y expectativas',
      angle: 'plantea el liderazgo como diseño de foco y contexto, no solo presión por ejecutar',
      hook: 'A veces el equipo no avanza más rápido no por resistencia, sino porque recibe señales incompatibles.',
      cta: '¿Qué contradicción de liderazgo ves más a menudo cuando se impulsa cambio?',
      points: [
        'Qué mensaje del liderazgo genera más confusión de la que parece.',
        'Qué prioridad debería quedar explícitamente fuera para dar foco.',
        'Cómo detectar si el problema es ejecución o falta de contexto.',
      ],
    },
  ],
};

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

function getModel() {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return { genAI, models: MODEL_PRIORITY };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function countEmoji(text) {
  const matches = String(text || '').match(/[\u{1F300}-\u{1FAFF}]/gu);
  return matches ? matches.length : 0;
}

function buildWeekDate(startDate, weekIndex, slotIndex) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (weekIndex * 7) + Math.min(slotIndex * 2, 6));
  return date;
}

function getThemeBucket(topic) {
  const normalized = slugify(topic);
  if (normalized.includes('ia') || normalized.includes('inteligencia artificial')) return 'ia';
  if (normalized.includes('governance') || normalized.includes('gobernanza')) return 'gobernanza';
  if (normalized.includes('transformacion')) return 'transformacion';
  if (normalized.includes('liderazgo')) return 'liderazgo';
  return 'default';
}

function isTooGenericTopic(topic) {
  const normalized = slugify(topic);
  return GENERIC_FILLERS.some((item) => normalized === slugify(item));
}

function getPainCandidates(topic) {
  const bucket = getThemeBucket(topic);
  return [...(PAIN_LIBRARY[bucket] || []), ...(PAIN_LIBRARY.default || [])];
}

function extractHistoricalSignals(editorialContext) {
  return (editorialContext || [])
    .map((entry) => {
      const text = String(entry?.text || entry?.content || '').replace(/\s+/g, ' ').trim();
      return text ? text.slice(0, 180) : '';
    })
    .filter(Boolean)
    .slice(0, 5);
}

function buildSpecificTopic(baseTopic, slotIndex) {
  const normalizedTopic = String(baseTopic || '').trim();
  const prefixes = [
    'El error más caro en',
    'Cómo desbloquear',
    'La decisión crítica en',
    'Por qué fracasa',
    'Qué revisar antes de escalar',
  ];
  const prefix = prefixes[slotIndex % prefixes.length];
  if (isTooGenericTopic(normalizedTopic)) {
    return `${prefix.toLowerCase()} la iniciativa que parece prioritaria pero todavía no está lista`;
  }
  return `${prefix} ${normalizedTopic.toLowerCase()}`;
}

function dedupeEditorialContext(items) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = `${item.source}:${item.date}:${slugify(item.text || item.content || '')}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildStyleFingerprint(recentEditorialContext) {
  const texts = (recentEditorialContext || [])
    .map((entry) => String(entry?.text || entry?.content || '').trim())
    .filter(Boolean);

  if (!texts.length) {
    return {
      samples: 0,
      avg_length: 0,
      avg_paragraphs: 0,
      first_person_usage: 'unknown',
      question_usage: 'unknown',
      emoji_usage: 'unknown',
      opening_style: 'unknown',
      closing_style: 'unknown',
      tone_observed: 'unknown',
    };
  }

  const avgLength = Math.round(texts.reduce((acc, text) => acc + text.length, 0) / texts.length);
  const avgParagraphs = Math.round(
    texts.reduce((acc, text) => acc + text.split(/\n{2,}|\n/).filter(Boolean).length, 0) / texts.length
  );
  const firstPersonHits = texts.filter((text) => /\b(yo|me|mi|mis|mío|mía|nosotros|nuestro|nuestra)\b/i.test(text)).length;
  const questionHits = texts.filter((text) => /\?$/.test(text.trim()) || text.includes('?')).length;
  const emojiHits = texts.filter((text) => countEmoji(text) > 0).length;

  const openings = texts.slice(0, 5).map((text) => text.split(/\n/)[0].trim()).filter(Boolean);
  const closings = texts.slice(0, 5).map((text) => text.split(/\n/).filter(Boolean).slice(-1)[0]?.trim()).filter(Boolean);

  return {
    samples: texts.length,
    avg_length: avgLength,
    avg_paragraphs: avgParagraphs,
    first_person_usage: firstPersonHits >= Math.ceil(texts.length / 2) ? 'frequent' : 'limited',
    question_usage: questionHits >= Math.ceil(texts.length / 2) ? 'frequent' : 'limited',
    emoji_usage: emojiHits >= Math.ceil(texts.length / 2) ? 'frequent' : 'rare',
    opening_style: openings[0] || 'unknown',
    closing_style: closings[0] || 'unknown',
    tone_observed: avgParagraphs >= 6 ? 'conversational and structured' : 'compact and direct',
  };
}

function buildRepetitionIndex(recentEditorialContext) {
  return (recentEditorialContext || []).map((entry) => ({
    title_like: String(entry?.text || entry?.content || '').split(/\n/)[0].slice(0, 140),
    normalized: slugify(String(entry?.text || entry?.content || '').slice(0, 220)),
  }));
}

function hasHighSimilarity(candidate, repetitionIndex) {
  const normalizedCandidate = slugify(candidate);
  if (!normalizedCandidate) return false;
  return (repetitionIndex || []).some((entry) => {
    const normalizedExisting = entry.normalized || '';
    if (!normalizedExisting) return false;
    if (normalizedExisting.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedExisting)) return true;
    const candidateTokens = normalizedCandidate.split(' ').filter(Boolean);
    const existingTokens = normalizedExisting.split(' ').filter(Boolean);
    const overlap = candidateTokens.filter((token) => existingTokens.includes(token));
    return overlap.length >= Math.min(5, Math.max(3, Math.floor(candidateTokens.length * 0.6)));
  });
}

function buildFallbackPlan({
  strategy,
  planConfig,
  recommendation,
  recentEditorialContext,
  styleFingerprint,
  lockedCalendarPosts = [],
}) {
  const topics = normalizeArray(strategy.core_topics);
  const formats = normalizeArray(strategy.content_formats);
  const goals = normalizeArray(strategy.goals);
  const postsPerWeek = Math.max(Number(planConfig.posts_per_week || 2), 1);
  const weeks = Math.max(Number(planConfig.duration_in_weeks || 4), 1);
  const preferredDays = normalizeArray(planConfig.preferred_days);
  const preferredTimes = normalizeArray(planConfig.preferred_times);
  const historicalSignals = extractHistoricalSignals(recentEditorialContext);
  const repetitionIndex = buildRepetitionIndex(recentEditorialContext);

  const defaultTopics = topics.length
    ? topics
    : ['casos de uso de IA con impacto real', 'gobernanza de IA', 'adopción operativa de IA'];
  const defaultFormats = formats.length ? formats : ['Post de texto', 'Carrusel', 'Documento/PDF'];
  const defaultGoals = goals.length ? goals : ['reforzar posicionamiento', 'generar conversación'];

  const recommendationHints = recommendation ? [
    recommendation.tipos_de_contenido,
    recommendation.mejores_horarios,
    recommendation.estrategias_de_engagement,
  ].filter(Boolean).join(' ') : '';

  const usedPainKeys = new Set();
  const items = [];

  for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
    for (let slotIndex = 0; slotIndex < postsPerWeek; slotIndex += 1) {
      const lockedPost = lockedCalendarPosts[items.length] || null;
      const topic = defaultTopics[(weekIndex + slotIndex) % defaultTopics.length];
      const contentType = defaultFormats[(weekIndex + slotIndex) % defaultFormats.length];
      const goal = defaultGoals[(weekIndex + slotIndex) % defaultGoals.length];
      const candidates = getPainCandidates(topic);
      const painTemplate = candidates.find((candidate) => {
        const key = `${topic}:${candidate.pain}`;
        if (usedPainKeys.has(key)) return false;
        usedPainKeys.add(key);
        return true;
      }) || candidates[0] || PAIN_LIBRARY.default[0];

      let specificTopic = buildSpecificTopic(topic, slotIndex + weekIndex);
      if (hasHighSimilarity(specificTopic, repetitionIndex)) {
        specificTopic = `${specificTopic} sin repetir el ángulo ya tratado en las últimas semanas`;
      }

      const suggestedDate = lockedPost?.scheduled_datetime
        ? new Date(lockedPost.scheduled_datetime)
        : buildWeekDate(planConfig.start_date, weekIndex, slotIndex);
      const historicalSignal = historicalSignals[(weekIndex + slotIndex) % Math.max(historicalSignals.length, 1)] || '';

      items.push({
        week_index: weekIndex + 1,
        suggested_date: suggestedDate.toISOString(),
        suggested_time: lockedPost?.scheduled_datetime
          ? new Date(lockedPost.scheduled_datetime).toISOString().slice(11, 16)
          : preferredTimes[slotIndex % Math.max(preferredTimes.length, 1)] || '',
        preferred_day: preferredDays[slotIndex % Math.max(preferredDays.length, 1)] || '',
        content_type: contentType,
        existing_post_id: lockedPost?.id || null,
        topic: specificTopic,
        angle: `${painTemplate.angle}. Construye sobre lo ya publicado sin repetir el mismo framing.`,
        pain_point: painTemplate.pain,
        contrarian_insight: 'La repetición temática rara vez viene del tema; suele venir del mismo ángulo y la misma promesa.',
        objective: `${goal} a través de una pieza que haga avanzar una conversación ya abierta en contenidos recientes.`,
        cta: painTemplate.cta,
        hook_idea: painTemplate.hook,
        supporting_points: [
          ...painTemplate.points,
          recommendationHints
            ? `Alinea el formato o cierre con esta pista analítica: ${recommendationHints.slice(0, 140)}.`
            : 'Haz visible qué aporta esta pieza respecto a publicaciones recientes sobre el mismo territorio.',
        ],
        extra_instructions: [
          strategy.extra_instructions || '',
          `Imita el estilo reciente observado: tono ${styleFingerprint.tone_observed}, uso de primera persona ${styleFingerprint.first_person_usage}, uso de emojis ${styleFingerprint.emoji_usage}.`,
          'Evita repetir hook, tesis o estructura de contenidos de los 30 días previos.',
        ].filter(Boolean).join(' '),
        notes: historicalSignal
          ? `Construye sobre este tipo de pieza reciente sin duplicarla: ${historicalSignal}`
          : 'Evita títulos genéricos: cada pieza debe poder resumirse en una tensión concreta y accionable.',
      });
    }
  }

  return {
    summary: `Plan generado con contexto editorial reciente (${recentEditorialContext.length} piezas en los 30 días previos) para evitar repeticiones y mantener continuidad de estilo.`,
    items,
  };
}

function getPlanPrompt({
  strategy,
  planConfig,
  recommendation,
  recentEditorialContext,
  styleFingerprint,
  lockedCalendarPosts = [],
}) {
  return `Eres un estratega senior de contenido en LinkedIn para perfiles expertos. Debes crear un plan editorial MUY concreto, nada genérico, y claramente conectado con lo que el autor ya ha publicado o planificado en los 30 días previos.

Tu misión es convertir cada temática principal en micro-contenidos centrados en:
- un único subtema super específico
- un único dolor o fricción concreta de la audiencia
- una observación accionable, tensa o contraintuitiva

Debes tratar cada campo del brief como una decisión creativa independiente:
- "topic" = idea editorial concreta, casi lista para ser un titular interno.
- "angle" = tesis o perspectiva exacta del post, ligada a un dolor real.
- "pain_point" = dolor concreto, específico y reconocible de la audiencia.
- "contrarian_insight" = idea contraintuitiva, incómoda o poco obvia que hace que la pieza merezca atención.
- "objective" = qué quieres provocar exactamente en negocio/comunicación con esa pieza.
- "hook_idea" = primera idea/frase con tensión real para abrir el post.
- "cta" = llamada a la acción concreta y coherente con esa pieza.
- "supporting_points" = 3 o 4 ideas distintas, específicas y no intercambiables.
- "extra_instructions" = instrucciones de desarrollo útiles para escribir luego el post final.
- "notes" = razón estratégica por la que esa pieza merece existir.

Devuelve SOLO JSON válido con esta forma:
{
  "summary": "string",
  "items": [
    {
      "week_index": 1,
      "suggested_date": "2026-03-20T00:00:00.000Z",
      "suggested_time": "09:00",
      "content_type": "Carrusel",
      "existing_post_id": "opcional, si este item parte de un post ya existente en calendario",
      "topic": "título/editorial concreto del subtema",
      "angle": "ángulo muy específico que ataca un dolor concreto",
      "pain_point": "dolor o fricción muy concreta que vive la audiencia",
      "contrarian_insight": "idea contraintuitiva, tensión o verdad incómoda que diferencia la pieza",
      "objective": "objetivo de negocio o contenido",
      "cta": "CTA concreto",
      "hook_idea": "hook específico y fuerte",
      "supporting_points": ["punto 1", "punto 2", "punto 3"],
      "extra_instructions": "nota útil de desarrollo",
      "notes": "por qué esta pieza tiene sentido"
    }
  ]
}

Reglas obligatorias:
- El canal es LinkedIn.
- No generes copy final; genera briefs.
- NO uses temas genéricos como "liderazgo", "productividad", "innovación", "transformación digital" o similares como topic final.
- Cada pieza debe bajar a un subtema específico dentro de las temáticas del usuario.
- Cada pieza debe abordar un dolor, bloqueo, objeción o error muy concreto de la audiencia.
- No repitas el mismo tema, subtema, hook, framing ni enfoque respecto a publicaciones de los 30 días previos.
- Si una idea nueva conecta con una publicación previa, debe construir sobre ella y avanzar la conversación, no duplicarla.
- Si en <locked_calendar_posts> existe un post ya programado dentro del periodo del plan, debes reutilizarlo como base del brief.
- Para esos posts bloqueados:
  - conserva EXACTAMENTE su fecha y hora
  - usa su contenido como material base para pensar el briefing
  - devuelve su id en "existing_post_id"
  - no crees otro item adicional para ese mismo slot
- El campo "topic" debe sonar ya a idea de contenido concreta, no a categoría amplia.
- El campo "angle" debe poder responder a: "¿qué problema concreto estoy atacando aquí?"
- El campo "pain_point" debe describir una fricción muy específica, no un problema abstracto.
- El campo "contrarian_insight" debe aportar novedad intelectual; no puede ser una obviedad ni repetir el angle.
- El campo "objective" no puede ser una palabra suelta tipo "engagement" o "autoridad"; debe describir qué efecto concreto persigue la pieza.
- El campo "hook_idea" no puede ser genérico; debe contener una fricción, contradicción, riesgo, error o tensión específica.
- El campo "cta" no puede ser reusable para cualquier post; debe estar ligado al contenido de esa pieza.
- Los supporting_points deben ser distintos, accionables y coherentes con ese microtema; no pueden ser bullets intercambiables.
- El campo "extra_instructions" debe ayudar a escribir el post final con matices concretos, ejemplos, estructura o tono.
- No devuelvas frases de plantilla ni placeholders.
- Imita el estilo reciente del autor usando el style_fingerprint y el contexto editorial reciente; no escribas con un estilo genérico de LinkedIn.
- Si la audiencia es C-Level o decisora, prioriza decisiones, riesgos, adoption frictions, ROI, governance, change management y execution gaps.

<strategy_profile>
${JSON.stringify(strategy, null, 2)}
</strategy_profile>

<plan_config>
${JSON.stringify(planConfig, null, 2)}
</plan_config>

<latest_recommendation>
${JSON.stringify(recommendation || null, null, 2)}
</latest_recommendation>

<recent_30_day_editorial_context>
${JSON.stringify(recentEditorialContext || [], null, 2)}
</recent_30_day_editorial_context>

<locked_calendar_posts>
${JSON.stringify(lockedCalendarPosts || [], null, 2)}
</locked_calendar_posts>

<style_fingerprint>
${JSON.stringify(styleFingerprint || {}, null, 2)}
</style_fingerprint>

<avoid_repetition_rules>
No repitas literalmente temas, hooks, promesas ni estructuras de las publicaciones recientes.
Si detectas una idea ya tratada, cambia el ángulo y haz avanzar la conversación.
Conserva la voz reciente del autor: longitud, ritmo, uso de preguntas, densidad de párrafos y tono observados.
</avoid_repetition_rules>`;
}

function getOptimizePrompt({ draftContent, planContext, recentRecommendation, historicalPosts }) {
  return `Eres un experto en comunicación para LinkedIn. Optimiza el borrador del usuario manteniendo su voz y alineándolo con su estrategia editorial.

Devuelve SOLO el contenido final listo para LinkedIn.

<draft_content>
${draftContent}
</draft_content>

<plan_context>
${JSON.stringify(planContext, null, 2)}
</plan_context>

<latest_recommendation>
${JSON.stringify(recentRecommendation || null, null, 2)}
</latest_recommendation>

<historical_posts_sample>
${JSON.stringify(historicalPosts || [], null, 2)}
</historical_posts_sample>

Instrucciones:
- Respeta el idioma principal del autor.
- Mantén el objetivo, ángulo y CTA del brief.
- Conserva la voz habitual del autor.
- Mejora hook, legibilidad, ritmo y cierre.
- Usa estructura clara con saltos de línea.
- Añade pregunta final si encaja.
- Usa emojis solo si son consistentes con el estilo previo del autor.`;
}

function getDevelopPostPrompt({
  planContext,
  recentRecommendation,
  recentEditorialContext,
  styleFingerprint,
}) {
  return `Eres un experto en LinkedIn y ghostwriting para perfiles senior. Debes escribir el post final completo a partir del brief del plan.

Devuelve SOLO el contenido final del post, listo para publicar en LinkedIn.

Reglas obligatorias:
- Mantén foco en un único dolor o tensión central.
- Integra de forma natural el pain_point y la contrarian_insight del brief.
- Desarrolla un único subtema concreto, sin abrir demasiados frentes.
- Haz que el hook sea fuerte y específico, no genérico.
- Evita repetir hooks, aperturas o framing de publicaciones de los 30 días previos.
- Si el tema conecta con un contenido reciente, construye sobre él y añade una capa nueva.
- Imita el estilo reciente del autor usando el style_fingerprint y el contexto editorial previo.
- Escribe con voz experta, clara y accionable.
- Usa saltos de línea para que se lea bien en LinkedIn.
- Cierra con el CTA definido o una variante muy cercana.
- No expliques el brief; conviértelo en publicación final.
- No uses títulos tipo informe ni etiquetas como "Tema:" o "Objetivo:".

<plan_context>
${JSON.stringify(planContext, null, 2)}
</plan_context>

<latest_recommendation>
${JSON.stringify(recentRecommendation || null, null, 2)}
</latest_recommendation>

<recent_30_day_editorial_context>
${JSON.stringify(recentEditorialContext || [], null, 2)}
</recent_30_day_editorial_context>

<style_fingerprint>
${JSON.stringify(styleFingerprint || {}, null, 2)}
</style_fingerprint>`;
}

function validateGeneratedItems(items, strategyTopics, recentEditorialContext, lockedCalendarPosts = []) {
  const normalizedTopics = normalizeArray(strategyTopics).map(slugify);
  const repetitionIndex = buildRepetitionIndex(recentEditorialContext);
  const lockedIds = new Set((lockedCalendarPosts || []).map((post) => String(post.id)));
  const returnedLockedIds = new Set();

  const validItems = (items || []).filter((item) => {
    const topic = String(item?.topic || '').trim();
    const angle = String(item?.angle || '').trim();
    const painPoint = String(item?.pain_point || '').trim();
    const contrarianInsight = String(item?.contrarian_insight || '').trim();
    const objective = String(item?.objective || '').trim();
    const hook = String(item?.hook_idea || '').trim();
    const cta = String(item?.cta || '').trim();
    const extraInstructions = String(item?.extra_instructions || '').trim();
    const points = normalizeArray(item?.supporting_points);

    if (!topic || !angle || !painPoint || !contrarianInsight || !objective || !hook || !cta || !extraInstructions || points.length < 3) return false;
    if (isTooGenericTopic(topic)) return false;
    if ([topic, angle, painPoint, contrarianInsight, objective, hook, cta, extraInstructions].some((field) => field.length < 18)) return false;
    if ([topic, angle, painPoint, contrarianInsight, objective, hook, cta, extraInstructions].some((field) => {
      const normalizedField = slugify(field);
      return GENERIC_BRIEF_PHRASES.some((phrase) => normalizedField.includes(slugify(phrase)));
    })) return false;
    if (points.some((point) => String(point).trim().length < 18)) return false;
    if (new Set(points.map((point) => slugify(point))).size !== points.length) return false;
    if (
      slugify(topic) === slugify(angle)
      || slugify(angle) === slugify(hook)
      || slugify(painPoint) === slugify(angle)
      || slugify(contrarianInsight) === slugify(angle)
      || slugify(painPoint) === slugify(contrarianInsight)
    ) return false;
    if (hasHighSimilarity(topic, repetitionIndex) || hasHighSimilarity(hook, repetitionIndex)) return false;

    const existingPostId = item?.existing_post_id ? String(item.existing_post_id) : '';
    if (existingPostId) {
      if (!lockedIds.has(existingPostId) || returnedLockedIds.has(existingPostId)) return false;
      returnedLockedIds.add(existingPostId);
      const lockedPost = (lockedCalendarPosts || []).find((post) => String(post.id) === existingPostId);
      if (lockedPost?.scheduled_datetime) {
        const lockedDate = new Date(lockedPost.scheduled_datetime).toISOString().slice(0, 16);
        const itemDate = item?.suggested_date
          ? `${new Date(item.suggested_date).toISOString().slice(0, 10)}T${String(item?.suggested_time || '00:00')}`
          : '';
        if (!itemDate.startsWith(lockedDate.slice(0, 10))) return false;
      }
    }

    const normalizedTopic = slugify(topic);
    return normalizedTopics.length === 0 || normalizedTopics.some((base) => {
      const baseToken = base.split(' ')[0];
      return normalizedTopic.includes(baseToken)
        || slugify(angle).includes(baseToken)
        || slugify(painPoint).includes(baseToken)
        || slugify(contrarianInsight).includes(baseToken)
        || slugify(hook).includes(baseToken)
        || slugify(objective).includes(baseToken);
    });
  });

  if (lockedIds.size > 0 && returnedLockedIds.size !== lockedIds.size) {
    return [];
  }

  return validItems;
}

export async function generateContentPlan(input) {
  const modelConfig = getModel();

  if (!modelConfig) {
    throw new Error('Falta GEMINI_API_KEY en el backend. La generación de planes con IA requiere configuración de Gemini.');
  }

  const recentEditorialContext = dedupeEditorialContext(input.recentEditorialContext || []);
  const styleFingerprint = buildStyleFingerprint(recentEditorialContext);
  const enrichedInput = {
    ...input,
    recentEditorialContext,
    styleFingerprint,
    lockedCalendarPosts: input.lockedCalendarPosts || [],
  };

  const prompt = getPlanPrompt(enrichedInput);
  let lastError = null;

  for (const modelName of modelConfig.models) {
    try {
      const model = modelConfig.genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = safeJsonParse(text);
      const validItems = validateGeneratedItems(
        parsed?.items,
        input?.strategy?.core_topics,
        recentEditorialContext,
        enrichedInput.lockedCalendarPosts
      );

      if (!parsed?.items || !Array.isArray(parsed.items) || validItems.length === 0) {
        throw new Error(`El modelo ${modelName} devolvió un plan inválido, repetitivo o demasiado genérico.`);
      }

      return {
        summary: parsed.summary || `Plan generado con ${modelName}.`,
        items: parsed.items,
        styleFingerprint,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `No se pudo generar el plan con ninguno de los modelos configurados (${MODEL_PRIORITY.join(', ')}). ${lastError?.message || ''}`.trim()
  );
}

export async function optimizePlannedPost(input) {
  const modelConfig = getModel();
  if (!modelConfig) {
    throw new Error('Falta GEMINI_API_KEY en el backend. La optimización con IA requiere configuración de Gemini.');
  }

  const prompt = getOptimizePrompt(input);
  let lastError = null;

  for (const modelName of modelConfig.models) {
    try {
      const model = modelConfig.genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `No se pudo optimizar el contenido con ninguno de los modelos configurados (${MODEL_PRIORITY.join(', ')}). ${lastError?.message || ''}`.trim()
  );
}

export async function generatePlannedPostContent(input) {
  const modelConfig = getModel();
  if (!modelConfig) {
    throw new Error('Falta GEMINI_API_KEY en el backend. La generación del contenido final requiere configuración de Gemini.');
  }

  const recentEditorialContext = dedupeEditorialContext(input.recentEditorialContext || []);
  const styleFingerprint = input.styleFingerprint || buildStyleFingerprint(recentEditorialContext);
  const prompt = getDevelopPostPrompt({
    ...input,
    recentEditorialContext,
    styleFingerprint,
  });
  let lastError = null;

  for (const modelName of modelConfig.models) {
    try {
      const model = modelConfig.genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (!text || text.length < 80) {
        throw new Error(`El modelo ${modelName} devolvió un contenido demasiado corto o vacío.`);
      }
      return text;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `No se pudo generar el contenido final con ninguno de los modelos configurados (${MODEL_PRIORITY.join(', ')}). ${lastError?.message || ''}`.trim()
  );
}
