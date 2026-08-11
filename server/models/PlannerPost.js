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
    trim: true,
  },
  funcion_editorial: { type: String, trim: true },
  formato: { type: String, trim: true },
  fuente: { type: String, trim: true },
  punto_de_vista: { type: String, trim: true },
  hipotesis: { type: String, trim: true },
  activo_reutilizable: { type: String, trim: true },
  published_post_url: { type: String, trim: true },
  // Canonical planner metrics. The legacy English fields below remain readable
  // so existing records keep working, but all new metric writes use these.
  impresiones: { type: Number, default: null, min: 0 },
  reacciones: { type: Number, default: null, min: 0 },
  comentarios: { type: Number, default: null, min: 0 },
  compartidos: { type: Number, default: null, min: 0 },
  guardados: { type: Number, default: null, min: 0 },
  fecha_medicion: { type: Date, default: null },
  views: { type: Number, default: 0, min: 0 },
  likes: { type: Number, default: 0, min: 0 },
  comments: { type: Number, default: 0, min: 0 },
  shares: { type: Number, default: 0, min: 0 },
  saves: { type: Number, default: 0, min: 0 },
  metrics_updated_at: { type: Date, default: null },
}, {
  timestamps: true,
});

export default mongoose.model('PlannerPost', plannerPostSchema);
