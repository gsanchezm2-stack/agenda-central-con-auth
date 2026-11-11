import Servicio from '../models/Servicio.js';
import Cita from '../models/Cita.js';
import { validarServicio } from '../../../shared/validaciones.js';
import { crearCrud } from './crudFactory.js';
export default crearCrud({
  Modelo: Servicio, validar: validarServicio, unico: 'nombre', mensajeDuplicado: 'Ya existe un servicio con ese nombre.',
  orden: { nombre: 1 }, camposBusqueda: ['nombre'], campoEnCita: 'servicio', colacion: true,
  mensajeNoEliminar: 'No se puede eliminar: el servicio tiene citas registradas. Márquelo como inactivo.',
  // ?activos=1 devuelve solo los servicios que se pueden agendar
  filtroExtra: (req) => (req.query.activos === '1' ? { activo: true } : {}),
  // Mantiene al día el nombre en las citas aún programadas
  alActualizar: (s) => Cita.updateMany({ servicio: s._id, estado: 'Programada' }, { servicioNombre: s.nombre }),
});
