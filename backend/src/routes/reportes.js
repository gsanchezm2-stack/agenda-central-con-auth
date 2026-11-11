import { Router } from 'express';
import { generar } from '../controllers/reportes.js';
const r = Router();
r.get('/', generar);
export default r;
