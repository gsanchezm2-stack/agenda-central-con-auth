export const rutaNoEncontrada = (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' });
// Manejador final: el detalle técnico solo se registra en la consola del servidor
export const manejarErrores = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El cuerpo de la solicitud no es JSON válido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La solicitud es demasiado grande.' });
  if (err && err.code === 11000) return res.status(409).json({ mensaje: 'Ya existe un registro con ese valor único.' });
  console.error('Error interno:', err.name, err.message);
  res.status(500).json({ mensaje: 'Ocurrió un error inesperado. Intente de nuevo.' });
};
