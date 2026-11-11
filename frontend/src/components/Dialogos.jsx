// Diálogos de confirmación y de motivo de cancelación; se usan con await: const ok = await confirmar(...)
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { validarEstado } from '@shared/validaciones.js';
const Contexto = createContext(null);
export const useDialogos = () => useContext(Contexto);
// Envoltura sobre <dialog>: se abre como modal al montarse y Esc llama a alCancelar
function Modal({ titulo, alCancelar, children }) {
  const ref = useRef();
  useEffect(() => { ref.current.showModal(); }, []);
  return (
    <dialog ref={ref} aria-labelledby="dlg-titulo" onCancel={(e) => { e.preventDefault(); alCancelar(); }}>
      <h3 id="dlg-titulo">{titulo}</h3>
      {children}
    </dialog>
  );
}
function DialogoMotivo({ resumen, alTerminar }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const aceptar = () => {
    const { errores } = validarEstado({ estado: 'Cancelada', motivo: texto });
    if (errores.motivo) { setError(errores.motivo); return; }
    alTerminar(texto.trim());
  };
  return (
    <Modal titulo="Cancelar cita" alCancelar={() => alTerminar(null)}>
      <p>{resumen}</p>
      <label htmlFor="motivo">Motivo de la cancelación</label>
      <textarea id="motivo" rows={3} maxLength={200} value={texto} onChange={(e) => setTexto(e.target.value)} aria-invalid={error ? 'true' : 'false'} aria-describedby="motivo-e" autoFocus />
      <small className="error" id="motivo-e" role="alert">{error}</small>
      <div className="acciones">
        <button type="button" className="btn" onClick={() => alTerminar(null)}>Volver</button>
        <button type="button" className="btn peligro" onClick={aceptar}>Cancelar cita</button>
      </div>
    </Modal>
  );
}
export function DialogosProvider({ children }) {
  const [conf, setConf] = useState(null);
  const [mot, setMot] = useState(null);
  const confirmar = useCallback((titulo, mensaje, boton, peligro = true) => new Promise((res) => setConf({ titulo, mensaje, boton, peligro, res })), []);
  const pedirMotivo = useCallback((resumen) => new Promise((res) => setMot({ resumen, res })), []);
  const cerrarConf = (v) => { conf.res(v); setConf(null); };
  const cerrarMot = (v) => { mot.res(v); setMot(null); };
  return (
    <Contexto.Provider value={{ confirmar, pedirMotivo }}>
      {children}
      {conf && (
        <Modal titulo={conf.titulo} alCancelar={() => cerrarConf(false)}>
          <p>{conf.mensaje}</p>
          <div className="acciones">
            <button type="button" className="btn" onClick={() => cerrarConf(false)}>Volver</button>
            <button type="button" className={`btn ${conf.peligro ? 'peligro' : 'primario'}`} onClick={() => cerrarConf(true)}>{conf.boton}</button>
          </div>
        </Modal>
      )}
      {mot && <DialogoMotivo resumen={mot.resumen} alTerminar={cerrarMot} />}
    </Contexto.Provider>
  );
}
