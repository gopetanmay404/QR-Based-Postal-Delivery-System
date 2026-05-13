const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logger } = require('../utils/logger');

const SALT_ROUNDS = 12;
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or phone already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: { name, phone, email, passwordHash },
    });

    // Generate tokens
    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/postman-login
 */
async function postmanLogin(req, res, next) {
  try {
    const { employeeId, password } = req.body;

    const postman = await prisma.postman.findUnique({ where: { employeeId } });
    if (!postman) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }

    const isValid = await bcrypt.compare(password, postman.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }

    const tokenPayload = { id: postman.id, role: 'POSTMAN' };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    logger.info(`Postman logged in: ${postman.employeeId}`);

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: postman.id,
        name: postman.name,
        employeeId: postman.employeeId,
        role: 'POSTMAN',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(token);

    // Generate new access token
    const tokenPayload = { id: decoded.id, role: decoded.role };
    const accessToken = generateAccessToken(tokenPayload);

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken(tokenPayload);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ accessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out successfully' });
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, postmanLogin, refresh, logout, getMe };
