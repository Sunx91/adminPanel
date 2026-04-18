const express = require('express');
const authService = require('../services/authService');
const { User } = require('../models');
const { requireJwt } = require('../middleware/requireJwt');

const router = express.Router();

/**
 * POST /api/login
 * Body: { email, password }
 * Returns JWT + public user on success.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await authService.verifyCredentials(email, password);

    if (!result.ok) {
      const status = result.code === 'VALIDATION_ERROR' ? 400 : 401;
      return res.status(status).json({
        success: false,
        error: { code: result.code, message: result.message },
      });
    }

    const token = authService.issueAccessToken(result.user);

    return res.json({
      success: true,
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        user: authService.toPublicUser(result.user),
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login could not be completed' },
    });
  }
});

/**
 * GET /api/me
 * Header: Authorization: Bearer <token>
 * Returns the current user from the database (fresh role/email).
 */
router.get('/me', requireJwt, async (req, res) => {
  try {
    const user = await User.findByPk(req.auth.sub, {
      attributes: ['id', 'email', 'role', 'createdAt'],
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' },
      });
    }
    return res.json({
      success: true,
      data: { user: authService.toPublicUser(user) },
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Could not load profile' },
    });
  }
});

module.exports = router;
