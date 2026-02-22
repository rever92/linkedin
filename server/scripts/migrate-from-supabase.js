/**
 * Migración de datos: CSV (exportados de Supabase) → MongoDB
 *
 * Uso:
 *   node server/scripts/migrate-from-supabase.js
 *
 * Opciones:
 *   --dry-run       Solo mostrar qué se haría, sin insertar en MongoDB
 *   --clean         Limpiar colecciones antes de insertar
 *   --only=users    Migrar solo una entidad (users, posts, planner, etc.)
 *
 * Los CSV deben estar en la carpeta /tablas/ en la raíz del proyecto.
 * Los emails de los usuarios se configuran en USER_EMAILS abajo.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Papa from 'papaparse';

// Cargar .env desde server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const PROJECT_ROOT = join(__dirname, '..', '..');

// Models
import User from '../models/User.js';
import LinkedInPost from '../models/LinkedInPost.js';
import PlannerPost from '../models/PlannerPost.js';
import PostOptimization from '../models/PostOptimization.js';
import PremiumAction from '../models/PremiumAction.js';
import PremiumLimit from '../models/PremiumLimit.js';
import StripeProduct from '../models/StripeProduct.js';
import StripePrice from '../models/StripePrice.js';
import StripeSubscription from '../models/StripeSubscription.js';
import Recommendation from '../models/Recommendation.js';

// ─── Config ─────────────────────────────────────────────────────────────────

// IMPORTANTE: Supabase Auth no exporta emails en CSV.
// Mapea aquí cada UUID de user_profiles al email correspondiente.
// Puedes verlos en Supabase → Authentication → Users.
const USER_EMAILS = {
  '4c172695-d733-4b96-ac20-33ab93e6af80': 'reverrock23@gmail.com',
  'ef437f47-040e-410b-a1b9-84004b850c8f': 'jrs.reverte@gmail.com',
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CLEAN = args.includes('--clean');
const ONLY = args.find(a => a.startsWith('--only='))?.split('=')[1];

// Mapas UUID (Supabase) → ObjectId (MongoDB)
const userIdMap = new Map();
const plannerPostIdMap = new Map(); // UUID de planner posts → ObjectId

// ─── CSV helpers ────────────────────────────────────────────────────────────

function readCSV(filename) {
  const filePath = join(PROJECT_ROOT, 'tablas', filename);
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // mantener todo como string para control manual
    });
    return result.data;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapRole(supabaseRole) {
  if (!supabaseRole) return 'free';
  const r = supabaseRole.toLowerCase();
  if (r === 'premium') return 'pro';
  if (r === 'pro') return 'pro';
  if (r === 'business') return 'business';
  return 'free';
}

function generateTempPassword() {
  return crypto.randomBytes(16).toString('hex');
}

function parseDate(val) {
  if (!val || val === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseBool(val) {
  if (val === 'true' || val === true) return true;
  return false;
}

function parseNumber(val) {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function parseJSON(val) {
  if (!val || val === '') return {};
  try {
    // El CSV puede tener JSON con comillas escapadas
    return JSON.parse(val);
  } catch {
    return {};
  }
}

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

// ─── Migration steps ────────────────────────────────────────────────────────

async function migrateUsers() {
  log('👤', 'Leyendo user_profiles_rows.csv...');
  const profiles = readCSV('user_profiles_rows.csv');
  if (!profiles || profiles.length === 0) {
    log('⚠️', 'No se encontraron perfiles de usuario');
    return [];
  }

  const stripeCustomers = readCSV('stripe_customers_rows.csv') || [];
  const stripeMap = new Map();
  for (const sc of stripeCustomers) {
    stripeMap.set(sc.user_id, sc);
  }

  // Verificar que todos los emails están configurados
  const missingEmails = profiles.filter(p => {
    const email = USER_EMAILS[p.id];
    return !email || email === 'PONER_EMAIL_AQUI';
  });
  if (missingEmails.length > 0) {
    console.error('\n❌ Faltan emails para estos UUIDs en USER_EMAILS:');
    for (const p of missingEmails) {
      console.error(`   ${p.id} (role: ${p.role})`);
    }
    console.error('\n   Edita USER_EMAILS en el script con los emails correctos.');
    console.error('   Los encuentras en Supabase → Authentication → Users.\n');
    process.exit(1);
  }

  console.log(`   ${profiles.length} perfiles, ${stripeCustomers.length} stripe customers`);

  const usersToInsert = [];
  const tempPasswords = [];

  for (const profile of profiles) {
    const uuid = profile.id;
    const email = USER_EMAILS[uuid].toLowerCase();
    const stripeInfo = stripeMap.get(uuid) || {};
    const tempPwd = generateTempPassword();

    const newObjectId = new mongoose.Types.ObjectId();
    userIdMap.set(uuid, newObjectId);

    usersToInsert.push({
      _id: newObjectId,
      email,
      password: await bcrypt.hash(tempPwd, 12),
      role: mapRole(profile.role),
      is_beta_tester: parseBool(profile.is_beta_tester),
      subscription_status: profile.subscription_status || 'none',
      subscription_plan: (profile.subscription_plan || 'free').toLowerCase(),
      subscription_expiry: parseDate(profile.subscription_expiry) || parseDate(profile.subscription_end),
      subscription_start_date: parseDate(profile.subscription_start_date) || parseDate(profile.subscription_start),
      trial_ends_at: parseDate(profile.trial_ends_at),
      next_billing_date: parseDate(profile.next_billing_date),
      stripe_customer_id:
        stripeInfo.stripe_customer_id ||
        profile.payment_provider_customer_id ||
        null,
      stripe_subscription_id:
        profile.payment_provider_subscription_id ||
        null,
      createdAt: parseDate(profile.created_at) || new Date(),
      updatedAt: parseDate(profile.updated_at) || new Date(),
    });

    tempPasswords.push({ email, tempPassword: tempPwd });
  }

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${usersToInsert.length} usuarios`);
    for (const u of usersToInsert) {
      console.log(`   - ${u.email} (${u.role})`);
    }
    return tempPasswords;
  }

  if (CLEAN) {
    await User.deleteMany({});
    log('🗑️', 'Colección Users limpiada');
  }

  if (usersToInsert.length > 0) {
    await User.collection.insertMany(usersToInsert);
  }
  log('✅', `${usersToInsert.length} usuarios insertados en MongoDB`);

  return tempPasswords;
}

async function migrateStripeProducts() {
  log('📦', 'Leyendo stripe_products_rows.csv...');
  const products = readCSV('stripe_products_rows.csv');
  if (!products || products.length === 0) {
    log('⚠️', 'No se encontraron productos');
    return;
  }
  console.log(`   ${products.length} productos`);

  const toInsert = products.map(p => ({
    stripe_product_id: p.stripe_product_id,
    name: p.name,
    description: p.description || '',
    metadata: parseJSON(p.metadata),
    active: parseBool(p.active),
  }));

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} productos`);
    return;
  }

  if (CLEAN) await StripeProduct.deleteMany({});
  if (toInsert.length > 0) {
    await StripeProduct.insertMany(toInsert, { ordered: false }).catch(handleDuplicates);
  }
  log('✅', `${toInsert.length} productos insertados`);
}

async function migrateStripePrices() {
  log('💰', 'Leyendo stripe_prices_rows.csv...');
  const prices = readCSV('stripe_prices_rows.csv');
  if (!prices || prices.length === 0) {
    log('⚠️', 'No se encontraron precios');
    return;
  }
  console.log(`   ${prices.length} precios`);

  const toInsert = prices.map(p => ({
    stripe_price_id: p.stripe_price_id,
    stripe_product_id: p.stripe_product_id,
    active: parseBool(p.active),
    currency: p.currency || 'eur',
    interval: p.interval || null,
    interval_count: parseNumber(p.interval_count) || 1,
    unit_amount: parseNumber(p.unit_amount),
  }));

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} precios`);
    return;
  }

  if (CLEAN) await StripePrice.deleteMany({});
  if (toInsert.length > 0) {
    await StripePrice.insertMany(toInsert, { ordered: false }).catch(handleDuplicates);
  }
  log('✅', `${toInsert.length} precios insertados`);
}

async function migrateStripeSubscriptions() {
  log('🔄', 'Leyendo stripe_subscriptions_rows.csv...');
  const subs = readCSV('stripe_subscriptions_rows.csv');
  if (!subs || subs.length === 0) {
    log('⚠️', 'No se encontraron suscripciones');
    return;
  }
  console.log(`   ${subs.length} suscripciones`);

  const toInsert = subs
    .filter(s => userIdMap.has(s.user_id))
    .map(s => ({
      user_id: userIdMap.get(s.user_id),
      stripe_subscription_id: s.stripe_subscription_id,
      stripe_customer_id: s.stripe_customer_id,
      stripe_price_id: s.stripe_price_id || null,
      status: s.status || 'active',
      cancel_at_period_end: parseBool(s.cancel_at_period_end),
      current_period_start: parseDate(s.current_period_start),
      current_period_end: parseDate(s.current_period_end),
    }));

  const skipped = subs.length - toInsert.length;
  if (skipped > 0) log('⚠️', `${skipped} suscripciones sin usuario válido, saltadas`);

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} suscripciones`);
    return;
  }

  if (CLEAN) await StripeSubscription.deleteMany({});
  if (toInsert.length > 0) {
    await StripeSubscription.insertMany(toInsert, { ordered: false }).catch(handleDuplicates);
  }
  log('✅', `${toInsert.length} suscripciones insertadas`);
}

async function migrateLinkedInPosts() {
  log('📝', 'Leyendo linkedin_posts_rows (2).csv...');
  const posts = readCSV('linkedin_posts_rows (2).csv');
  if (!posts || posts.length === 0) {
    log('⚠️', 'No se encontraron posts de LinkedIn');
    return;
  }
  console.log(`   ${posts.length} posts`);

  const toInsert = posts
    .filter(p => userIdMap.has(p.user_id))
    .map(p => ({
      url: p.url,
      user_id: userIdMap.get(p.user_id),
      date: parseDate(p.date) || new Date(),
      text: p.text || '',
      views: parseNumber(p.views),
      likes: parseNumber(p.likes),
      comments: parseNumber(p.comments),
      shares: parseNumber(p.shares),
      post_type: p.post_type || null,
      category: p.category || null,
      createdAt: parseDate(p.created_at) || new Date(),
      updatedAt: parseDate(p.updated_at) || new Date(),
    }));

  const skipped = posts.length - toInsert.length;
  if (skipped > 0) log('⚠️', `${skipped} posts sin usuario válido, saltados`);

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} posts de LinkedIn`);
    return;
  }

  if (CLEAN) await LinkedInPost.deleteMany({});
  if (toInsert.length > 0) {
    // Usar insertMany con ordered:false para saltar duplicados por URL
    await LinkedInPost.insertMany(toInsert, { ordered: false }).catch(handleDuplicates);
  }
  log('✅', `${toInsert.length} posts insertados`);
}

async function migratePlannerPosts() {
  log('📅', 'Leyendo posts_rows.csv (planner posts)...');
  const posts = readCSV('posts_rows.csv');
  if (!posts || posts.length === 0) {
    log('⚠️', 'No se encontraron planner posts');
    return;
  }
  console.log(`   ${posts.length} planner posts`);

  const toInsert = posts
    .filter(p => userIdMap.has(p.user_id))
    .map(p => {
      const newId = new mongoose.Types.ObjectId();
      plannerPostIdMap.set(p.id, newId);
      return {
        _id: newId,
        user_id: userIdMap.get(p.user_id),
        content: p.content || '',
        image_url: p.image_url || null,
        state: p.state || 'borrador',
        scheduled_datetime: parseDate(p.scheduled_datetime),
        createdAt: parseDate(p.created_at) || new Date(),
        updatedAt: parseDate(p.updated_at) || new Date(),
      };
    });

  const skipped = posts.length - toInsert.length;
  if (skipped > 0) log('⚠️', `${skipped} planner posts sin usuario válido, saltados`);

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} planner posts`);
    return;
  }

  if (CLEAN) await PlannerPost.deleteMany({});
  if (toInsert.length > 0) {
    await PlannerPost.collection.insertMany(toInsert);
  }
  log('✅', `${toInsert.length} planner posts insertados`);
}

async function migratePostOptimizations() {
  log('✨', 'Leyendo post_optimizations_rows.csv...');
  const opts = readCSV('post_optimizations_rows.csv');
  if (!opts || opts.length === 0) {
    log('⚠️', 'No se encontraron optimizaciones');
    return;
  }
  console.log(`   ${opts.length} optimizaciones`);

  const toInsert = opts
    .filter(o => userIdMap.has(o.user_id) && plannerPostIdMap.has(o.post_id))
    .map(o => ({
      post_id: plannerPostIdMap.get(o.post_id),
      user_id: userIdMap.get(o.user_id),
      original_content: o.original_content || '',
      optimized_content: o.optimized_content || '',
      createdAt: parseDate(o.created_at) || new Date(),
    }));

  const skipped = opts.length - toInsert.length;
  if (skipped > 0) log('⚠️', `${skipped} optimizaciones sin usuario/post válido, saltadas`);

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} optimizaciones`);
    return;
  }

  if (CLEAN) await PostOptimization.deleteMany({});
  if (toInsert.length > 0) {
    await PostOptimization.collection.insertMany(toInsert);
  }
  log('✅', `${toInsert.length} optimizaciones insertadas`);
}

async function migratePremiumActions() {
  log('⭐', 'Leyendo premium_actions_rows.csv...');
  const actions = readCSV('premium_actions_rows.csv');
  if (!actions || actions.length === 0) {
    log('⚠️', 'No se encontraron acciones premium');
    return;
  }
  console.log(`   ${actions.length} acciones`);

  const toInsert = actions
    .filter(a => userIdMap.has(a.user_id))
    .map(a => ({
      user_id: userIdMap.get(a.user_id),
      action_type: a.action_type,
      metadata: parseJSON(a.metadata),
      createdAt: parseDate(a.created_at) || new Date(),
    }));

  const skipped = actions.length - toInsert.length;
  if (skipped > 0) log('⚠️', `${skipped} acciones sin usuario válido, saltadas`);

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} acciones premium`);
    return;
  }

  if (CLEAN) await PremiumAction.deleteMany({});
  if (toInsert.length > 0) {
    await PremiumAction.collection.insertMany(toInsert);
  }
  log('✅', `${toInsert.length} acciones premium insertadas`);
}

async function migratePremiumLimits() {
  log('🔒', 'Leyendo premium_limits_rows.csv...');
  const limits = readCSV('premium_limits_rows.csv');
  if (!limits || limits.length === 0) {
    log('⚠️', 'No se encontraron límites premium');
    return;
  }
  console.log(`   ${limits.length} límites`);

  const toInsert = limits.map(l => ({
    role: (l.role || '').toUpperCase(),
    action_type: l.action_type,
    limit_type: l.limit_type,
    limit_value: parseNumber(l.limit_value),
  }));

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} límites premium`);
    return;
  }

  if (CLEAN) await PremiumLimit.deleteMany({});
  if (toInsert.length > 0) {
    await PremiumLimit.collection.insertMany(toInsert);
  }
  log('✅', `${toInsert.length} límites premium insertados`);
}

async function migrateRecommendations() {
  log('💡', 'Leyendo recommendations_rows.csv...');
  const recs = readCSV('recommendations_rows.csv');
  if (!recs || recs.length === 0) {
    log('⚠️', 'No se encontraron recomendaciones');
    return;
  }
  console.log(`   ${recs.length} recomendaciones`);

  const toInsert = recs
    .filter(r => userIdMap.has(r.user_id))
    .map(r => ({
      user_id: userIdMap.get(r.user_id),
      tipos_de_contenido: r.tipos_de_contenido || '',
      mejores_horarios: r.mejores_horarios || '',
      longitud_optima: r.longitud_optima || '',
      frecuencia_recomendada: r.frecuencia_recomendada || '',
      estrategias_de_engagement: r.estrategias_de_engagement || '',
      date_generated: parseDate(r.date_generated) || new Date(),
    }));

  const skipped = recs.length - toInsert.length;
  if (skipped > 0) log('⚠️', `${skipped} recomendaciones sin usuario válido, saltadas`);

  if (DRY_RUN) {
    log('🔍', `[DRY RUN] Se insertarían ${toInsert.length} recomendaciones`);
    return;
  }

  if (CLEAN) await Recommendation.deleteMany({});
  if (toInsert.length > 0) {
    await Recommendation.collection.insertMany(toInsert);
  }
  log('✅', `${toInsert.length} recomendaciones insertadas`);
}

// ─── Validation ─────────────────────────────────────────────────────────────

async function validate() {
  log('🔎', 'Validando migración...');

  const counts = {
    Users: await User.countDocuments(),
    LinkedInPosts: await LinkedInPost.countDocuments(),
    PlannerPosts: await PlannerPost.countDocuments(),
    PostOptimizations: await PostOptimization.countDocuments(),
    PremiumActions: await PremiumAction.countDocuments(),
    PremiumLimits: await PremiumLimit.countDocuments(),
    StripeProducts: await StripeProduct.countDocuments(),
    StripePrices: await StripePrice.countDocuments(),
    StripeSubscriptions: await StripeSubscription.countDocuments(),
    Recommendations: await Recommendation.countDocuments(),
  };

  console.log('\n📊 Documentos en MongoDB:');
  for (const [col, count] of Object.entries(counts)) {
    console.log(`   ${col}: ${count}`);
  }

  // Verificar integridad referencial
  const userIds = await User.distinct('_id');
  const orphanPosts = await LinkedInPost.countDocuments({ user_id: { $nin: userIds } });
  const orphanPlanner = await PlannerPost.countDocuments({ user_id: { $nin: userIds } });
  const orphanOpts = await PostOptimization.countDocuments({ user_id: { $nin: userIds } });

  if (orphanPosts > 0 || orphanPlanner > 0 || orphanOpts > 0) {
    log('⚠️', `Registros huérfanos: ${orphanPosts} linkedin posts, ${orphanPlanner} planner posts, ${orphanOpts} optimizaciones`);
  } else {
    log('✅', 'Integridad referencial OK');
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function handleDuplicates(err) {
  if (err.code === 11000) {
    const inserted = err.result?.insertedCount || err.insertedDocs?.length || '?';
    log('⚠️', `Algunos registros duplicados saltados (${inserted} insertados)`);
  } else {
    throw err;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Migración CSV → MongoDB (Linksight)');
  console.log('═══════════════════════════════════════════════');

  if (DRY_RUN) log('🔍', 'Modo DRY RUN - no se insertarán datos\n');
  if (CLEAN) log('🗑️', 'Modo CLEAN - se limpiarán colecciones antes de insertar\n');
  if (ONLY) log('🎯', `Solo migrando: ${ONLY}\n`);

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  log('🔌', `MongoDB conectado: ${mongoose.connection.host}\n`);

  const steps = {
    users: migrateUsers,
    products: migrateStripeProducts,
    prices: migrateStripePrices,
    subscriptions: migrateStripeSubscriptions,
    posts: migrateLinkedInPosts,
    planner: migratePlannerPosts,
    optimizations: migratePostOptimizations,
    actions: migratePremiumActions,
    limits: migratePremiumLimits,
    recommendations: migrateRecommendations,
  };

  let tempPasswords = [];

  if (ONLY) {
    if (!steps[ONLY]) {
      console.error(`❌ Entidad desconocida: ${ONLY}`);
      console.error(`   Opciones: ${Object.keys(steps).join(', ')}`);
      process.exit(1);
    }
    // Users siempre debe correr primero para el mapa de IDs
    if (ONLY !== 'users') {
      tempPasswords = await migrateUsers();
    }
    // Planner debe correr antes de optimizations para el mapa de post IDs
    if (ONLY === 'optimizations') {
      await migratePlannerPosts();
    }
    await steps[ONLY]();
  } else {
    for (const [name, fn] of Object.entries(steps)) {
      console.log(`\n--- ${name.toUpperCase()} ---`);
      const result = await fn();
      if (name === 'users') tempPasswords = result;
    }
  }

  // Validate
  if (!DRY_RUN) {
    console.log('\n--- VALIDACIÓN ---');
    await validate();
  }

  // Show temp passwords
  if (tempPasswords && tempPasswords.length > 0) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  Contraseñas temporales (guardar en lugar seguro)');
    console.log('═══════════════════════════════════════════════');
    for (const { email, tempPassword } of tempPasswords) {
      console.log(`  ${email}: ${tempPassword}`);
    }
    console.log('\n⚠️  Los usuarios deberán cambiar su contraseña');
  }

  await mongoose.disconnect();
  log('🏁', '\nMigración completada\n');
}

main().catch(err => {
  console.error('\n❌ Error en migración:', err);
  process.exit(1);
});
