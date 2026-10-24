import { Router } from 'express';
import { triggerSOS, resolveSOS, getActiveSOS, getSOSHistory } from '../controllers/sos.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/trigger', triggerSOS);
router.patch('/:alertId/resolve', resolveSOS);
router.get('/active', getActiveSOS);
router.get('/history', getSOSHistory);

export default router;
