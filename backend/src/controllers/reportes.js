import Cita from '../models/Cita.js';
import { T, fechaReal, hoyLocal, sumarDias } from '../../../shared/validaciones.js';
import { asinc, err400 } from '../utils/respuestas.js';
export const generar = asinc(async (req, res) => {
  const hoy = hoyLocal(), desde = T(req.query.desde) || sumarDias(hoy, -30), hasta = T(req.query.hasta) || hoy, e = {};
  if (!fechaReal(desde)) e.desde = 'Fecha inicial no válida.';
  if (!fechaReal(hasta)) e.hasta = 'Fecha final no válida.';
  if (!e.desde && !e.hasta && desde > hasta) e.hasta = 'La fecha final no puede ser anterior a la inicial.';
  if (!e.desde && !e.hasta && sumarDias(desde, 366) < hasta) e.hasta = 'El rango no puede superar un año.';
  if (Object.keys(e).length) return err400(res, e);
  const citas = await Cita.find({ fecha: { $gte: desde, $lte: hasta } }).populate('cliente', 'nombre').lean();
  const porEstado = { Programada: 0, Atendida: 0, Cancelada: 0 }, serv = {}, dias = {}, clis = {};
  let ingresos = 0;
  for (const c of citas) {
    porEstado[c.estado]++;
    const s = (serv[c.servicioNombre] ||= { servicio: c.servicioNombre, total: 0, atendidas: 0, canceladas: 0, ingresos: 0 });
    s.total++;
    // Los ingresos cuentan solo las citas atendidas
    if (c.estado === 'Atendida') { s.atendidas++; s.ingresos += c.precio; ingresos += c.precio; }
    if (c.estado === 'Cancelada') s.canceladas++;
    dias[c.fecha] = (dias[c.fecha] || 0) + 1;
    if (c.estado === 'Atendida' && c.cliente) clis[c.cliente.nombre] = (clis[c.cliente.nombre] || 0) + 1;
  }
  res.json({
    desde, hasta, total: citas.length, porEstado, ingresos,
    tasaCancelacion: citas.length ? Math.round((porEstado.Cancelada / citas.length) * 1000) / 10 : 0,
    porServicio: Object.values(serv).sort((a, b) => b.total - a.total),
    porDia: Object.entries(dias).sort().map(([fecha, total]) => ({ fecha, total })),
    topClientes: Object.entries(clis).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, atenciones]) => ({ nombre, atenciones })),
  });
});
