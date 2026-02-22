import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este email' });
    }

    const user = new User({ email, password });
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store hashed refresh token
    user.refresh_token = await bcrypt.hash(refreshToken, 10);
    user.last_login = new Date();
    await user.save();

    res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: user.toProfile(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refresh_token = await bcrypt.hash(refreshToken, 10);
    user.last_login = new Date();
    await user.save();

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: user.toProfile(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refresh_token) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    const isValid = await bcrypt.compare(refresh_token, user.refresh_token);
    if (!isValid) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    // Token rotation
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refresh_token = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: user.toProfile(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toProfile() });
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.userId, { refresh_token: null });
    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    next(error);
  }
});

export default router;
