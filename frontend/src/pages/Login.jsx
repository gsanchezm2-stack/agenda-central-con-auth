import { useState } from 'react';
import { enviar } from '../api/http.js';
import { guardarToken } from '../api/sesion.js';
export default function Login({ alEntrar }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const enviarFormulario = async (e) => {
    e.preventDefault();
    setError(''); setCargando(true);
    const { ok, cuerpo } = await enviar('/api/auth/login', 'POST', { usuario, clave });
    setCargando(false);
    if (!ok) return setError(cuerpo?.mensaje || 'No se pudo iniciar sesión.');
    guardarToken(cuerpo.token);
    alEntrar();
  };
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
      <form className="panel" style={{ width: 'min(360px, 90vw)' }} onSubmit={enviarFormulario}>
        <h2>Agenda Central</h2>
        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoFocus required />
        </div>
        <div className="campo">
          <label htmlFor="clave">Clave</label>
          <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
        </div>
        <span className="error">{error}</span>
        <div className="acciones">
          <button type="submit" className="btn primario" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
        </div>
      </form>
    </main>
  );
}
