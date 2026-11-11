// Configuración de Express: middlewares, rutas de la API y, en producción, el frontend compilado
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import baseDeDatos from './middleware/baseDeDatos.js';
import autenticacion from './middleware/autenticacion.js';
import { rutaNoEncontrada, manejarErrores } from './middleware/errores.js';
import auth from './routes/auth.js';
import clientes from './routes/clientes.js';
import servicios from './routes/servicios.js';
import horarios from './routes/horarios.js';
import citas from './routes/citas.js';
import disponibilidad from './routes/disponibilidad.js';
import reportes from './routes/reportes.js';
const app = express();
app.use(helmet());
// Límite general: 300 peticiones por IP cada 15 minutos sobre toda la API
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10kb' }));
app.use('/api', baseDeDatos);
app.use('/api/auth', auth); // pública: aquí se obtiene el token
app.use('/api', autenticacion); // de aquí en adelante, toda la API exige sesión
app.use('/api/clientes', clientes);
app.use('/api/servicios', servicios);
app.use('/api/horarios', horarios);
app.use('/api/citas', citas);
app.use('/api/disponibilidad', disponibilidad);
app.use('/api/reportes', reportes);
app.use('/api', rutaNoEncontrada);
// Si existe frontend/dist (npm run build), el mismo servidor lo publica
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use(manejarErrores);
export default app;
