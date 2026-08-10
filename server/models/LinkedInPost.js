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
    enum: ['IA para CIOs y C-Level', 'Casos reales y lecciones', 'Frameworks y checklists', 'Opinión sobre tendencias y hype', 'Marca personal y bastidores'],
  },
  funcion_editorial: { type: String, enum: ['alcance', 'autoridad', 'conversacion', 'flexible'] },
  formato: { type: String, enum: ['texto', 'carrusel', 'compartido', 'video', 'meme', 'articulo'] },
}, {
  timestamps: true,
});

linkedInPostSchema.index({ user_id: 1, date: -1 });

export default mongoose.model('LinkedInPost', linkedInPostSchema);
