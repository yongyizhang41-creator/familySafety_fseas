import { Router } from 'express';
import { getAllUsers, getAllGroups, deleteUser } from '../controllers/admin.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Only users with role: 'admin' can access these routes
router.use(verifyJWT, authorizeRoles('admin'));

router.get('/users', getAllUsers);
router.get('/groups', getAllGroups);
router.delete('/users/:userId', deleteUser);

export default router;
