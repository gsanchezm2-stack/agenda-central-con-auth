// Colección "clientes": personas que solicitan citas
import mongoose from 'mongoose';
const esquema = new mongoose.Schema({
  nombre: { type: String, required: true, minlength: 3, maxlength: 100 },
  documento: { type: String, required: true, unique: true, match: /^\d{6,12}$/ },
  telefono: { type: String, required: true, match: /^3\d{9}$/ },
  correo: { type: String, default: '', maxlength: 120 },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Cliente', esquema);
