import { Router } from 'express';
import { protect, requireAdmin } from '../../middleware/authMiddleware.js';
import { getDomains, addDomain, setDomainStatus, makePrimary, removeDomain } from './domainController.js';

const router = Router();

// All domain management is admin-only
router.use(protect, requireAdmin);

router.get('/', getDomains);
router.post('/', addDomain);
router.patch('/:id/status', setDomainStatus);
router.patch('/:id/primary', makePrimary);
router.delete('/:id', removeDomain);

export default router;
