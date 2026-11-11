// Colección "citas": referencia al cliente y al servicio, con copia de los datos del servicio
import mongoose from 'mongoose';
const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
const esquema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
  // Copia del servicio al momento de agendar: el historial no cambia si luego se edita el servicio
  servicioNombre: { type: String, required: true },
  duracionMin: { type: Number, required: true },
  precio: { type: Number, required: true },
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true, match: hora },
  horaFin: { type: String, required: true, match: hora },
  estado: { type: String, enum: ['Programada', 'Atendida', 'Cancelada'], default: 'Programada' },
  notas: { type: String, default: '', maxlength: 200 },
  motivoCancelacion: { type: String, default: '', maxlength: 200 },
}, { timestamps: true, versionKey: false });
// Acelera la consulta de la agenda de un día
esquema.index({ fecha: 1, horaInicio: 1 });
export default mongoose.model('Cita', esquema);
