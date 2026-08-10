import mongoose from 'mongoose';

const contentPlanItemSchema = new mongoose.Schema({
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentPlan',
    required: true,
    index: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  week_index: {
    type: Number,
    default: 0,
  },
  suggested_date: {
    type: Date,
    default: null,
  },
  suggested_time: {
    type: String,
    default: '',
  },
  content_type: {
    type: String,
    default: '',
  },
  topic: {
    type: String,
    default: '',
  },
  angle: {
    type: String,
    default: '',
  },
  pain_point: {
    type: String,
    default: '',
  },
  contrarian_insight: {
    type: String,
    default: '',
  },
  objective: {
    type: String,
    default: '',
  },
  cta: {
    type: String,
    default: '',
  },
  hook_idea: {
    type: String,
    default: '',
  },
  supporting_points: {
    type: [String],
    default: [],
  },
  extra_instructions: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'validated', 'converted_to_post'],
    default: 'draft',
  },
  linked_planner_post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlannerPost',
    default: null,
  },
}, {
  timestamps: true,
});

contentPlanItemSchema.index({ plan_id: 1, week_index: 1, suggested_date: 1 });

export default mongoose.model('ContentPlanItem', contentPlanItemSchema);
