import { Router } from 'express';
import { consultar } from '../controllers/disponibilidad.js';
const r = Router();
r.get('/', consultar);
export default r;
