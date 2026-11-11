// Reglas de agenda: cupos, cruces de horarios y serialización de escrituras
import Cita from '../models/Cita.js';
import Horario from '../models/Horario.js';
import Cliente from '../models/Cliente.js';
import Servicio from '../models/Servicio.js';
import { hoyLocal, ahoraMin, diaSemana, aMin, deMin } from '../../../shared/validaciones.js';
let cola = Promise.resolve();
// Atiende las escrituras de citas una a una para evitar dobles reservas simultáneas
export const enCola = (fn) => { const r = cola.then(fn); cola = r.catch(() => {}); return r; };
export const agendaDelDia = (fecha, excluirId) =>
  Cita.find({ fecha, estado: 'Programada', ...(excluirId ? { _id: { $ne: excluirId } } : {}) }).select('cliente horaInicio horaFin').lean();
export const seCruza = (c, ini, fin) => aMin(c.horaInicio) < fin && ini < aMin(c.horaFin);
// Devuelve null si la cita cabe en la agenda, o { status, errores } con el motivo
export async function comprobarAgenda({ fecha, horaInicio, duracionMin, clienteId, excluirId }) {
  const hor = await Horario.findOne({ dia: diaSemana(fecha) }).lean();
  if (!hor || !hor.activo) return { status: 400, errores: { fecha: 'El centro no atiende ese día. Elija otra fecha.' } };
  const ini = aMin(horaInicio), fin = ini + duracionMin;
  if (ini < aMin(hor.apertura) || fin > aMin(hor.cierre)) return { status: 400, errores: { horaInicio: `La cita debe terminar dentro del horario de atención (${hor.apertura} a ${hor.cierre}).` } };
  if (fecha === hoyLocal() && ini <= ahoraMin()) return { status: 400, errores: { horaInicio: 'Esa hora ya pasó. Elija una posterior.' } };
  const solapadas = (await agendaDelDia(fecha, excluirId)).filter((c) => seCruza(c, ini, fin));
  if (solapadas.length >= hor.capacidad) return { status: 409, errores: { horaInicio: 'Ese horario ya no tiene cupo. Consulte la disponibilidad.' } };
  if (solapadas.some((c) => String(c.cliente) === String(clienteId))) return { status: 409, errores: { clienteId: 'El cliente ya tiene una cita que se cruza con ese horario.' } };
  return null;
}
// Verifica que el cliente y el servicio existan y que el servicio esté activo
export async function referencias(datos) {
  const [cli, ser] = await Promise.all([Cliente.findById(datos.clienteId).lean(), Servicio.findById(datos.servicioId).lean()]);
  const e = {};
  if (!cli) e.clienteId = 'El cliente seleccionado no existe.';
  if (!ser) e.servicioId = 'El servicio seleccionado no existe.'; else if (!ser.activo) e.servicioId = 'El servicio está inactivo.';
  return { e, ser };
}
// Documento de cita listo para guardar, con la copia de los datos del servicio
export const instantanea = (datos, ser) => ({
  cliente: datos.clienteId, servicio: ser._id, servicioNombre: ser.nombre, duracionMin: ser.duracionMin, precio: ser.precio,
  fecha: datos.fecha, horaInicio: datos.horaInicio, horaFin: deMin(aMin(datos.horaInicio) + ser.duracionMin), notas: datos.notas,
});
