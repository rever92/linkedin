import mongoose from 'mongoose';

const stripePriceSchema = new mongoose.Schema({
  stripe_price_id: {
    type: String,
    required: true,
    unique: true,
  },
  stripe_product_id: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  currency: {
    type: String,
    default: 'eur',
  },
  interval: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
  },
  interval_count: {
    type: Number,
    default: 1,
  },
  unit_amount: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('StripePrice', stripePriceSchema);
