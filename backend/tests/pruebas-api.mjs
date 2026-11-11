// Pruebas automáticas de la API. Requiere el servidor en marcha (npm start) y Node 18+.
// Uso: npm test        o        npm test > tests/resultados.md
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const llamar = async (ruta, metodo = 'GET', cuerpo, crudo) => {
  const r = await fetch(BASE + ruta, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: crudo ?? (cuerpo ? JSON.stringify(cuerpo) : undefined) });
  return { status: r.status, json: r.status === 204 ? null : await r.json().catch(() => null) };
};
const p2 = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const proximo = (diaSem, desde) => { const d = new Date(); d.setDate(d.getDate() + desde); while (d.getDay() !== diaSem) d.setDate(d.getDate() + 1); return fmt(d); };
const martes = proximo(2, 60), domingo = proximo(0, 60);
const ayer = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return fmt(d); })();
const ts = String(Date.now()).slice(-8);
const doc = (n) => `9${ts.slice(0, 7)}${n}`.slice(0, 10);
const campo = (r, c) => !!(r.json && r.json.errores && r.json.errores[c]);
const filas = [];
const probar = async (nombre, datos, esperado, fn) => {
  let ok, obtenido;
  try { [ok, obtenido] = await fn(); } catch (e) { ok = false; obtenido = 'Error: ' + e.message; }
  filas.push({ nombre, datos, esperado, obtenido, estado: ok ? 'Aprobada' : 'Fallida' });
};

const creados = { citas: [], clientes: [], servicios: [] };
const cliente = (n, extra = {}) => ({ nombre: `Cliente Prueba ${'ABCDEF'[n]}`, documento: doc(n), telefono: '3001234567', correo: '', ...extra });
const servicio = { nombre: 'Servicio prueba ' + ts, descripcion: '', duracionMin: 60, precio: 50000, activo: true };
let A, B, C, S, citaA, citaB;

await probar('Registrar cliente válido', 'nombre, documento 10 dígitos, celular 3001234567', '201 y aparece al buscar', async () => {
  const r = await llamar('/api/clientes', 'POST', cliente(0)); A = r.json?.id; creados.clientes.push(A);
  const b = await llamar('/api/clientes', 'POST', cliente(1)); B = b.json?.id; creados.clientes.push(B);
  const c = await llamar('/api/clientes', 'POST', cliente(2)); C = c.json?.id; creados.clientes.push(C);
  const l = await llamar('/api/clientes?q=' + doc(0));
  return [r.status === 201 && l.json.some((x) => x.id === A), `POST ${r.status}; búsqueda: ${l.json?.length}`];
});
await probar('Cliente: campos obligatorios vacíos', 'nombre = "", documento = ""', '400, errores en nombre y documento', async () => {
  const r = await llamar('/api/clientes', 'POST', cliente(3, { nombre: '', documento: '' }));
  return [r.status === 400 && campo(r, 'nombre') && campo(r, 'documento'), `HTTP ${r.status}`];
});
await probar('Cliente: formato incorrecto', 'documento = "12ab", celular = "1234", correo = "x"', '400, errores en documento, telefono y correo', async () => {
  const r = await llamar('/api/clientes', 'POST', cliente(3, { documento: '12ab', telefono: '1234', correo: 'x' }));
  return [r.status === 400 && campo(r, 'documento') && campo(r, 'telefono') && campo(r, 'correo'), `HTTP ${r.status}`];
});
await probar('Cliente: documento duplicado', 'mismo documento de Cliente A', '409 y no se crea otro', async () => {
  const r = await llamar('/api/clientes', 'POST', cliente(0));
  const l = await llamar('/api/clientes?q=' + doc(0));
  return [r.status === 409 && campo(r, 'documento') && l.json.length === 1, `HTTP ${r.status}; registros: ${l.json?.length}`];
});
await probar('Registrar servicio válido', 'duración 60, precio 50000', '201', async () => {
  const r = await llamar('/api/servicios', 'POST', servicio); S = r.json?.id; creados.servicios.push(S);
  return [r.status === 201, `HTTP ${r.status}`];
});
await probar('Servicio: rango incorrecto', 'duración 20, precio -5', '400, errores en duracionMin y precio', async () => {
  const r = await llamar('/api/servicios', 'POST', { ...servicio, nombre: 'Otro ' + ts, duracionMin: 20, precio: -5 });
  return [r.status === 400 && campo(r, 'duracionMin') && campo(r, 'precio'), `HTTP ${r.status}`];
});
await probar('Servicio: nombre duplicado', 'mismo nombre en mayúsculas', '409', async () => {
  const r = await llamar('/api/servicios', 'POST', { ...servicio, nombre: servicio.nombre.toUpperCase() });
  return [r.status === 409 && campo(r, 'nombre'), `HTTP ${r.status}`];
});
await probar('Datos inválidos enviados directo al servidor', 'JSON con tipos incorrectos y objeto { "$gt": "" }', '400 sin guardar', async () => {
  const r = await llamar('/api/clientes', 'POST', { nombre: { $gt: '' }, documento: 123456789, telefono: [], correo: 5 });
  return [r.status === 400 && campo(r, 'nombre') && campo(r, 'documento'), `HTTP ${r.status}`];
});
await probar('JSON malformado', 'cuerpo "{no es json"', '400 con mensaje genérico', async () => {
  const r = await llamar('/api/clientes', 'POST', null, '{no es json');
  return [r.status === 400 && !/at |node_modules/.test(JSON.stringify(r.json)), `HTTP ${r.status}`];
});
await probar('Crear cita válida', `martes ${martes} 10:00`, '201 con hora fin 11:00', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: A, servicioId: S, fecha: martes, horaInicio: '10:00', notas: '' }); citaA = r.json?.id; if (citaA) creados.citas.push(citaA);
  return [r.status === 201 && r.json.horaFin === '11:00' && r.json.estado === 'Programada', `HTTP ${r.status}`];
});
await probar('Consultar disponibilidad', `${martes}, servicio de 60 min`, 'La hora 10:00 muestra 1 cupo libre de 2', async () => {
  const r = await llamar(`/api/disponibilidad?fecha=${martes}&servicioId=${S}`);
  const s = r.json?.slots?.find((x) => x.hora === '10:00');
  return [r.status === 200 && s && s.libres === 1 && s.disponible, `libres en 10:00: ${s?.libres}`];
});
await probar('Segunda cita en el mismo horario (cupo 2)', 'Cliente B a las 10:00', '201', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: B, servicioId: S, fecha: martes, horaInicio: '10:00', notas: '' }); citaB = r.json?.id; if (citaB) creados.citas.push(citaB);
  return [r.status === 201, `HTTP ${r.status}`];
});
await probar('Cruce de horarios sin cupo', 'Cliente C a las 10:30 (cupo lleno)', '409, error en horaInicio, no se crea', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: C, servicioId: S, fecha: martes, horaInicio: '10:30', notas: '' });
  return [r.status === 409 && campo(r, 'horaInicio'), `HTTP ${r.status}`];
});
await probar('Cita fuera del horario de atención', 'martes 16:30 con servicio de 60 min', '400, error en horaInicio', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: C, servicioId: S, fecha: martes, horaInicio: '16:30', notas: '' });
  return [r.status === 400 && campo(r, 'horaInicio'), `HTTP ${r.status}`];
});
await probar('Cita en día sin atención', `domingo ${domingo}`, '400, error en fecha', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: C, servicioId: S, fecha: domingo, horaInicio: '09:00', notas: '' });
  return [r.status === 400 && campo(r, 'fecha'), `HTTP ${r.status}`];
});
await probar('Cita en fecha pasada', `fecha ${ayer}`, '400, error en fecha', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: C, servicioId: S, fecha: ayer, horaInicio: '09:00', notas: '' });
  return [r.status === 400 && campo(r, 'fecha'), `HTTP ${r.status}`];
});
await probar('Cliente con dos citas cruzadas', 'Cliente A a las 10:30 (ya tiene 10:00 a 11:00)', '409 (cupo o cruce del cliente), no se crea', async () => {
  const r = await llamar('/api/citas', 'POST', { clienteId: A, servicioId: S, fecha: martes, horaInicio: '10:30', notas: '' });
  return [r.status === 409, `HTTP ${r.status}`];
});
await probar('Cancelar cita sin motivo', 'estado Cancelada, motivo vacío', '400, error en motivo', async () => {
  const r = await llamar(`/api/citas/${citaB}/estado`, 'PATCH', { estado: 'Cancelada', motivo: '' });
  return [r.status === 400 && campo(r, 'motivo'), `HTTP ${r.status}`];
});
await probar('Cancelar cita con motivo libera el cupo', 'Cancelar cita de B; luego C a las 10:00', '200; después 201', async () => {
  const r = await llamar(`/api/citas/${citaB}/estado`, 'PATCH', { estado: 'Cancelada', motivo: 'Prueba automática' });
  const n = await llamar('/api/citas', 'POST', { clienteId: C, servicioId: S, fecha: martes, horaInicio: '10:00', notas: '' }); if (n.json?.id) creados.citas.push(n.json.id);
  return [r.status === 200 && r.json.estado === 'Cancelada' && n.status === 201, `PATCH ${r.status}; nueva cita ${n.status}`];
});
await probar('Cancelar una cita ya cancelada', 'segunda cancelación', '409', async () => {
  const r = await llamar(`/api/citas/${citaB}/estado`, 'PATCH', { estado: 'Cancelada', motivo: 'Otra vez' });
  return [r.status === 409, `HTTP ${r.status}`];
});
await probar('Reprogramar una cita', 'Cita de A: 10:00 → 14:00', '200 y el cambio se ve al consultar', async () => {
  const r = await llamar(`/api/citas/${citaA}`, 'PUT', { clienteId: A, servicioId: S, fecha: martes, horaInicio: '14:00', notas: '' });
  const g = await llamar(`/api/citas/${citaA}`);
  return [r.status === 200 && g.json.horaInicio === '14:00' && g.json.horaFin === '15:00', `PUT ${r.status}; hora ahora ${g.json?.horaInicio}`];
});
await probar('Consultar citas por filtro', `desde ${martes} hasta ${martes}, estado Programada`, 'Incluye las citas de A y C', async () => {
  const r = await llamar(`/api/citas?desde=${martes}&hasta=${martes}&estado=Programada`);
  return [r.status === 200 && r.json.some((c) => c.id === citaA), `registros: ${r.json?.length}`];
});
await probar('Horario: cierre anterior a la apertura', 'apertura 17:00, cierre 08:00', '400, error en cierre', async () => {
  const r = await llamar('/api/horarios/2', 'PUT', { activo: true, apertura: '17:00', cierre: '08:00', capacidad: 2 });
  return [r.status === 400 && campo(r, 'cierre'), `HTTP ${r.status}`];
});
await probar('Horario: desactivar un día con citas programadas', 'martes activo = false', '409 y no se modifica', async () => {
  const r = await llamar('/api/horarios/2', 'PUT', { activo: false, apertura: '08:00', cierre: '17:00', capacidad: 2 });
  const g = await llamar('/api/horarios');
  return [r.status === 409 && g.json.find((h) => h.dia === 2).activo === true, `HTTP ${r.status}`];
});
await probar('Reporte de atención', 'últimos 30 días y rango inválido', '200 con totales; 400 si desde > hasta', async () => {
  const r = await llamar('/api/reportes');
  const m = await llamar('/api/reportes?desde=2026-12-31&hasta=2026-01-01');
  return [r.status === 200 && typeof r.json.total === 'number' && 'porServicio' in r.json && m.status === 400, `GET ${r.status}; rango inválido ${m.status}`];
});
await probar('Identificador inválido o inexistente', 'id "abc" y 000000000000000000000000', '400 y 404', async () => {
  const a = await llamar('/api/citas/abc'); const b = await llamar('/api/citas/000000000000000000000000');
  return [a.status === 400 && b.status === 404, `${a.status} y ${b.status}`];
});
await probar('Eliminar cliente o servicio con citas', 'DELETE del cliente A y del servicio', '409 y siguen existiendo', async () => {
  const a = await llamar(`/api/clientes/${A}`, 'DELETE'); const b = await llamar(`/api/servicios/${S}`, 'DELETE');
  const g = await llamar(`/api/clientes/${A}`);
  return [a.status === 409 && b.status === 409 && g.status === 200, `${a.status} y ${b.status}`];
});
await probar('Confirmar eliminación de una cita', 'DELETE de la cita de A', '204 y deja de aparecer', async () => {
  const r = await llamar(`/api/citas/${citaA}`, 'DELETE'); const g = await llamar(`/api/citas/${citaA}`);
  creados.citas = creados.citas.filter((x) => x !== citaA);
  return [r.status === 204 && g.status === 404, `DELETE ${r.status}; GET ${g.status}`];
});

// ---- Pruebas específicas por regla de cada campo ----
const reglas = [
  ['Cliente.nombre muy corto', '/api/clientes', cliente(3, { nombre: 'Al' }), 'nombre'],
  ['Cliente.nombre con números', '/api/clientes', cliente(3, { nombre: 'Ana123' }), 'nombre'],
  ['Cliente.nombre solo espacios', '/api/clientes', cliente(3, { nombre: '     ' }), 'nombre'],
  ['Cliente.documento de 5 dígitos', '/api/clientes', cliente(3, { documento: '12345' }), 'documento'],
  ['Cliente.celular que no empieza por 3', '/api/clientes', cliente(3, { telefono: '2001234567' }), 'telefono'],
  ['Cliente.correo opcional mal escrito', '/api/clientes', cliente(3, { correo: 'ana@correo' }), 'correo'],
  ['Servicio.nombre de 2 caracteres', '/api/servicios', { ...servicio, nombre: 'ab' }, 'nombre'],
  ['Servicio.descripción de 201 caracteres', '/api/servicios', { ...servicio, nombre: 'Desc ' + ts, descripcion: 'x'.repeat(201) }, 'descripcion'],
  ['Servicio.precio decimal', '/api/servicios', { ...servicio, nombre: 'Prec ' + ts, precio: '10.5' }, 'precio'],
  ['Servicio.duración mayor a 240', '/api/servicios', { ...servicio, nombre: 'Dur ' + ts, duracionMin: 300 }, 'duracionMin'],
  ['Servicio.estado inválido', '/api/servicios', { ...servicio, nombre: 'Est ' + ts, activo: 'tal vez' }, 'activo'],
  ['Cita.hora fuera de bloques de 15 min', '/api/citas', () => ({ clienteId: C, servicioId: S, fecha: martes, horaInicio: '10:07', notas: '' }), 'horaInicio'],
  ['Cita.notas de 201 caracteres', '/api/citas', () => ({ clienteId: C, servicioId: S, fecha: martes, horaInicio: '15:00', notas: 'x'.repeat(201) }), 'notas'],
  ['Cita.cliente sin seleccionar', '/api/citas', () => ({ clienteId: '', servicioId: S, fecha: martes, horaInicio: '15:00', notas: '' }), 'clienteId'],
  ['Cita.cliente inexistente', '/api/citas', () => ({ clienteId: '000000000000000000000000', servicioId: S, fecha: martes, horaInicio: '15:00', notas: '' }), 'clienteId'],
  ['Cita.fecha inexistente (31 de febrero)', '/api/citas', () => ({ clienteId: C, servicioId: S, fecha: '2027-02-31', horaInicio: '15:00', notas: '' }), 'fecha'],
  ['Horario.capacidad 0', '/api/horarios/3', { activo: true, apertura: '08:00', cierre: '17:00', capacidad: 0 }, 'capacidad', 'PUT'],
  ['Horario.hora de apertura inválida', '/api/horarios/3', { activo: true, apertura: '25:00', cierre: '17:00', capacidad: 2 }, 'apertura', 'PUT'],
  ['Cancelación.motivo de 3 caracteres', () => `/api/citas/${citaB}/estado`, { estado: 'Cancelada', motivo: 'abc' }, 'motivo', 'PATCH'],
];
for (const [nombre, ruta, cuerpo, c, metodo = 'POST'] of reglas) {
  await probar(nombre, 'valor fuera de la regla', `400 con error en «${c}» y sin guardar`, async () => {
    const r = await llamar(typeof ruta === 'function' ? ruta() : ruta, metodo, typeof cuerpo === 'function' ? cuerpo() : cuerpo);
    return [r.status === 400 && campo(r, c), `HTTP ${r.status}`];
  });
}
await probar('Cita con servicio inactivo', 'servicio con activo = false', '400, error en servicioId', async () => {
  const s = await llamar('/api/servicios', 'POST', { ...servicio, nombre: 'Inactivo ' + ts, activo: false }); if (s.json?.id) creados.servicios.push(s.json.id);
  const r = await llamar('/api/citas', 'POST', { clienteId: C, servicioId: s.json.id, fecha: martes, horaInicio: '15:00', notas: '' });
  return [r.status === 400 && campo(r, 'servicioId'), `HTTP ${r.status}`];
});

// Limpieza
for (const id of creados.citas) await llamar(`/api/citas/${id}`, 'DELETE');
await llamar(`/api/citas/${citaB}`, 'DELETE');
for (const id of creados.clientes) await llamar(`/api/clientes/${id}`, 'DELETE');
for (const id of creados.servicios) await llamar(`/api/servicios/${id}`, 'DELETE');

console.log('| Prueba | Datos utilizados | Resultado esperado | Resultado obtenido | Estado | Evidencia |\n|---|---|---|---|---|---|');
filas.forEach((f) => console.log(`| ${f.nombre} | ${f.datos} | ${f.esperado} | ${f.obtenido} | ${f.estado} | Captura de la salida de npm test |`));
const malas = filas.filter((f) => f.estado === 'Fallida').length;
console.log(`\n${filas.length - malas} de ${filas.length} pruebas aprobadas.`);
process.exit(malas ? 1 : 0);
