// Reglas de validación compartidas: las usan el servidor (backend) y el navegador (frontend)
// Cada función devuelve { errores, datos }; si errores está vacío, datos es el registro limpio
const T = (v) => (typeof v === 'string' ? v.trim() : '');
const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const p2 = (n) => String(n).padStart(2, '0');
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[a-f0-9]{24}$/i;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const fechaReal = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
};
const sumarDias = (f, n) => { const [y, m, d] = f.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d + n)); return `${x.getUTCFullYear()}-${p2(x.getUTCMonth() + 1)}-${p2(x.getUTCDate())}`; };
const diaSemana = (f) => { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const aMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const deMin = (m) => `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;
// Entero desde número o texto numérico; devuelve null si no es válido o está fuera de rango.
const entero = (v, min, max) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};
const bool = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null);
const sal = (e, d) => ({ errores: e, datos: d });

function validarCliente(x) {
  x = x && typeof x === 'object' ? x : {}; const e = {}; const d = {};
  const nom = T(x.nombre);
  if (nom.length < 3 || nom.length > 100 || !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(nom)) e.nombre = 'Ingrese un nombre de 3 a 100 caracteres, solo letras y espacios.';
  else d.nombre = nom;
  const doc = T(x.documento);
  if (!/^\d{6,12}$/.test(doc)) e.documento = 'Ingrese el documento solo con números, de 6 a 12 dígitos.';
  else d.documento = doc;
  const tel = T(x.telefono).replace(/\s/g, '');
  if (!/^3\d{9}$/.test(tel)) e.telefono = 'Ingrese un celular de 10 dígitos que empiece por 3.';
  else d.telefono = tel;
  if (vacio(x.correo)) d.correo = '';
  else if (T(x.correo).length > 120 || !CORREO.test(T(x.correo))) e.correo = 'Ingrese un correo válido, por ejemplo nombre@dominio.com.';
  else d.correo = T(x.correo).toLowerCase();
  return sal(e, d);
}

function validarServicio(x) {
  x = x && typeof x === 'object' ? x : {}; const e = {}; const d = {};
  const nom = T(x.nombre);
  if (nom.length < 3 || nom.length > 80) e.nombre = 'Ingrese un nombre de 3 a 80 caracteres.';
  else d.nombre = nom;
  if (vacio(x.descripcion)) d.descripcion = '';
  else if (T(x.descripcion).length > 200) e.descripcion = 'La descripción no puede superar 200 caracteres.';
  else d.descripcion = T(x.descripcion);
  const dur = entero(x.duracionMin, 15, 240);
  if (dur === null || dur % 15 !== 0) e.duracionMin = 'Ingrese una duración entre 15 y 240 minutos, en múltiplos de 15.';
  else d.duracionMin = dur;
  const pr = entero(x.precio, 0, 5000000);
  if (pr === null) e.precio = 'Ingrese un precio entero entre 0 y 5.000.000 (pesos).';
  else d.precio = pr;
  const a = bool(x.activo === undefined ? true : x.activo);
  if (a === null) e.activo = 'Seleccione si el servicio está activo.';
  else d.activo = a;
  return sal(e, d);
}

function validarHorario(x) {
  x = x && typeof x === 'object' ? x : {}; const e = {}; const d = {};
  const a = bool(x.activo);
  if (a === null) e.activo = 'Indique si el centro atiende ese día.'; else d.activo = a;
  const ap = T(x.apertura), ci = T(x.cierre);
  if (!HORA.test(ap)) e.apertura = 'Ingrese una hora de apertura válida (HH:MM).'; else d.apertura = ap;
  if (!HORA.test(ci)) e.cierre = 'Ingrese una hora de cierre válida (HH:MM).'; else d.cierre = ci;
  if (d.apertura && d.cierre && aMin(d.cierre) - aMin(d.apertura) < 60) e.cierre = 'El cierre debe ser al menos 1 hora después de la apertura.';
  const cap = entero(x.capacidad, 1, 10);
  if (cap === null) e.capacidad = 'Ingrese los cupos simultáneos (entre 1 y 10).'; else d.capacidad = cap;
  return sal(e, d);
}

// Validación de forma de la cita. Las reglas de agenda (horario, cupo, cruces) se comprueban en el servidor.
function validarCita(x) {
  x = x && typeof x === 'object' ? x : {}; const e = {}; const d = {};
  if (!ID.test(T(x.clienteId))) e.clienteId = 'Seleccione un cliente.'; else d.clienteId = T(x.clienteId);
  if (!ID.test(T(x.servicioId))) e.servicioId = 'Seleccione un servicio.'; else d.servicioId = T(x.servicioId);
  const f = T(x.fecha);
  if (!fechaReal(f)) e.fecha = 'Ingrese una fecha válida.';
  else if (f < hoyLocal()) e.fecha = 'No se puede agendar en una fecha pasada.';
  else if (f > sumarDias(hoyLocal(), 180)) e.fecha = 'Solo se agenda hasta 180 días hacia adelante.';
  else d.fecha = f;
  const h = T(x.horaInicio);
  if (!HORA.test(h) || aMin(h) % 15 !== 0) e.horaInicio = 'Seleccione una hora disponible (bloques de 15 minutos).'; else d.horaInicio = h;
  if (vacio(x.notas)) d.notas = '';
  else if (typeof x.notas !== 'string' || T(x.notas).length > 200) e.notas = 'Las notas no pueden superar 200 caracteres.';
  else d.notas = T(x.notas);
  return sal(e, d);
}

function validarEstado(x) {
  x = x && typeof x === 'object' ? x : {}; const e = {}; const d = {};
  if (x.estado !== 'Cancelada' && x.estado !== 'Atendida') e.estado = 'El estado debe ser Cancelada o Atendida.'; else d.estado = x.estado;
  if (x.estado === 'Cancelada') {
    const m = T(x.motivo);
    if (m.length < 5 || m.length > 200) e.motivo = 'Escriba el motivo de la cancelación (5 a 200 caracteres).'; else d.motivo = m;
  } else d.motivo = '';
  return sal(e, d);
}

export { T, HORA, ID, hoyLocal, ahoraMin, fechaReal, sumarDias, diaSemana, aMin, deMin, validarCliente, validarServicio, validarHorario, validarCita, validarEstado };
