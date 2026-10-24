import { Router } from 'express';
import { body } from 'express-validator';
import { createGroup, joinGroup, getMyGroup, leaveGroup, removeMember } from '../controllers/group.controller.js';
import { verifyJWT, requireGroupOwner } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post(
  '/create',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Group name must be between 2 and 80 characters'),
  ],
  validate,
  createGroup
);

router.post(
  '/join',
  [
    body('inviteCode').isAlphanumeric().isLength({ min: 8, max: 8 }).withMessage('Invite code must be exactly 8 alphanumeric characters'),
  ],
  validate,
  joinGroup
);

router.get('/mine', getMyGroup);
router.delete('/leave', leaveGroup);
router.delete('/remove-member/:userId', requireGroupOwner, removeMember);

export default router;
