import { Router } from 'express';
import Stripe from 'stripe';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import StripeSubscription from '../models/StripeSubscription.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const router = Router();

if (!stripe) {
  console.warn('⚠️  STRIPE_SECRET_KEY no configurada - rutas de Stripe desactivadas');
}

// Middleware que bloquea rutas si Stripe no está configurado
function requireStripe(req, res, next) {
  if (!stripe) return res.status(503).json({ error: 'Stripe no configurado' });
  next();
}

// POST /api/stripe/checkout - Create checkout session
router.post('/checkout', auth, requireStripe, async (req, res, next) => {
  try {
    const { price_id } = req.body;
    if (!price_id) {
      return res.status(400).json({ error: 'price_id es requerido' });
    }

    const user = await User.findById(req.userId);

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: req.userId },
      });
      customerId = customer.id;
      user.stripe_customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: req.userId,
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing`,
      subscription_data: {
        metadata: { user_id: req.userId },
      },
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// POST /api/stripe/portal - Create billing portal session
router.post('/portal', auth, requireStripe, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No se encontró el cliente de Stripe' });
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.APP_URL}/pricing`,
    });

    res.json({ url });
  } catch (error) {
    next(error);
  }
});

// POST /api/stripe/webhook - Stripe webhook handler
// Note: This route uses raw body parser, configured in index.js
router.post('/webhook', requireStripe, async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
        const product = await stripe.products.retrieve(price.product);
        const role = (product.metadata.role || 'FREE').toLowerCase();

        // Find user by stripe_customer_id or client_reference_id
        let user = await User.findOne({ stripe_customer_id: session.customer });
        if (!user && session.client_reference_id) {
          user = await User.findById(session.client_reference_id);
        }

        if (user) {
          user.stripe_customer_id = session.customer;
          user.stripe_subscription_id = subscription.id;
          user.role = role;
          user.subscription_status = subscription.status;
          user.subscription_plan = role;
          user.subscription_start_date = new Date(subscription.current_period_start * 1000);
          user.next_billing_date = new Date(subscription.current_period_end * 1000);
          await user.save();
        }

        await StripeSubscription.findOneAndUpdate(
          { stripe_subscription_id: subscription.id },
          {
            user_id: user?._id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
          },
          { upsert: true, new: true }
        );

        console.log('Checkout completado para usuario:', user?.email);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const price = await stripe.prices.retrieve(sub.items.data[0].price.id);
        const product = await stripe.products.retrieve(price.product);
        const role = (product.metadata.role || 'FREE').toLowerCase();

        const user = await User.findOne({ stripe_customer_id: sub.customer });
        if (user) {
          user.role = role;
          user.subscription_status = sub.status;
          user.subscription_plan = role;
          user.stripe_subscription_id = sub.id;
          user.subscription_start_date = new Date(sub.current_period_start * 1000);
          user.next_billing_date = new Date(sub.current_period_end * 1000);
          await user.save();
        }

        await StripeSubscription.findOneAndUpdate(
          { stripe_subscription_id: sub.id },
          {
            user_id: user?._id,
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer,
            stripe_price_id: sub.items.data[0].price.id,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000),
            current_period_end: new Date(sub.current_period_end * 1000),
          },
          { upsert: true, new: true }
        );

        console.log('Suscripción actualizada:', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object;

        const user = await User.findOne({ stripe_customer_id: deletedSub.customer });
        if (user) {
          user.role = 'free';
          user.subscription_status = 'canceled';
          user.subscription_plan = 'free';
          await user.save();
        }

        await StripeSubscription.findOneAndUpdate(
          { stripe_subscription_id: deletedSub.id },
          { status: 'canceled' }
        );

        console.log('Suscripción cancelada:', deletedSub.id);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

export default router;
