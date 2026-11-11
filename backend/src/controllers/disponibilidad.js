import Horario from '../models/Horario.js';
import Servicio from '../models/Servicio.js';
import { agendaDelDia, seCruza } from '../services/agenda.js';
import { T, fechaReal, hoyLocal, ahoraMin, diaSemana, aMin, deMin } from '../../../shared/validaciones.js';
import { asinc, err400, noHay, esId } from '../utils/respuestas.js';
// Calcula, en bloques de 15 minutos, cuántos cupos quedan para la duración del servicio
export const consultar = asinc(async (req, res) => {
  const fecha = T(req.query.fecha), sid = T(req.query.servicioId), e = {};
  if (!fechaReal(fecha)) e.fecha = 'Ingrese una fecha válida.';
  if (!esId(sid)) e.servicioId = 'Seleccione un servicio.';
  if (Object.keys(e).length) return err400(res, e);
  const ser = await Servicio.findById(sid).lean();
  if (!ser) return noHay(res);
  if (fecha < hoyLocal()) return res.json({ fecha, abierto: false, mensaje: 'Esa fecha ya pasó.', slots: [] });
  const hor = await Horario.findOne({ dia: diaSemana(fecha) }).lean();
  if (!hor || !hor.activo) return res.json({ fecha, abierto: false, mensaje: 'El centro no atiende ese día.', slots: [] });
  // excluirCitaId permite reprogramar sin que la propia cita ocupe cupo
  const dia = await agendaDelDia(fecha, esId(req.query.excluirCitaId) ? req.query.excluirCitaId : null);
  const slots = [];
  for (let ini = aMin(hor.apertura); ini + ser.duracionMin <= aMin(hor.cierre); ini += 15) {
    const libres = Math.max(0, hor.capacidad - dia.filter((c) => seCruza(c, ini, ini + ser.duracionMin)).length);
    slots.push({ hora: deMin(ini), libres, disponible: libres > 0 && !(fecha === hoyLocal() && ini <= ahoraMin()) });
  }
  res.json({ fecha, abierto: true, apertura: hor.apertura, cierre: hor.cierre, capacidad: hor.capacidad, duracionMin: ser.duracionMin, slots });
});
