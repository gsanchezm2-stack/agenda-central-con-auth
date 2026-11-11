// Funciones de formato y utilidades de interfaz
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const cop = (n) => '$ ' + Number(n).toLocaleString('es-CO');
export const fmtFecha = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtCorta = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
// Lleva el foco al primer campo con error (campos: lista de nombres)
export function enfocarPrimero(prefijo, campos, errores) {
  const primero = campos.find((c) => errores[c]);
  if (primero) document.getElementById(`${prefijo}-${primero}`)?.focus();
}
// Descarga un CSV con BOM para que Excel respete las tildes
export function descargarCsv(filas, nombre) {
  // Un apóstrofo evita que Excel interprete una celda como fórmula
  const celda = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const blob = new Blob(['\ufeff' + filas.map((f) => f.map(celda).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre; a.click(); URL.revokeObjectURL(a.href);
}
