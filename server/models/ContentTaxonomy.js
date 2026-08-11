import mongoose from 'mongoose';

export const TAXONOMY_KINDS = ['linea_editorial', 'funcion_editorial', 'formato'];

const contentTaxonomySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  kind: {
    type: String,
    enum: TAXONOMY_KINDS,
    required: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  normalized_value: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  is_default: {
    type: Boolean,
    default: false,
  },
  sort_order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

contentTaxonomySchema.index({ user_id: 1, kind: 1, normalized_value: 1 }, { unique: true });
contentTaxonomySchema.index({ user_id: 1, kind: 1, active: 1, sort_order: 1 });

export default mongoose.model('ContentTaxonomy', contentTaxonomySchema);
