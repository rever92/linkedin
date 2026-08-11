import mongoose from 'mongoose';

const linkedInPostSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
  saves: {
    type: Number,
    default: 0,
  },
  post_type: String,
  category: String,
  linea_editorial: {
    type: String,
    trim: true,
  },
  funcion_editorial: { type: String, trim: true },
  formato: { type: String, trim: true },
}, {
  timestamps: true,
});

linkedInPostSchema.index({ user_id: 1, date: -1 });

export default mongoose.model('LinkedInPost', linkedInPostSchema);
