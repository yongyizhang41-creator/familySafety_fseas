import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getNotifications);
router.patch('/mark-read', markAsRead);

export default router;
