import { Router } from 'express';
import * as ctl from '../controllers/citas.js';
const r = Router();
r.get('/', ctl.listar); r.post('/', ctl.crear);
r.get('/:id', ctl.obtener); r.put('/:id', ctl.actualizar); r.delete('/:id', ctl.eliminar);
r.patch('/:id/estado', ctl.cambiarEstado);
export default r;
