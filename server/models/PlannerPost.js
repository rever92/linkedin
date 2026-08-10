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
  content_type: {
    type: String,
    default: '',
  },
  image_url: String,
  plan_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentPlanItem',
    default: null,
  },
  state: {
    type: String,
    enum: ['borrador', 'listo', 'planificado', 'publicado', 'eliminado'],
    default: 'borrador',
  },
  scheduled_datetime: Date,
  titulo: { type: String, trim: true, maxlength: 180 },
  linea_editorial: {
    type: String,
    enum: ['IA para CIOs y C-Level', 'Casos reales y lecciones', 'Frameworks y checklists', 'Opinión sobre tendencias y hype', 'Marca personal y bastidores'],
  },
  funcion_editorial: { type: String, enum: ['alcance', 'autoridad', 'conversacion', 'flexible'] },
  formato: { type: String, enum: ['texto', 'carrusel', 'compartido', 'video', 'meme', 'articulo'] },
  fuente: { type: String, trim: true },
  punto_de_vista: { type: String, trim: true },
  hipotesis: { type: String, trim: true },
  activo_reutilizable: { type: String, trim: true },
  published_post_url: { type: String, trim: true },
}, {
  timestamps: true,
});

export default mongoose.model('PlannerPost', plannerPostSchema);
