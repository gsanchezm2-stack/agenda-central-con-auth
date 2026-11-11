import Horario from '../models/Horario.js';
import Cita from '../models/Cita.js';
import { validarHorario, hoyLocal, diaSemana, aMin } from '../../../shared/validaciones.js';
import { asinc, err400, salida } from '../utils/respuestas.js';
export const listar = asinc(async (req, res) => {
  res.json((await Horario.find().sort({ dia: 1 }).lean()).map(salida));
});
export const actualizar = asinc(async (req, res) => {
  if (!/^[0-6]$/.test(req.params.dia)) return res.status(400).json({ mensaje: 'El día debe ser un número de 0 (domingo) a 6 (sábado).' });
  const dia = Number(req.params.dia);
  const { errores, datos } = validarHorario(req.body);
  if (Object.keys(errores).length) return err400(res, errores);
  // No se permite dejar citas programadas fuera del nuevo horario
  const futuras = await Cita.find({ estado: 'Programada', fecha: { $gte: hoyLocal() } }).select('fecha horaInicio horaFin').lean();
  const afectadas = futuras.filter((c) => diaSemana(c.fecha) === dia && (!datos.activo || aMin(c.horaInicio) < aMin(datos.apertura) || aMin(c.horaFin) > aMin(datos.cierre)));
  if (afectadas.length) {
    const m = `Hay ${afectadas.length} cita(s) programada(s) que quedarían fuera de ese horario. Reprográmelas o cancélelas primero.`;
    return res.status(409).json({ mensaje: m, errores: { general: m } });
  }
  res.json(salida(await Horario.findOneAndUpdate({ dia }, datos, { new: true, upsert: true, runValidators: true }).lean()));
});
