// Maneja el token de sesión guardado en el navegador (localStorage)
const CLAVE = 'agenda-central-token';
export const guardarToken = (token) => localStorage.setItem(CLAVE, token);
export const borrarToken = () => localStorage.removeItem(CLAVE);
export const obtenerToken = () => localStorage.getItem(CLAVE);
export const haySesion = () => Boolean(obtenerToken());
