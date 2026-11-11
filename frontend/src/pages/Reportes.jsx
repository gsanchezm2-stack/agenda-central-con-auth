// Reporte de atención por rango de fechas, con descarga en CSV
import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { hoyLocal, sumarDias } from '@shared/validaciones.js';
import { cop, fmtCorta, descargarCsv } from '../utils/formato.js';
import { useAviso } from '../components/Aviso.jsx';
const Cifra = ({ n, t }) => <div className="cifra"><b>{n}</b><span>{t}</span></div>;
export default function Reportes() {
  const hoy = hoyLocal();
  const { avisar } = useAviso();
  const [desde, setDesde] = useState(sumarDias(hoy, -30));
  const [hasta, setHasta] = useState(hoy);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const generar = async () => {
    const r = await api('/api/reportes?' + new URLSearchParams({ desde, hasta }));
    if (!r.ok) { setD(null); setError(r.cuerpo?.errores ? Object.values(r.cuerpo.errores).join(' ') : r.cuerpo?.mensaje); return; }
    setError(''); setD(r.cuerpo);
  };
  useEffect(() => { generar(); }, []);
  const exportar = async () => {
    const r = await api('/api/citas?' + new URLSearchParams({ desde, hasta }));
    if (!r.ok) { avisar(r.cuerpo?.mensaje || 'No se pudo exportar.', true); return; }
    descargarCsv([
      ['Fecha', 'Hora inicio', 'Hora fin', 'Cliente', 'Documento', 'Servicio', 'Estado', 'Precio', 'Notas', 'Motivo de cancelación'],
      ...r.cuerpo.map((c) => [c.fecha, c.horaInicio, c.horaFin, c.cliente?.nombre, c.cliente?.documento, c.servicioNombre, c.estado, c.precio, c.notas, c.motivoCancelacion]),
    ], `reporte-citas-${desde}-a-${hasta}.csv`);
  };
  const max = d ? Math.max(1, ...d.porDia.map((x) => x.total)) : 1;
  return (
    <section className="tarjeta">
      <h2>Reporte de atención</h2>
      <div className="controles">
        <div className="campo"><label htmlFor="r-desde">Desde</label><input id="r-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
        <div className="campo"><label htmlFor="r-hasta">Hasta</label><input id="r-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        <button type="button" className="btn primario" onClick={generar}>Generar reporte</button>
        <button type="button" className="btn" onClick={exportar}>Descargar CSV</button>
      </div>
      <small className="error" role="alert">{error}</small>
      {d && (
        <div aria-live="polite">
          <div className="cifras">
            <Cifra n={d.total} t="Citas en el período" /><Cifra n={d.porEstado.Atendida} t="Atendidas" /><Cifra n={d.porEstado.Cancelada} t="Canceladas" />
            <Cifra n={d.porEstado.Programada} t="Programadas" /><Cifra n={`${d.tasaCancelacion} %`} t="Tasa de cancelación" /><Cifra n={cop(d.ingresos)} t="Ingresos por atenciones" />
          </div>
          {d.total === 0 ? <p className="vacio">No hay citas en ese período.</p> : (
            <div className="dos">
              <div>
                <h3>Por servicio</h3>
                <div className="envoltura"><table>
                  <thead><tr><th>Servicio</th><th>Citas</th><th>Atendidas</th><th>Canceladas</th><th>Ingresos</th></tr></thead>
                  <tbody>{d.porServicio.map((s) => <tr key={s.servicio}><td>{s.servicio}</td><td>{s.total}</td><td>{s.atendidas}</td><td>{s.canceladas}</td><td>{cop(s.ingresos)}</td></tr>)}</tbody>
                </table></div>
                <h3 style={{ marginTop: '1.25rem' }}>Clientes más atendidos</h3>
                {d.topClientes.length ? <ul>{d.topClientes.map((c) => <li key={c.nombre}>{c.nombre}: {c.atenciones}</li>)}</ul> : <p className="hint">Aún no hay citas atendidas.</p>}
              </div>
              <div>
                <h3>Citas por día</h3>
                {d.porDia.map((x) => <div className="barra-dia" key={x.fecha}><span>{fmtCorta(x.fecha)}</span><i style={{ width: `${(x.total / max) * 100}%` }} /><span>{x.total}</span></div>)}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
