import Cita from '../models/Cita.js';
import { validarCita, validarEstado, hoyLocal, fechaReal, T } from '../../../shared/validaciones.js';
import { enCola, comprobarAgenda, referencias, instantanea } from '../services/agenda.js';
import { asinc, err400, idMal, noHay, esId } from '../utils/respuestas.js';
const poblar = (q) => q.populate('cliente', 'nombre documento');
// Formato de la cita que recibe el navegador (con el cliente ya cargado)
export const salidaCita = (c) => {
  const cli = c.cliente && c.cliente.nombre ? { id: String(c.cliente._id), nombre: c.cliente.nombre, documento: c.cliente.documento } : null;
  return { id: String(c._id), clienteId: String(c.cliente && c.cliente._id ? c.cliente._id : c.cliente), cliente: cli, servicioId: String(c.servicio),
    servicioNombre: c.servicioNombre, duracionMin: c.duracionMin, precio: c.precio, fecha: c.fecha, horaInicio: c.horaInicio, horaFin: c.horaFin,
    estado: c.estado, notas: c.notas, motivoCancelacion: c.motivoCancelacion };
};
// Responde según el resultado de una operación hecha dentro de la cola
const responder = (res, r, codigoOk = 200) => {
  if (r.errores) return res.status(r.status).json({ mensaje: Object.values(r.errores)[0], errores: r.errores });
  if (r.mensaje) return res.status(r.status).json({ mensaje: r.mensaje });
  return res.status(codigoOk).json(r.cita);
};
export const listar = asinc(async (req, res) => {
  const f = {}, e = {}, desde = T(req.query.desde), hasta = T(req.query.hasta);
  if (desde) { if (fechaReal(desde)) f.fecha = { ...f.fecha, $gte: desde }; else e.desde = 'Fecha inicial no válida.'; }
  if (hasta) { if (fechaReal(hasta)) f.fecha = { ...f.fecha, $lte: hasta }; else e.hasta = 'Fecha final no válida.'; }
  if (Object.keys(e).length) return err400(res, e);
  if (['Programada', 'Atendida', 'Cancelada'].includes(req.query.estado)) f.estado = req.query.estado;
  let lista = (await poblar(Cita.find(f).sort({ fecha: 1, horaInicio: 1 })).lean()).map(salidaCita);
  const q = T(req.query.q).toLowerCase();
  if (q) lista = lista.filter((c) => c.cliente && (c.cliente.nombre.toLowerCase().includes(q) || c.cliente.documento.includes(q)));
  res.json(lista);
});
export const obtener = asinc(async (req, res) => {
  if (!esId(req.params.id)) return idMal(res);
  const c = await poblar(Cita.findById(req.params.id)).lean();
  return c ? res.json(salidaCita(c)) : noHay(res);
});
export const crear = asinc(async (req, res) => {
  const { errores, datos } = validarCita(req.body);
  if (Object.keys(errores).length) return err400(res, errores);
  const r = await enCola(async () => {
    const { e, ser } = await referencias(datos);
    if (Object.keys(e).length) return { status: 400, errores: e };
    const conflicto = await comprobarAgenda({ ...datos, duracionMin: ser.duracionMin });
    if (conflicto) return conflicto;
    const doc = await Cita.create(instantanea(datos, ser));
    return { cita: salidaCita(await poblar(Cita.findById(doc._id)).lean()) };
  });
  responder(res, r, 201);
});
export const actualizar = asinc(async (req, res) => {
  if (!esId(req.params.id)) return idMal(res);
  const { errores, datos } = validarCita(req.body);
  if (Object.keys(errores).length) return err400(res, errores);
  const r = await enCola(async () => {
    const actual = await Cita.findById(req.params.id).lean();
    if (!actual) return { status: 404, errores: { general: 'El registro no existe o ya fue eliminado.' } };
    if (actual.estado !== 'Programada') return { status: 409, errores: { general: 'Solo se pueden modificar citas programadas.' } };
    const { e, ser } = await referencias(datos);
    if (Object.keys(e).length) return { status: 400, errores: e };
    // La cita se excluye a sí misma al revisar cupos y cruces
    const conflicto = await comprobarAgenda({ ...datos, duracionMin: ser.duracionMin, excluirId: req.params.id });
    if (conflicto) return conflicto;
    await Cita.updateOne({ _id: req.params.id }, instantanea(datos, ser), { runValidators: true });
    return { cita: salidaCita(await poblar(Cita.findById(req.params.id)).lean()) };
  });
  responder(res, r);
});
// Cancelar (con motivo) o marcar como atendida
export const cambiarEstado = asinc(async (req, res) => {
  if (!esId(req.params.id)) return idMal(res);
  const { errores, datos } = validarEstado(req.body);
  if (Object.keys(errores).length) return err400(res, errores);
  const r = await enCola(async () => {
    const c = await Cita.findById(req.params.id).lean();
    if (!c) return { status: 404, mensaje: 'El registro no existe o ya fue eliminado.' };
    if (c.estado !== 'Programada') return { status: 409, mensaje: 'Solo se pueden cambiar citas programadas.' };
    if (datos.estado === 'Atendida' && c.fecha > hoyLocal()) return { status: 409, mensaje: 'No se puede marcar como atendida una cita futura.' };
    await Cita.updateOne({ _id: c._id }, { estado: datos.estado, motivoCancelacion: datos.motivo });
    return { cita: salidaCita(await poblar(Cita.findById(c._id)).lean()) };
  });
  responder(res, r);
});
export const eliminar = asinc(async (req, res) => {
  if (!esId(req.params.id)) return idMal(res);
  const d = await enCola(() => Cita.findByIdAndDelete(req.params.id).lean());
  return d ? res.status(204).end() : noHay(res);
});
