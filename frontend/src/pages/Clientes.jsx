import CrudEntidad from '../components/CrudEntidad.jsx';
import { validarCliente } from '@shared/validaciones.js';
// Configuración de la pantalla: campos del formulario y columnas de la tabla
const CFG = {
  clave: 'cli', api: '/api/clientes', singular: 'cliente', plural: 'clientes', titulo: 'Clientes', buscarEn: 'nombre o documento',
  validar: validarCliente, nombre: (x) => `al cliente ${x.nombre}`,
  campos: [
    { n: 'nombre', et: 'Nombre completo' },
    { n: 'documento', et: 'Documento', hint: 'Solo números, de 6 a 12 dígitos. No puede repetirse.', attrs: { inputMode: 'numeric', maxLength: 12 } },
    { n: 'telefono', et: 'Celular', tipo: 'tel', hint: '10 dígitos, empieza por 3.', attrs: { maxLength: 12 } },
    { n: 'correo', et: 'Correo', tipo: 'email', opc: true },
  ],
  columnas: [['Documento', (x) => x.documento], ['Nombre', (x) => x.nombre], ['Celular', (x) => x.telefono], ['Correo', (x) => x.correo || 'Sin dato']],
};
export default function Clientes() { return <CrudEntidad cfg={CFG} />; }
