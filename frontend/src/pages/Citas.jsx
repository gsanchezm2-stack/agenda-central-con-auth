// Agenda: formulario para agendar o reprogramar y lista de citas con filtros
import { useEffect, useState } from 'react';
import { api, enviar } from '../api/http.js';
import { validarCita, hoyLocal, sumarDias, fechaReal } from '@shared/validaciones.js';
import { fmtCorta, enfocarPrimero } from '../utils/formato.js';
import Campo from '../components/Campo.jsx';
import { useAviso } from '../components/Aviso.jsx';
import { useDialogos } from '../components/Dialogos.jsx';
const NOMBRES = ['clienteId', 'servicioId', 'fecha', 'horaInicio', 'notas'];
const VACIO = { clienteId: '', servicioId: '', fecha: '', horaInicio: '', notas: '' };
export default function Citas({ prefill, alUsarPrefill }) {
  const hoy = hoyLocal();
  const { avisar } = useAviso();
  const { confirmar, pedirMotivo } = useDialogos();
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [v, setV] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [horas, setHoras] = useState(null);
  const [errorHora, setErrorHora] = useState('');
  const [filtros, setFiltros] = useState({ desde: hoy, hasta: '', estado: '', q: '' });
  const [citas, setCitas] = useState(null);
  const [fallo, setFallo] = useState('');
  const [recarga, setRecarga] = useState(0);
  const recargar = () => setRecarga((n) => n + 1);
  // Clientes y servicios activos para las listas desplegables
  useEffect(() => {
    api('/api/clientes').then((r) => r.ok && setClientes(r.cuerpo));
    api('/api/servicios?activos=1').then((r) => r.ok && setServicios(r.cuerpo));
  }, []);
  // Viene de la pantalla Disponibilidad con fecha, servicio y hora elegidos
  useEffect(() => {
    if (prefill) { setV({ ...VACIO, fecha: prefill.fecha, servicioId: prefill.servicioId, horaInicio: prefill.hora }); alUsarPrefill(); }
  }, [prefill]);
  // Horas con cupo para la fecha y el servicio elegidos
  useEffect(() => {
    setErrorHora('');
    if (!v.fecha || !v.servicioId || !fechaReal(v.fecha)) { setHoras(null); return; }
    let vivo = true;
    const q = new URLSearchParams({ fecha: v.fecha, servicioId: v.servicioId });
    if (editando) q.set('excluirCitaId', editando);
    api('/api/disponibilidad?' + q).then((r) => {
      if (!vivo) return;
      if (!r.ok) { setHoras([]); setErrorHora(r.cuerpo?.errores?.fecha || r.cuerpo?.mensaje || 'No se pudo consultar la disponibilidad.'); return; }
      if (!r.cuerpo.abierto) { setHoras([]); setErrorHora(r.cuerpo.mensaje); return; }
      const libres = r.cuerpo.slots.filter((s) => s.disponible);
      setHoras(libres);
      if (!libres.length) setErrorHora('No hay horarios con cupo ese día para este servicio. Pruebe otra fecha.');
    });
    return () => { vivo = false; };
  }, [v.fecha, v.servicioId, editando, recarga]);
  // Lista de citas según los filtros (con pausa corta al escribir)
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = new URLSearchParams();
      Object.entries(filtros).forEach(([k, x]) => x.trim() && q.set(k, x.trim()));
      const r = await api('/api/citas?' + q);
      if (r.ok) { setCitas(r.cuerpo); setFallo(''); } else { setCitas([]); setFallo(r.cuerpo?.mensaje || 'No se pudo cargar la agenda.'); }
    }, 250);
    return () => clearTimeout(t);
  }, [filtros, recarga]);
  const cambiar = (e) => {
    const { name, value } = e.target;
    // Al cambiar fecha o servicio, la hora elegida deja de ser válida
    setV((x) => ({ ...x, [name]: value, ...(name === 'fecha' || name === 'servicioId' ? { horaInicio: '' } : {}) }));
  };
  const mostrar = (errs) => { setErrores(errs); enfocarPrimero('cita', NOMBRES, errs); };
  const salir = () => { setEditando(null); setV(VACIO); setErrores({}); };
  const editar = async (id) => {
    const r = await api('/api/citas/' + id);
    if (!r.ok) { avisar(r.cuerpo.mensaje, true); recargar(); return; }
    setV(Object.fromEntries(NOMBRES.map((n) => [n, r.cuerpo[n] ?? '']))); setErrores({}); setEditando(id);
  };
  const guardar = async (e) => {
    e.preventDefault();
    const { errores: errs } = validarCita(v);
    mostrar(errs);
    if (Object.keys(errs).length) { avisar('Revise los campos marcados.', true); return; }
    setGuardando(true);
    const r = await enviar(editando ? '/api/citas/' + editando : '/api/citas', editando ? 'PUT' : 'POST', v);
    setGuardando(false);
    if (!r.ok) {
      if (r.cuerpo?.errores) mostrar(r.cuerpo.errores);
      avisar(r.cuerpo?.mensaje || 'No se pudo guardar la cita.', true);
      // Otro usuario pudo ocupar el cupo: se actualiza la lista de horas
      if (r.status === 409 || r.status === 404) recargar();
      if (r.cuerpo?.errores?.general) salir();
      return;
    }
    avisar(editando ? 'Cita reprogramada.' : 'Cita agendada.');
    salir(); recargar();
  };
  const resumen = (c) => `${c.cliente?.nombre || 'Cliente'}, ${c.servicioNombre}, ${fmtCorta(c.fecha)} a las ${c.horaInicio}.`;
  const atender = async (c) => {
    if (!(await confirmar('Marcar como atendida', resumen(c), 'Marcar atendida', false))) return;
    const r = await enviar(`/api/citas/${c.id}/estado`, 'PATCH', { estado: 'Atendida' });
    avisar(r.ok ? 'Cita marcada como atendida.' : r.cuerpo.mensaje, !r.ok); recargar();
  };
  const cancelar = async (c) => {
    const motivo = await pedirMotivo(resumen(c));
    if (motivo === null) return;
    const r = await enviar(`/api/citas/${c.id}/estado`, 'PATCH', { estado: 'Cancelada', motivo });
    avisar(r.ok ? 'Cita cancelada. El cupo quedó libre.' : r.cuerpo.mensaje, !r.ok); recargar();
  };
  const eliminar = async (c) => {
    if (!(await confirmar('Eliminar cita', `Se eliminará el registro: ${resumen(c)} Esta acción no se puede deshacer.`, 'Eliminar cita'))) return;
    const r = await api('/api/citas/' + c.id, { method: 'DELETE' });
    avisar(r.ok ? 'Cita eliminada.' : r.cuerpo.mensaje, !r.ok);
    if (r.ok && c.id === editando) salir();
    recargar();
  };
  const filtrar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
  const opcionesHora = horas === null ? [['', 'Elija fecha y servicio']]
    : [['', 'Seleccione…'], ...horas.map((s) => [s.hora, `${s.hora} (${s.libres} ${s.libres === 1 ? 'cupo' : 'cupos'})`])];
  return (
    <div className="dos-col">
      <section className="panel">
        <h2>{editando ? 'Reprogramar cita' : 'Nueva cita'}</h2>
        <form onSubmit={guardar} noValidate>
          <Campo id="cita-clienteId" nombre="clienteId" etiqueta="Cliente" tipo="select" valor={v.clienteId} onCambio={cambiar} error={errores.clienteId}
            opciones={[['', clientes.length ? 'Seleccione…' : 'Primero registre un cliente'], ...clientes.map((c) => [c.id, `${c.nombre} (${c.documento})`])]} />
          <Campo id="cita-servicioId" nombre="servicioId" etiqueta="Servicio" tipo="select" valor={v.servicioId} onCambio={cambiar} error={errores.servicioId}
            opciones={[['', servicios.length ? 'Seleccione…' : 'Primero registre un servicio activo'], ...servicios.map((s) => [s.id, `${s.nombre} (${s.duracionMin} min)`])]} />
          <Campo id="cita-fecha" nombre="fecha" etiqueta="Fecha" tipo="date" valor={v.fecha} onCambio={cambiar} error={errores.fecha} min={hoy} max={sumarDias(hoy, 180)} />
          <Campo id="cita-horaInicio" nombre="horaInicio" etiqueta="Hora" tipo="select" valor={v.horaInicio} onCambio={cambiar} error={errores.horaInicio || errorHora}
            opciones={opcionesHora} ayuda="Solo se listan horas con cupo disponible." />
          <Campo id="cita-notas" nombre="notas" etiqueta="Notas" tipo="textarea" opcional valor={v.notas} onCambio={cambiar} error={errores.notas} maxLength={200} />
          <div className="acciones">
            <button type="submit" className="btn primario" disabled={guardando}>{editando ? 'Guardar cambios' : 'Agendar cita'}</button>
            {editando && <button type="button" className="btn" onClick={salir}>Cancelar edición</button>}
          </div>
        </form>
      </section>
      <section className="lista">
        <div className="barra">
          <h2>Agenda {citas && <span className="contador">({citas.length})</span>}</h2>
          <div className="filtros">
            <div><label htmlFor="f-desde">Desde</label><input id="f-desde" type="date" name="desde" value={filtros.desde} onChange={filtrar} /></div>
            <div><label htmlFor="f-hasta">Hasta</label><input id="f-hasta" type="date" name="hasta" value={filtros.hasta} onChange={filtrar} /></div>
            <div><label htmlFor="f-estado">Estado</label>
              <select id="f-estado" name="estado" value={filtros.estado} onChange={filtrar}>
                <option value="">Todos</option><option value="Programada">Programadas</option><option value="Atendida">Atendidas</option><option value="Cancelada">Canceladas</option>
              </select></div>
            <div><label htmlFor="f-q">Cliente</label><input id="f-q" type="search" name="q" placeholder="Nombre o documento" value={filtros.q} onChange={filtrar} /></div>
          </div>
        </div>
        <div className="envoltura">
          <table className="tabla-cards">
            <thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {(citas || []).map((c) => {
                const programada = c.estado === 'Programada';
                return (
                  <tr key={c.id}>
                    <td data-label="Fecha">{fmtCorta(c.fecha)}</td>
                    <td data-label="Hora">{c.horaInicio} a {c.horaFin}</td>
                    <td data-label="Cliente"><span>{c.cliente?.nombre || 'Cliente eliminado'}<span className="sub">{c.cliente?.documento}</span></span></td>
                    <td data-label="Servicio"><span>{c.servicioNombre}{c.motivoCancelacion && <span className="sub">Motivo: {c.motivoCancelacion}</span>}</span></td>
                    <td data-label="Estado"><span className={`chip ${c.estado}`}>{c.estado}</span></td>
                    <td className="acc"><div className="celda-acc">
                      {programada && <button type="button" className="btn chico" onClick={() => editar(c.id)}>Editar</button>}
                      {programada && <button type="button" className="btn chico" onClick={() => atender(c)}>Atender</button>}
                      {programada && <button type="button" className="btn chico" onClick={() => cancelar(c)}>Cancelar</button>}
                      <button type="button" className="btn chico" onClick={() => eliminar(c)}>Eliminar</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {citas && citas.length === 0 && <p className="vacio">{fallo || 'No hay citas con esos filtros. Agende una con el formulario.'}</p>}
      </section>
    </div>
  );
}
