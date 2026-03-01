import { Router } from 'express';
import { submitEvent } from '../controllers/eventController.js';

const router = Router();

router.post('/', submitEvent);

export default router;
