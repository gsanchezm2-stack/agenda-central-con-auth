import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import { T } from '../../../shared/validaciones.js';
import { asinc } from '../utils/respuestas.js';
// Mensaje genérico a propósito: no revela si el usuario existe o la clave es la que falló
const credencialesInvalidas = (res) => res.status(401).json({ mensaje: 'Usuario o clave incorrectos.' });
export const login = asinc(async (req, res) => {
  const usuario = T(req.body?.usuario).toLowerCase();
  const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
  if (!usuario || !clave) return res.status(400).json({ mensaje: 'Ingrese usuario y clave.' });
  const u = await Usuario.findOne({ usuario });
  if (!u) return credencialesInvalidas(res);
  const ok = await bcrypt.compare(clave, u.claveHash);
  if (!ok) return credencialesInvalidas(res);
  const token = jwt.sign({ sub: String(u._id), usuario: u.usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, usuario: u.usuario });
});
