import { Router } from 'express';
import auth from '../middleware/auth.js';
import PlannerPost from '../models/PlannerPost.js';
import PostOptimization from '../models/PostOptimization.js';
import LinkedInPost from '../models/LinkedInPost.js';

const router = Router();
const editableFields = ['content', 'state', 'scheduled_datetime', 'titulo', 'linea_editorial', 'funcion_editorial', 'formato', 'fuente', 'punto_de_vista', 'hipotesis', 'activo_reutilizable', 'published_post_url'];
const pickEditable = (body) => Object.fromEntries(editableFields.filter(field => body[field] !== undefined).map(field => [field, body[field]]));

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

// POST /api/planner/posts - Create a new planner post
router.post('/posts', auth, async (req, res, next) => {
  try {
    const { content, state = 'borrador', scheduled_datetime, ...metadata } = pickEditable(req.body);

    const post = new PlannerPost({
      user_id: req.userId,
      content: content || '',
      state,
      scheduled_datetime: state === 'planificado' ? (scheduled_datetime || null) : null,
      ...metadata,
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
    const { content, state, scheduled_datetime, ...metadata } = pickEditable(req.body);
    const updates = { ...metadata };

    if (content !== undefined) updates.content = content;
    if (state !== undefined) updates.state = state;
    if (state !== undefined && state !== 'planificado') {
      updates.scheduled_datetime = null;
    } else if (scheduled_datetime !== undefined) {
      updates.scheduled_datetime = scheduled_datetime;
    }

    const post = await PlannerPost.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      updates,
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/posts/:id/publish - Close the idea → published post loop.
router.post('/posts/:id/publish', auth, async (req, res, next) => {
  try {
    const { published_post_url } = req.body;
    if (!published_post_url) return res.status(400).json({ error: 'Se requiere la URL de la publicación' });

    const post = await PlannerPost.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { state: 'publicado', scheduled_datetime: null, published_post_url },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });

    await LinkedInPost.findOneAndUpdate(
      { url: published_post_url, user_id: req.userId },
      { $set: { linea_editorial: post.linea_editorial, funcion_editorial: post.funcion_editorial, formato: post.formato } }
    );
    res.json(post);
  } catch (error) { next(error); }
});

// POST /api/planner/posts/:id/optimizations - Save post optimization
router.post('/posts/:id/optimizations', auth, async (req, res, next) => {
  try {
    const { original_content, optimized_content } = req.body;

    const optimization = new PostOptimization({
      post_id: req.params.id,
      user_id: req.userId,
      original_content,
      optimized_content,
    });

    await optimization.save();
    res.status(201).json(optimization);
  } catch (error) {
    next(error);
  }
});

export default router;
