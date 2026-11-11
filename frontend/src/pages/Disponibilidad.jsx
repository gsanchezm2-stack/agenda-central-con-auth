// Consulta de horas libres para un servicio y una fecha
import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { hoyLocal, sumarDias } from '@shared/validaciones.js';
import { fmtFecha } from '../utils/formato.js';
export default function Disponibilidad({ alElegir }) {
  const hoy = hoyLocal();
  const [servicios, setServicios] = useState([]);
  const [fecha, setFecha] = useState(hoy);
  const [sid, setSid] = useState('');
  const [d, setD] = useState(null);
  const [fallo, setFallo] = useState('');
  useEffect(() => {
    api('/api/servicios?activos=1').then((r) => {
      if (r.ok) { setServicios(r.cuerpo); setSid(r.cuerpo[0]?.id || ''); } else setFallo(r.cuerpo?.mensaje || 'No se pudieron cargar los servicios.');
    });
  }, []);
  useEffect(() => {
    if (!sid || !fecha) return;
    let vivo = true;
    api('/api/disponibilidad?' + new URLSearchParams({ fecha, servicioId: sid })).then((r) => {
      if (!vivo) return;
      if (r.ok) { setD(r.cuerpo); setFallo(''); } else { setD(null); setFallo(r.cuerpo?.errores?.fecha || r.cuerpo?.mensaje || 'No se pudo consultar.'); }
    });
    return () => { vivo = false; };
  }, [fecha, sid]);
  return (
    <section className="tarjeta">
      <h2>Disponibilidad</h2>
      <div className="controles">
        <div className="campo"><label htmlFor="d-fecha">Fecha</label><input id="d-fecha" type="date" value={fecha} min={hoy} max={sumarDias(hoy, 180)} onChange={(e) => setFecha(e.target.value)} /></div>
        <div className="campo"><label htmlFor="d-serv">Servicio</label>
          <select id="d-serv" value={sid} onChange={(e) => setSid(e.target.value)}>
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({s.duracionMin} min)</option>)}
          </select></div>
      </div>
      <p className="hint">Elija una hora libre para pasar al formulario de la cita con los datos cargados.</p>
      {!servicios.length && !fallo && <p className="vacio">Registre un servicio activo para consultar la disponibilidad.</p>}
      {fallo && <p className="error" role="alert">{fallo}</p>}
      {d && !d.abierto && <p className="vacio">{d.mensaje}</p>}
      {d && d.abierto && (
        <div aria-live="polite">
          <p>{fmtFecha(d.fecha)}: atención de {d.apertura} a {d.cierre}, hasta {d.capacidad} {d.capacidad === 1 ? 'cita' : 'citas'} al mismo tiempo.</p>
          <div className="slots">
            {d.slots.map((s) => (
              <button key={s.hora} type="button" className="slot" disabled={!s.disponible} title={s.disponible ? 'Agendar a esta hora' : 'Sin cupo'}
                onClick={() => alElegir({ fecha: d.fecha, servicioId: sid, hora: s.hora })}>
                {s.hora}<small>{s.disponible ? `${s.libres} libre${s.libres === 1 ? '' : 's'}` : 'Sin cupo'}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
