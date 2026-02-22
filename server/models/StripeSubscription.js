import mongoose from 'mongoose';

const stripeSubscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  stripe_subscription_id: {
    type: String,
    required: true,
    unique: true,
  },
  stripe_customer_id: {
    type: String,
    required: true,
  },
  stripe_price_id: String,
  status: {
    type: String,
    default: 'active',
  },
  cancel_at_period_end: {
    type: Boolean,
    default: false,
  },
  current_period_start: Date,
  current_period_end: Date,
}, {
  timestamps: true,
});

export default mongoose.model('StripeSubscription', stripeSubscriptionSchema);
