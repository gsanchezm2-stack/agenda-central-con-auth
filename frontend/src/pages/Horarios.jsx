// Administración de horarios: un formulario por día de la semana
import { useEffect, useState } from 'react';
import { api, enviar } from '../api/http.js';
import { validarHorario } from '@shared/validaciones.js';
import { DIAS } from '../utils/formato.js';
import { useAviso } from '../components/Aviso.jsx';
function DiaHorario({ x }) {
  const { avisar } = useAviso();
  const [v, setV] = useState({ activo: String(x.activo), apertura: x.apertura, cierre: x.cierre, capacidad: String(x.capacidad) });
  const [errs, setErrs] = useState({});
  const [mensaje, setMensaje] = useState('');
  const p = `hor${x.dia}`;
  const cambiar = (e) => setV((a) => ({ ...a, [e.target.name]: e.target.value }));
  const guardar = async (e) => {
    e.preventDefault();
    const { errores } = validarHorario(v);
    setErrs(errores);
    if (Object.keys(errores).length) { setMensaje(Object.values(errores).join(' ')); return; }
    setMensaje('');
    const r = await enviar(`/api/horarios/${x.dia}`, 'PUT', v);
    if (!r.ok) {
      setMensaje(r.cuerpo?.errores ? Object.values(r.cuerpo.errores).join(' ') : r.cuerpo?.mensaje);
      avisar(r.cuerpo?.mensaje || 'No se pudo guardar.', true);
      return;
    }
    avisar(`Horario del ${DIAS[x.dia].toLowerCase()} guardado.`);
  };
  const invalido = (n) => (errs[n] ? 'true' : 'false');
  return (
    <form className="dia" onSubmit={guardar} noValidate>
      <h3>{DIAS[x.dia]}</h3>
      <div className="campo"><label htmlFor={`${p}-activo`}>Atiende</label>
        <select id={`${p}-activo`} name="activo" value={v.activo} onChange={cambiar} aria-invalid={invalido('activo')}><option value="true">Sí</option><option value="false">No</option></select></div>
      <div className="campo"><label htmlFor={`${p}-apertura`}>Apertura</label><input id={`${p}-apertura`} name="apertura" type="time" value={v.apertura} onChange={cambiar} aria-invalid={invalido('apertura')} /></div>
      <div className="campo"><label htmlFor={`${p}-cierre`}>Cierre</label><input id={`${p}-cierre`} name="cierre" type="time" value={v.cierre} onChange={cambiar} aria-invalid={invalido('cierre')} /></div>
      <div className="campo"><label htmlFor={`${p}-capacidad`}>Cupos simultáneos</label><input id={`${p}-capacidad`} name="capacidad" type="number" min="1" max="10" value={v.capacidad} onChange={cambiar} aria-invalid={invalido('capacidad')} /></div>
      <button type="submit" className="btn primario">Guardar</button>
      <small className="error" role="alert">{mensaje}</small>
    </form>
  );
}
export default function Horarios() {
  const [lista, setLista] = useState(null);
  const [fallo, setFallo] = useState('');
  useEffect(() => {
    api('/api/horarios').then((r) => (r.ok ? setLista([1, 2, 3, 4, 5, 6, 0].map((d) => r.cuerpo.find((x) => x.dia === d)).filter(Boolean)) : setFallo(r.cuerpo?.mensaje || 'No se pudieron cargar los horarios.')));
  }, []);
  return (
    <section className="tarjeta">
      <h2>Horarios de atención</h2>
      <p className="hint">Los cupos simultáneos son cuántas citas pueden estar en curso a la vez. El sistema no permite superar ese número.</p>
      {fallo && <p className="vacio">{fallo}</p>}
      <div className="horarios">{(lista || []).map((x) => <DiaHorario key={x.dia} x={x} />)}</div>
    </section>
  );
}
