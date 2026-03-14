import mongoose from 'mongoose';

const contentPlanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  strategy_profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentStrategyProfile',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'approving', 'approved', 'archived'],
    default: 'draft',
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  cadence_mode: {
    type: String,
    enum: ['weekly_frequency', 'custom_dates'],
    default: 'weekly_frequency',
  },
  cadence: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  generation_context: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  source_recommendation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recommendation',
    default: null,
  },
}, {
  timestamps: true,
});

contentPlanSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model('ContentPlan', contentPlanSchema);
