import mongoose from 'mongoose';

const premiumActionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action_type: {
    type: String,
    required: true,
    enum: ['profile_analysis', 'post_optimization', 'batch_analysis'],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

premiumActionSchema.index({ user_id: 1, action_type: 1, createdAt: -1 });

export default mongoose.model('PremiumAction', premiumActionSchema);
