import Cliente from '../models/Cliente.js';
import { validarCliente } from '../../../shared/validaciones.js';
import { crearCrud } from './crudFactory.js';
export default crearCrud({
  Modelo: Cliente, validar: validarCliente, unico: 'documento', mensajeDuplicado: 'Ya existe un cliente con ese documento.',
  orden: { nombre: 1 }, camposBusqueda: ['nombre', 'documento'], campoEnCita: 'cliente',
  mensajeNoEliminar: 'No se puede eliminar: el cliente tiene citas registradas.',
});
