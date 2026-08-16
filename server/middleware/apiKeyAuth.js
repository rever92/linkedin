import crypto from 'crypto';
import User from '../models/User.js';
import auth from './auth.js';

const BEARER_PREFIX = 'Bearer ';

function keysMatch(configuredKey, presentedKey) {
  const configured = Buffer.from(String(configuredKey));
  const presented = Buffer.from(String(presentedKey));
  return configured.length === presented.length && crypto.timingSafeEqual(configured, presented);
}

// Guard de API key de solo lectura para servicios externos (p. ej. nexo).
// Si LINKSIGHT_API_KEY no esta definida es un no-op absoluto: toda peticion
// cae al JWT habitual sin alterarlo, por lo que desplegar sin configurarla
// es inocuo.
const apiKeyAuth = async (req, res, next) => {
  const configuredKey = process.env.LINKSIGHT_API_KEY;
  const configuredUserId = process.env.LINKSIGHT_API_USER_ID;

  if (!configuredKey || !configuredUserId) {
    return auth(req, res, next);
  }

  const authHeader = req.headers.authorization;
  const presentedKey = authHeader && authHeader.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length).trim()
    : null;

  if (!presentedKey || !keysMatch(configuredKey, presentedKey)) {
    return auth(req, res, next);
  }

  if (req.method !== 'GET') {
    return res.status(403).json({ error: 'La API key solo autoriza peticiones GET' });
  }

  try {
    const user = await User.findById(configuredUserId).select('-password -refresh_token');
    if (!user) {
      return res.status(401).json({ error: 'LINKSIGHT_API_USER_ID no corresponde a un usuario existente' });
    }
    req.user = user;
    req.userId = user._id.toString();
    req.isApiKey = true;
    next();
  } catch (error) {
    next(error);
  }
};

export default apiKeyAuth;
