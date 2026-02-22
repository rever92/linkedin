/**
 * Resetear contraseña de un usuario
 *
 * Uso:
 *   node server/scripts/reset-password.js <email> <nueva-contraseña>
 *
 * Ejemplo:
 *   node server/scripts/reset-password.js jrs.reverte@gmail.com MiNuevaPass123
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';

const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.error('Uso: node server/scripts/reset-password.js <email> <nueva-contraseña>');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('La contraseña debe tener al menos 6 caracteres');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  console.error(`Usuario no encontrado: ${email}`);
  await mongoose.disconnect();
  process.exit(1);
}

// Hash manually to bypass pre-save hook issues
user.password = await bcrypt.hash(newPassword, 12);
await User.collection.updateOne({ _id: user._id }, { $set: { password: user.password } });

console.log(`Contraseña actualizada para ${email}`);
await mongoose.disconnect();
