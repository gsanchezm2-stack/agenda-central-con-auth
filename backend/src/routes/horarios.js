import { Router } from 'express';
import * as ctl from '../controllers/horarios.js';
const r = Router();
r.get('/', ctl.listar);
r.put('/:dia', ctl.actualizar);
export default r;
