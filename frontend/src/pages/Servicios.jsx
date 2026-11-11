import CrudEntidad from '../components/CrudEntidad.jsx';
import { validarServicio } from '@shared/validaciones.js';
import { cop } from '../utils/formato.js';
const CFG = {
  clave: 'ser', api: '/api/servicios', singular: 'servicio', plural: 'servicios', titulo: 'Servicios', buscarEn: 'nombre',
  validar: validarServicio, nombre: (x) => `el servicio ${x.nombre}`,
  campos: [
    { n: 'nombre', et: 'Nombre del servicio' },
    { n: 'descripcion', et: 'Descripción', tipo: 'textarea', opc: true, attrs: { maxLength: 200 } },
    { n: 'duracionMin', et: 'Duración (minutos)', tipo: 'number', hint: 'De 15 a 240, en múltiplos de 15.', attrs: { min: 15, max: 240, step: 15 } },
    { n: 'precio', et: 'Precio (pesos)', tipo: 'number', attrs: { min: 0, max: 5000000, step: 1 } },
    { n: 'activo', et: 'Estado', tipo: 'select', opciones: [['true', 'Activo'], ['false', 'Inactivo']], hint: 'Un servicio inactivo no se puede agendar.' },
  ],
  columnas: [
    ['Servicio', (x) => <span>{x.nombre}<span className="sub">{x.descripcion}</span></span>],
    ['Duración', (x) => `${x.duracionMin} min`],
    ['Precio', (x) => cop(x.precio)],
    ['Estado', (x) => <span className={`chip ${x.activo ? 'activo' : 'inactivo'}`}>{x.activo ? 'Activo' : 'Inactivo'}</span>],
  ],
};
export default function Servicios() { return <CrudEntidad cfg={CFG} />; }
