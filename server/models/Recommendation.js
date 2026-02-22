import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tipos_de_contenido: { type: String, default: '' },
  mejores_horarios: { type: String, default: '' },
  longitud_optima: { type: String, default: '' },
  frecuencia_recomendada: { type: String, default: '' },
  estrategias_de_engagement: { type: String, default: '' },
  date_generated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Recommendation', recommendationSchema);
