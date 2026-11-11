// Exige un token válido (encabezado "Authorization: Bearer <token>") para entrar a las rutas protegidas
import jwt from 'jsonwebtoken';
export default function autenticacion(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ mensaje: 'Debe iniciar sesión para continuar.' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ mensaje: 'La sesión no es válida o ya expiró. Inicie sesión de nuevo.' });
  }
}
