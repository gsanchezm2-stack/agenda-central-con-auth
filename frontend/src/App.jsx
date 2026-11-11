// Estructura general: cabecera con pestañas y la pantalla activa (sincronizada con el hash de la URL)
import { useEffect, useState } from 'react';
import Login from './pages/Login.jsx';
import Citas from './pages/Citas.jsx';
import Disponibilidad from './pages/Disponibilidad.jsx';
import Clientes from './pages/Clientes.jsx';
import Servicios from './pages/Servicios.jsx';
import Horarios from './pages/Horarios.jsx';
import Reportes from './pages/Reportes.jsx';
import { haySesion, borrarToken } from './api/sesion.js';
const PESTANAS = [['citas', 'Citas'], ['disponibilidad', 'Disponibilidad'], ['clientes', 'Clientes'], ['servicios', 'Servicios'], ['horarios', 'Horarios'], ['reportes', 'Reportes']];
const leerHash = () => (PESTANAS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : 'citas');
export default function App() {
  const [vista, setVista] = useState(leerHash);
  const [autenticado, setAutenticado] = useState(haySesion);
  // Datos que Disponibilidad entrega al formulario de citas
  const [prefill, setPrefill] = useState(null);
  useEffect(() => {
    const alCambiar = () => setVista(leerHash());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);
  const ir = (k) => { location.hash = k; };
  const elegirHora = (datos) => { setPrefill(datos); ir('citas'); };
  const salir = () => { borrarToken(); setAutenticado(false); };
  if (!autenticado) return <Login alEntrar={() => setAutenticado(true)} />;
  return (
    <>
      <header className="cabecera">
        <h1>Agenda Central</h1>
        <nav className="nav" aria-label="Secciones">
          {PESTANAS.map(([k, t]) => <button key={k} type="button" aria-current={k === vista ? 'page' : undefined} onClick={() => ir(k)}>{t}</button>)}
        </nav>
        <button type="button" className="btn chico" onClick={salir}>Cerrar sesión</button>
      </header>
      <main>
        {vista === 'citas' && <Citas prefill={prefill} alUsarPrefill={() => setPrefill(null)} />}
        {vista === 'disponibilidad' && <Disponibilidad alElegir={elegirHora} />}
        {vista === 'clientes' && <Clientes />}
        {vista === 'servicios' && <Servicios />}
        {vista === 'horarios' && <Horarios />}
        {vista === 'reportes' && <Reportes />}
      </main>
    </>
  );
}
