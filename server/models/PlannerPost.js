import mongoose from 'mongoose';

const plannerPostSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    default: '',
  },
  image_url: String,
  state: {
    type: String,
    enum: ['borrador', 'listo', 'planificado', 'eliminado'],
    default: 'borrador',
  },
  scheduled_datetime: Date,
}, {
  timestamps: true,
});

export default mongoose.model('PlannerPost', plannerPostSchema);
