// Colección "servicios": lo que ofrece el centro (la duración define cuánto ocupa una cita)
import mongoose from 'mongoose';
// Comparación sin distinguir mayúsculas ni tildes para el nombre único
export const COLACION = { locale: 'es', strength: 2 };
const esquema = new mongoose.Schema({
  nombre: { type: String, required: true, minlength: 3, maxlength: 80 },
  descripcion: { type: String, default: '', maxlength: 200 },
  duracionMin: { type: Number, required: true, min: 15, max: 240, validate: (n) => Number.isInteger(n) && n % 15 === 0 },
  precio: { type: Number, required: true, min: 0, max: 5000000, validate: Number.isInteger },
  activo: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
esquema.index({ nombre: 1 }, { unique: true, collation: COLACION });
export default mongoose.model('Servicio', esquema);
