import { Router } from 'express';
import { getQueue } from '../controllers/queueController.js';

const router = Router();
router.get('/', getQueue);
export default router;
