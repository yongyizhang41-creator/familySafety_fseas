import { Router } from 'express';
import { body } from 'express-validator';
import { updateLocation, getLocationHistory, getLatestLocations } from '../controllers/location.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post(
  '/update',
  [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  ],
  validate,
  updateLocation
);

router.get('/history/:userId', getLocationHistory);
router.get('/latest', getLatestLocations);

export default router;
