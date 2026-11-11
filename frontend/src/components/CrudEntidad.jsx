// Pantalla CRUD genérica (formulario + tabla con búsqueda); la usan Clientes y Servicios
import { useEffect, useState } from 'react';
import { api, enviar } from '../api/http.js';
import { enfocarPrimero } from '../utils/formato.js';
import Campo from './Campo.jsx';
import { useAviso } from './Aviso.jsx';
import { useDialogos } from './Dialogos.jsx';
// Valores iniciales: vacío, o la primera opción en las listas
const vacios = (campos) => Object.fromEntries(campos.map((c) => [c.n, c.tipo === 'select' ? c.opciones[0][0] : '']));
const mayus = (s) => s[0].toUpperCase() + s.slice(1);
export default function CrudEntidad({ cfg }) {
  const { avisar } = useAviso();
  const { confirmar } = useDialogos();
  const [lista, setLista] = useState(null);
  const [fallo, setFallo] = useState('');
  const [buscar, setBuscar] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [v, setV] = useState(() => vacios(cfg.campos));
  const [errores, setErrores] = useState({});
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const nombres = cfg.campos.map((c) => c.n);
  const recargar = () => setRecarga((n) => n + 1);
  // Consulta la lista con una pausa corta mientras se escribe en el buscador
  useEffect(() => {
    const t = setTimeout(async () => {
      const r = await api(cfg.api + (buscar.trim() ? '?q=' + encodeURIComponent(buscar.trim()) : ''));
      if (r.ok) { setLista(r.cuerpo); setFallo(''); } else { setLista([]); setFallo(r.cuerpo?.mensaje || 'No se pudo cargar la lista.'); }
    }, 250);
    return () => clearTimeout(t);
  }, [buscar, recarga, cfg.api]);
  const cambiar = (e) => setV((x) => ({ ...x, [e.target.name]: e.target.value }));
  const mostrar = (errs) => { setErrores(errs); enfocarPrimero(cfg.clave, nombres, errs); };
  const salir = () => { setEditando(null); setV(vacios(cfg.campos)); setErrores({}); };
  // Carga el registro en el formulario para actualizarlo
  const editar = async (id) => {
    const r = await api(`${cfg.api}/${id}`);
    if (!r.ok) { avisar(r.cuerpo.mensaje, true); recargar(); return; }
    setV(Object.fromEntries(nombres.map((n) => [n, String(r.cuerpo[n] ?? '')])));
    setErrores({}); setEditando(id);
    document.getElementById(`${cfg.clave}-${nombres[0]}`)?.focus();
  };
  const guardar = async (e) => {
    e.preventDefault();
    const { errores: errs } = cfg.validar(v);
    mostrar(errs);
    if (Object.keys(errs).length) { avisar('Revise los campos marcados.', true); return; }
    setGuardando(true);
    const r = await enviar(editando ? `${cfg.api}/${editando}` : cfg.api, editando ? 'PUT' : 'POST', v);
    setGuardando(false);
    // Si el servidor rechaza, el formulario conserva lo escrito
    if (!r.ok) {
      if (r.cuerpo?.errores) mostrar(r.cuerpo.errores);
      avisar(r.cuerpo?.mensaje || 'No se pudo guardar.', true);
      if (r.status === 404) { salir(); recargar(); }
      return;
    }
    avisar(editando ? 'Cambios guardados.' : `${mayus(cfg.singular)} guardado.`);
    salir(); recargar();
  };
  const eliminar = async (x) => {
    if (!(await confirmar(`Eliminar ${cfg.singular}`, `Se eliminará ${cfg.nombre(x)}. Esta acción no se puede deshacer.`, `Eliminar ${cfg.singular}`))) return;
    const r = await api(`${cfg.api}/${x.id}`, { method: 'DELETE' });
    avisar(r.ok ? `${mayus(cfg.singular)} eliminado.` : r.cuerpo.mensaje, !r.ok);
    if (r.ok && x.id === editando) salir();
    recargar();
  };
  return (
    <div className="dos-col">
      <section className="panel">
        <h2>{editando ? `Editar ${cfg.singular}` : `Nuevo ${cfg.singular}`}</h2>
        <form onSubmit={guardar} noValidate>
          {cfg.campos.map(({ n, et, ...resto }) => (
            <Campo key={n} id={`${cfg.clave}-${n}`} nombre={n} etiqueta={et} valor={v[n]} onCambio={cambiar} error={errores[n]}
              tipo={resto.tipo} opciones={resto.opciones} opcional={resto.opc} ayuda={resto.hint} {...(resto.attrs || {})} />
          ))}
          <div className="acciones">
            <button type="submit" className="btn primario" disabled={guardando}>{editando ? 'Guardar cambios' : `Guardar ${cfg.singular}`}</button>
            {editando && <button type="button" className="btn" onClick={salir}>Cancelar edición</button>}
          </div>
        </form>
      </section>
      <section className="lista">
        <div className="barra">
          <h2>{cfg.titulo} {lista && <span className="contador">({lista.length})</span>}</h2>
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder={`Buscar por ${cfg.buscarEn}`} aria-label={`Buscar ${cfg.plural}`} />
        </div>
        <div className="envoltura">
          <table className="tabla-cards">
            <thead><tr>{cfg.columnas.map(([et]) => <th key={et}>{et}</th>)}<th></th></tr></thead>
            <tbody>
              {(lista || []).map((x) => (
                <tr key={x.id}>
                  {cfg.columnas.map(([et, f]) => <td key={et} data-label={et}>{f(x)}</td>)}
                  <td className="acc"><div className="celda-acc">
                    <button type="button" className="btn chico" onClick={() => editar(x.id)}>Editar</button>
                    <button type="button" className="btn chico" onClick={() => eliminar(x)}>Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista && lista.length === 0 && (
          <p className="vacio">{fallo || (buscar.trim() ? 'Ningún registro coincide con la búsqueda.' : `Aún no hay ${cfg.plural}. Complete el formulario para agregar el primero.`)}</p>
        )}
      </section>
    </div>
  );
}
