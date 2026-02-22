import { Router } from 'express';
import StripePrice from '../models/StripePrice.js';
import StripeProduct from '../models/StripeProduct.js';

const router = Router();

// GET /api/products - Get active products and prices (public)
router.get('/', async (req, res, next) => {
  try {
    const prices = await StripePrice.find({ active: true }).sort({ unit_amount: 1 });

    const productIds = [...new Set(prices.map(p => p.stripe_product_id))];
    const products = await StripeProduct.find({
      stripe_product_id: { $in: productIds },
    });

    const pricesWithProducts = prices.map(price => ({
      ...price.toObject(),
      product: products.find(p => p.stripe_product_id === price.stripe_product_id) || {
        name: 'Producto no encontrado',
        description: null,
      },
    }));

    res.json(pricesWithProducts);
  } catch (error) {
    next(error);
  }
});

export default router;
