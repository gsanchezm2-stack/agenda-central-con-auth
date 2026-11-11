// Conexión con MongoDB (Atlas). Si falla, reintenta cada 5 segundos sin tumbar el servidor
import mongoose from 'mongoose';
import Cliente from '../models/Cliente.js';
import Servicio from '../models/Servicio.js';
import Cita from '../models/Cita.js';
import Horario, { asegurarHorarios } from '../models/Horario.js';
export async function conectarSimple() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  // Crea los índices únicos y los horarios por defecto si aún no existen
  await Promise.all([Cliente.init(), Servicio.init(), Horario.init(), Cita.init()]);
  await asegurarHorarios();
}
export async function conectar() {
  if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI. Copie .env.example como .env y configúrelo.'); process.exit(1); }
  try {
    await conectarSimple();
    console.log(`Conectado a MongoDB (servidor ${mongoose.connection.host}, base ${mongoose.connection.name}).`);
  } catch (e) {
    // No se imprime el error completo para no exponer la cadena de conexión
    console.error('No se pudo conectar a MongoDB. Revise MONGODB_URI, el usuario y el acceso de red en Atlas. Reintentando en 5 s…');
    setTimeout(conectar, 5000);
  }
}
