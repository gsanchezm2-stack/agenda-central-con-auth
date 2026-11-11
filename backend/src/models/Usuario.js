// Colección "usuarios": personal del centro que puede entrar a administrar la agenda
import mongoose from 'mongoose';
const esquema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 40, match: /^[a-z0-9._-]+$/ },
  claveHash: { type: String, required: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model('Usuario', esquema);
