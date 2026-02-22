import mongoose from 'mongoose';

const postOptimizationSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlannerPost',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  original_content: {
    type: String,
    required: true,
  },
  optimized_content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('PostOptimization', postOptimizationSchema);
