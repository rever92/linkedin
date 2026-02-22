import { Router } from 'express';
import auth from '../middleware/auth.js';
import Recommendation from '../models/Recommendation.js';

const router = Router();

// GET /api/recommendations/latest - Get latest recommendation
router.get('/latest', auth, async (req, res, next) => {
  try {
    const recommendation = await Recommendation.findOne({ user_id: req.userId })
      .sort({ date_generated: -1 });

    res.json(recommendation);
  } catch (error) {
    next(error);
  }
});

// POST /api/recommendations - Save a new recommendation
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      tipos_de_contenido,
      mejores_horarios,
      longitud_optima,
      frecuencia_recomendada,
      estrategias_de_engagement,
    } = req.body;

    const recommendation = new Recommendation({
      user_id: req.userId,
      tipos_de_contenido,
      mejores_horarios,
      longitud_optima,
      frecuencia_recomendada,
      estrategias_de_engagement,
      date_generated: new Date(),
    });

    await recommendation.save();
    res.status(201).json(recommendation);
  } catch (error) {
    next(error);
  }
});

export default router;
