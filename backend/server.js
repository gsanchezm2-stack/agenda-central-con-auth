// Punto de arranque: inicia el servidor HTTP y conecta con MongoDB
import 'dotenv/config';
import app from './src/app.js';
import { conectar } from './src/config/db.js';
const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`Agenda Central en http://localhost:${puerto}`));
conectar();
