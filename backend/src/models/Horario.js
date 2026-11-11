// Colección "horarios": un documento por día de la semana (0 = domingo)
import mongoose from 'mongoose';
const esquema = new mongoose.Schema({
  dia: { type: Number, required: true, unique: true, min: 0, max: 6 },
  activo: { type: Boolean, required: true },
  apertura: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  cierre: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  // Cuántas citas pueden estar en curso al mismo tiempo
  capacidad: { type: Number, required: true, min: 1, max: 10 },
}, { timestamps: true, versionKey: false });
const Horario = mongoose.model('Horario', esquema);
// Por defecto: lunes a viernes 08:00-17:00 (2 cupos), sábado 08:00-12:00 (1 cupo), domingo cerrado
const BASE = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, activo: dia !== 0, apertura: '08:00', cierre: dia === 0 || dia === 6 ? '12:00' : '17:00', capacidad: dia === 0 || dia === 6 ? 1 : 2 }));
// Crea solo los días que faltan, sin tocar los que ya existen
export async function asegurarHorarios() {
  for (const h of BASE) await Horario.updateOne({ dia: h.dia }, { $setOnInsert: h }, { upsert: true });
}
export default Horario;
