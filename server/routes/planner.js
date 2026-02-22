import { Router } from 'express';
import auth from '../middleware/auth.js';
import PlannerPost from '../models/PlannerPost.js';
import PostOptimization from '../models/PostOptimization.js';

const router = Router();

// GET /api/planner/posts - Get all planner posts
router.get('/posts', auth, async (req, res, next) => {
  try {
    const posts = await PlannerPost.find({
      user_id: req.userId,
      state: { $ne: 'eliminado' },
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// POST /api/planner/posts - Create a new planner post
router.post('/posts', auth, async (req, res, next) => {
  try {
    const { content, state, scheduled_datetime } = req.body;

    const post = new PlannerPost({
      user_id: req.userId,
      content: content || '',
      state: state || 'borrador',
      scheduled_datetime: scheduled_datetime || null,
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
    const { content, state, scheduled_datetime } = req.body;
    const updates = {};

    if (content !== undefined) updates.content = content;
    if (state !== undefined) updates.state = state;
    if (scheduled_datetime !== undefined) updates.scheduled_datetime = scheduled_datetime;

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
