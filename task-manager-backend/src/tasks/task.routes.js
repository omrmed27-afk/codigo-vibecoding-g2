import { Router } from 'express';
import * as controller from './task.controller.js';

const router = Router();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
