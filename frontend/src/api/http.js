// Cliente HTTP: siempre devuelve { ok, status, cuerpo } y nunca lanza excepciones
import { obtenerToken, borrarToken } from './sesion.js';
export async function api(url, opciones = {}) {
  try {
    const token = obtenerToken();
    const encabezados = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const r = await fetch(url, { headers: encabezados, ...opciones });
    // Sesión vencida o inválida: se borra el token y se recarga para mostrar el login
    if (r.status === 401 && token) { borrarToken(); location.reload(); }
    return { ok: r.ok, status: r.status, cuerpo: r.status === 204 ? null : await r.json().catch(() => null) };
  } catch {
    return { ok: false, status: 0, cuerpo: { mensaje: 'No se pudo comunicar con el servidor. Revise su conexión.' } };
  }
}
export const enviar = (url, metodo, datos) => api(url, { method: metodo, body: JSON.stringify(datos) });
