import { Router } from 'express';
import auth from '../middleware/auth.js';
import LinkedInPost from '../models/LinkedInPost.js';
import PlannerPost from '../models/PlannerPost.js';

const router = Router();

// GET /api/posts - Get all LinkedIn posts for the user
router.get('/', auth, async (req, res, next) => {
  try {
    const posts = await LinkedInPost.find({ user_id: req.userId })
      .sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// POST /api/posts/upsert - Batch upsert posts (CSV upload)
router.post('/upsert', auth, async (req, res, next) => {
  try {
    const { posts } = req.body;
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'Se requiere un array de posts' });
    }

    const operations = posts.map(post => ({
      updateOne: {
        filter: { url: post.url },
        update: {
          $set: {
            url: post.url,
            user_id: req.userId,
            date: post.date,
            text: post.text || '',
            views: post.views || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            ...(post.saves !== undefined && { saves: post.saves }),
            post_type: post.post_type || null,
            ...(post.category !== undefined && { category: post.category }),
            ...(post.linea_editorial !== undefined && { linea_editorial: post.linea_editorial }),
            ...(post.funcion_editorial !== undefined && { funcion_editorial: post.funcion_editorial }),
            ...(post.formato !== undefined && { formato: post.formato }),
          },
        },
        upsert: true,
      },
    }));

    await LinkedInPost.bulkWrite(operations);

    const importedMetrics = posts
      .filter((post) => post.url)
      .map((post) => ({
        updateOne: {
          filter: { user_id: req.userId, published_post_url: post.url },
          update: {
            $set: {
              views: post.views || 0,
              likes: post.likes || 0,
              comments: post.comments || 0,
              shares: post.shares || 0,
              saves: post.saves || 0,
              metrics_updated_at: new Date(),
            },
          },
        },
      }));
    if (importedMetrics.length) await PlannerPost.bulkWrite(importedMetrics);

    // An import may arrive after the idea was marked as published. In that
    // case, carry the idea taxonomy forward automatically to close the loop.
    const publishedIdeas = await PlannerPost.find({
      user_id: req.userId,
      published_post_url: { $in: posts.map(post => post.url) },
    }).select('published_post_url linea_editorial funcion_editorial formato');
    if (publishedIdeas.length) {
      await LinkedInPost.bulkWrite(publishedIdeas.map(idea => ({
        updateOne: {
          filter: { url: idea.published_post_url, user_id: req.userId },
          update: { $set: { linea_editorial: idea.linea_editorial, funcion_editorial: idea.funcion_editorial, formato: idea.formato } },
        },
      })));
    }

    const updatedPosts = await LinkedInPost.find({ user_id: req.userId })
      .sort({ date: -1 });

    res.json(updatedPosts);
  } catch (error) {
    next(error);
  }
});

// PUT /api/posts/:url/category - Update post category
router.put('/:url/category', auth, async (req, res, next) => {
  try {
    const { category } = req.body;
    const url = decodeURIComponent(req.params.url);

    const post = await LinkedInPost.findOneAndUpdate(
      { url, user_id: req.userId },
      { category },
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

export default router;
