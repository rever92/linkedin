import { Router } from 'express';
import auth from '../middleware/auth.js';
import PremiumAction from '../models/PremiumAction.js';
import { getRoleLimits, getMonthlyActions, getCurrentCycleActions } from '../services/premiumService.js';
import mongoose from 'mongoose';

const router = Router();

// GET /api/premium/limits - Get limits for current role
router.get('/limits', auth, async (req, res, next) => {
  try {
    const limits = await getRoleLimits(req.user.role);
    res.json(limits);
  } catch (error) {
    next(error);
  }
});

// GET /api/premium/usage - Get monthly usage
router.get('/usage', auth, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const actions = await getMonthlyActions(userId);
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

// GET /api/premium/cycle-usage - Get usage for current billing cycle
router.get('/cycle-usage', auth, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    if (req.user.subscription_start_date) {
      const actions = await getCurrentCycleActions(userId, req.user.subscription_start_date);
      res.json(actions);
    } else {
      const actions = await getMonthlyActions(userId);
      res.json(actions);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/premium/actions - Register a premium action
router.post('/actions', auth, async (req, res, next) => {
  try {
    const { action_type, metadata } = req.body;

    if (!action_type) {
      return res.status(400).json({ error: 'action_type es requerido' });
    }

    const action = new PremiumAction({
      user_id: req.userId,
      action_type,
      metadata: metadata || {},
    });

    await action.save();
    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
});

export default router;
