import mongoose from 'mongoose';

const contentStrategyProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  target_audience: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: '',
  },
  core_topics: {
    type: [String],
    default: [],
  },
  goals: {
    type: [String],
    default: [],
  },
  content_formats: {
    type: [String],
    default: [],
  },
  extra_instructions: {
    type: String,
    default: '',
  },
  channel: {
    type: String,
    enum: ['linkedin'],
    default: 'linkedin',
  },
  is_default: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

contentStrategyProfileSchema.index({ user_id: 1, is_default: 1 });

export default mongoose.model('ContentStrategyProfile', contentStrategyProfileSchema);
