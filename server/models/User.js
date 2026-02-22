import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['free', 'pro', 'business'],
    default: 'free',
    lowercase: true,
  },
  is_beta_tester: {
    type: Boolean,
    default: false,
  },
  subscription_status: {
    type: String,
    default: 'none',
  },
  subscription_plan: {
    type: String,
    default: 'free',
  },
  subscription_expiry: Date,
  trial_ends_at: Date,
  subscription_start_date: Date,
  next_billing_date: Date,
  stripe_customer_id: String,
  stripe_subscription_id: String,
  refresh_token: String,
  last_login: Date,
}, {
  timestamps: true,
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toProfile = function() {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    is_beta_tester: this.is_beta_tester,
    subscription_status: this.subscription_status,
    subscription_plan: this.subscription_plan,
    subscription_expiry: this.subscription_expiry,
    trial_ends_at: this.trial_ends_at,
    subscription_start_date: this.subscription_start_date,
    next_billing_date: this.next_billing_date,
    stripe_customer_id: this.stripe_customer_id,
    last_login: this.last_login,
  };
};

export default mongoose.model('User', userSchema);
