import { Router } from 'express';
import { getRules, createRule, toggleRule, deleteRule } from '../controllers/ruleController.js';

const router = Router();

router.get('/', getRules);
router.post('/', createRule);
router.patch('/:id/toggle', toggleRule);
router.delete('/:id', deleteRule);

export default router;
