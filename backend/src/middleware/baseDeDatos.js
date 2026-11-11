import mongoose from 'mongoose';
// Si MongoDB no responde, la API contesta 503 con un mensaje genérico
export default (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ mensaje: 'No se pudo conectar con la base de datos. Intente de nuevo en unos minutos.' });
  next();
};
