import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  res.json(req.user.toProfile());
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res, next) => {
  try {
    const allowedFields = ['subscription_plan', 'subscription_status'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    res.json(user.toProfile());
  } catch (error) {
    next(error);
  }
});

export default router;
