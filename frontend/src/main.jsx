import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AvisoProvider } from './components/Aviso.jsx';
import { DialogosProvider } from './components/Dialogos.jsx';
import './styles/estilos.css';
createRoot(document.getElementById('root')).render(
  <AvisoProvider><DialogosProvider><App /></DialogosProvider></AvisoProvider>
);
