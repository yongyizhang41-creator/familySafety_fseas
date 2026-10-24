import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, refresh, getMe, updateProfile } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', verifyJWT, logout);
router.post('/refresh', refresh);
router.get('/me', verifyJWT, getMe);
router.patch('/profile', verifyJWT, updateProfile);

export default router;
