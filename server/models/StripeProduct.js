import mongoose from 'mongoose';

const stripeProductSchema = new mongoose.Schema({
  stripe_product_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('StripeProduct', stripeProductSchema);
