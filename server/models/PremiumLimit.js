import mongoose from 'mongoose';

const premiumLimitSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    uppercase: true,
  },
  action_type: {
    type: String,
    required: true,
  },
  limit_type: {
    type: String,
    required: true,
  },
  limit_value: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

premiumLimitSchema.index({ role: 1, action_type: 1 });

export default mongoose.model('PremiumLimit', premiumLimitSchema);
