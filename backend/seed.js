// Base de datos de prueba: servicios, clientes y citas de ejemplo (sin datos personales reales)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { conectarSimple } from './src/config/db.js';
import Cliente from './src/models/Cliente.js';
import Servicio from './src/models/Servicio.js';
import Horario from './src/models/Horario.js';
import Cita from './src/models/Cita.js';
import Usuario from './src/models/Usuario.js';
import { hoyLocal, sumarDias, diaSemana, aMin, deMin } from '../shared/validaciones.js';
try {
  await conectarSimple();
  // El usuario administrador NO se borra en cada siembra: solo se crea si todavía no existe ninguno
  if ((await Usuario.countDocuments()) === 0) {
    const usuario = (process.env.ADMIN_USUARIO || 'admin').toLowerCase();
    const clave = process.env.ADMIN_CLAVE || 'CambieEstaClave123';
    await Usuario.create({ usuario, claveHash: await bcrypt.hash(clave, 10) });
    console.log(`Usuario administrador creado: ${usuario} (clave definida en ADMIN_CLAVE del .env)`);
  }
  await Promise.all([Cita.deleteMany({}), Cliente.deleteMany({}), Servicio.deleteMany({})]);
  const servicios = await Servicio.insertMany([
    { nombre: 'Revisión general', descripcion: 'Diagnóstico inicial del equipo', duracionMin: 30, precio: 40000, activo: true },
    { nombre: 'Mantenimiento preventivo', descripcion: 'Limpieza y ajuste', duracionMin: 60, precio: 90000, activo: true },
    { nombre: 'Instalación de equipo', descripcion: '', duracionMin: 90, precio: 150000, activo: true },
    { nombre: 'Asesoría técnica', descripcion: 'Orientación para elegir equipos', duracionMin: 45, precio: 60000, activo: true },
    { nombre: 'Entrega de equipo', descripcion: '', duracionMin: 15, precio: 0, activo: false },
  ]);
  const nombres = ['Camila Torres', 'Andrés Pérez', 'Laura Gómez', 'Julián Rojas', 'María Fernanda Díaz', 'Santiago Herrera'];
  const clientes = await Cliente.insertMany(nombres.map((nombre, i) => ({ nombre, documento: String(10000001 + i), telefono: `300000000${i}`, correo: `cliente${i + 1}@example.org` })));
  const horarios = Object.fromEntries((await Horario.find().lean()).map((h) => [h.dia, h]));
  const hoy = hoyLocal(), citas = [];
  // Agrega una cita solo si cabe en el horario del día
  const crear = (fecha, hora, i, estado, motivo = '') => {
    const s = servicios[i % 4], c = clientes[i % clientes.length], h = horarios[diaSemana(fecha)], fin = aMin(hora) + s.duracionMin;
    if (!h.activo || fin > aMin(h.cierre)) return;
    citas.push({ cliente: c._id, servicio: s._id, servicioNombre: s.nombre, duracionMin: s.duracionMin, precio: s.precio, fecha, horaInicio: hora, horaFin: deMin(fin), estado, motivoCancelacion: motivo, notas: '' });
  };
  let n = 0;
  // Dos semanas atrás (atendidas y algunas canceladas) y una semana adelante (programadas)
  for (let d = -14; d <= 7; d++) {
    const fecha = sumarDias(hoy, d), pasado = d < 0, estado = (k) => (pasado ? (k % 5 === 0 ? 'Cancelada' : 'Atendida') : 'Programada');
    crear(fecha, '09:00', n, estado(n), pasado && n % 5 === 0 ? 'El cliente no pudo asistir' : ''); n++;
    crear(fecha, '11:00', n, estado(n), pasado && n % 5 === 0 ? 'Reprogramada por el cliente' : ''); n++;
    // Segundo cupo a las 09:00 solo en días con capacidad 2
    if (d >= 0 && horarios[diaSemana(fecha)].capacidad >= 2) { crear(fecha, '09:00', n + 3, 'Programada'); n++; }
  }
  await Cita.insertMany(citas);
  console.log(`Base de datos de prueba creada: ${servicios.length} servicios, ${clientes.length} clientes, ${citas.length} citas.`);
} catch (e) { console.error('No se pudo sembrar la base de datos:', e.message); process.exitCode = 1; }
await mongoose.disconnect();
