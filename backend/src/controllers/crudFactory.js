// Fábrica de controladores CRUD que reutilizan clientes y servicios
import Cita from '../models/Cita.js';
import { COLACION } from '../models/Servicio.js';
import { T } from '../../../shared/validaciones.js';
import { asinc, err400, idMal, noHay, esId, escapar, salida } from '../utils/respuestas.js';
export function crearCrud({ Modelo, validar, unico, mensajeDuplicado, orden, camposBusqueda, campoEnCita, mensajeNoEliminar, colacion, filtroExtra, alActualizar }) {
  // Busca otro registro con el mismo valor en el campo único
  const duplicado = (datos, id) => {
    const f = { [unico]: datos[unico] }; if (id) f._id = { $ne: id };
    const q = Modelo.findOne(f).select('_id'); return colacion ? q.collation(COLACION) : q;
  };
  const respDuplicado = (res) => res.status(409).json({ mensaje: mensajeDuplicado, errores: { [unico]: mensajeDuplicado } });
  return {
    listar: asinc(async (req, res) => {
      const f = filtroExtra ? filtroExtra(req) : {}; const q = T(req.query.q);
      if (q) { const rx = new RegExp(escapar(q), 'i'); f.$or = camposBusqueda.map((c) => ({ [c]: rx })); }
      res.json((await Modelo.find(f).sort(orden).lean()).map(salida));
    }),
    obtener: asinc(async (req, res) => {
      if (!esId(req.params.id)) return idMal(res);
      const d = await Modelo.findById(req.params.id).lean();
      return d ? res.json(salida(d)) : noHay(res);
    }),
    crear: asinc(async (req, res) => {
      const { errores, datos } = validar(req.body);
      if (Object.keys(errores).length) return err400(res, errores);
      if (await duplicado(datos)) return respDuplicado(res);
      res.status(201).json(salida((await Modelo.create(datos)).toObject()));
    }),
    actualizar: asinc(async (req, res) => {
      if (!esId(req.params.id)) return idMal(res);
      const { errores, datos } = validar(req.body);
      if (Object.keys(errores).length) return err400(res, errores);
      if (await duplicado(datos, req.params.id)) return respDuplicado(res);
      const d = await Modelo.findByIdAndUpdate(req.params.id, datos, { new: true, runValidators: true }).lean();
      if (!d) return noHay(res);
      if (alActualizar) await alActualizar(d);
      res.json(salida(d));
    }),
    eliminar: asinc(async (req, res) => {
      if (!esId(req.params.id)) return idMal(res);
      // Protege el historial: no se borra lo que tiene citas
      if (await Cita.exists({ [campoEnCita]: req.params.id })) return res.status(409).json({ mensaje: mensajeNoEliminar });
      const d = await Modelo.findByIdAndDelete(req.params.id).lean();
      return d ? res.status(204).end() : noHay(res);
    }),
  };
}
