// Mensaje breve de resultado (éxito o error) disponible en toda la aplicación
import { createContext, useCallback, useContext, useRef, useState } from 'react';
const Contexto = createContext(null);
export const useAviso = () => useContext(Contexto);
export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef();
  const avisar = useCallback((texto, malo = false) => {
    setAviso({ texto, malo });
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(null), 4500);
  }, []);
  return (
    <Contexto.Provider value={{ avisar }}>
      {children}
      <div className={`toast${aviso?.malo ? ' mal' : ''}`} role="status" aria-live="polite" hidden={!aviso}>{aviso?.texto}</div>
    </Contexto.Provider>
  );
}
