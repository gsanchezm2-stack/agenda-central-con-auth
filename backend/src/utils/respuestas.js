// Utilidades comunes de los controladores
import { Router } from 'express';
import { ID } from '../../../shared/validaciones.js';
export const esId = (id) => ID.test(String(id));
export const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const err400 = (res, errores) => res.status(400).json({ mensaje: 'Revise los campos marcados.', errores });
export const idMal = (res) => res.status(400).json({ mensaje: 'El identificador no es válido.' });
export const noHay = (res) => res.status(404).json({ mensaje: 'El registro no existe o ya fue eliminado.' });
// Cambia _id por id y quita las marcas de tiempo
export const salida = (d) => { const { _id, createdAt, updatedAt, ...r } = d; return { id: String(_id), ...r }; };
// Hace que los errores de un controlador async lleguen al middleware de errores
export const asinc = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Rutas estándar de un CRUD
export const rutasCrud = (ctl) => {
  const r = Router();
  r.get('/', ctl.listar); r.post('/', ctl.crear);
  r.get('/:id', ctl.obtener); r.put('/:id', ctl.actualizar); r.delete('/:id', ctl.eliminar);
  return r;
};
