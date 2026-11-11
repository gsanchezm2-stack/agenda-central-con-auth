import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login } from '../controllers/auth.js';
// Máximo 10 intentos de inicio de sesión por IP cada 15 minutos, para dificultar la fuerza bruta
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Espere unos minutos y vuelva a intentar.' },
});
const r = Router();
r.post('/login', limiteLogin, login);
export default r;
