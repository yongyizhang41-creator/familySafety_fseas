import { Router } from 'express';
import { body } from 'express-validator';
import { createSafeZone, getSafeZones, updateSafeZone, deleteSafeZone } from '../controllers/safezone.controller.js';
import { verifyJWT, requireGroupOwner } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

router.use(verifyJWT);

const safeZoneValidation = [
  body('name').trim().isLength({ min: 1, max: 60 }).withMessage('Name must be between 1 and 60 characters'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('radius').isFloat({ min: 50, max: 5000 }).withMessage('Radius must be between 50 and 5000 meters'),
];

router.post('/create', requireGroupOwner, safeZoneValidation, validate, createSafeZone);
router.get('/', getSafeZones);
router.patch('/:zoneId', requireGroupOwner, safeZoneValidation, validate, updateSafeZone);
router.delete('/:zoneId', requireGroupOwner, deleteSafeZone);

export default router;
