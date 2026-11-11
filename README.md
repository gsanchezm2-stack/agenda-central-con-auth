# Agenda Central

Aplicativo web para gestionar citas en un centro de servicios. Evita los cruces de horarios con una agenda que respeta los cupos simultáneos y permite controlar la atención con reportes.

Funciones: registrar clientes, registrar servicios, crear y cancelar citas, consultar disponibilidad, administrar horarios y generar reportes de atención (con descarga en CSV).

**Tecnologías:** React (Vite) en el frontend, Node.js con Express en el backend y MongoDB Atlas como base de datos.

## Estructura
```
agenda-central/
  backend/
    server.js                 arranque: servidor y conexión a la base
    seed.js                   datos de prueba
    .env.example              plantilla de configuración (sin contraseñas)
    src/
      app.js                  configuración de Express y rutas
      config/db.js            conexión con MongoDB
      models/                 esquemas de Mongoose (Cliente, Servicio, Horario, Cita)
      routes/                 rutas de la API
      controllers/            lógica de cada recurso
      services/agenda.js      reglas de cupos y cruces de horarios
      middleware/             errores y estado de la base de datos
      utils/respuestas.js     utilidades comunes
    tests/pruebas-api.mjs     47 pruebas automáticas de la API
  frontend/
    index.html, vite.config.js
    src/
      main.jsx, App.jsx       arranque y pestañas
      pages/                  Citas, Disponibilidad, Clientes, Servicios, Horarios, Reportes
      components/             Campo, CrudEntidad, Dialogos, Aviso
      api/http.js             cliente HTTP
      utils/formato.js        formatos y descarga de CSV
      styles/estilos.css      estilos responsivos
  shared/validaciones.js      reglas de validación usadas por el navegador y el servidor
  docs/                       BASE_DE_DATOS.md, INFORME_TECNICO.md, GUION_DEMOSTRACION.md
```

## Requisitos
- Node.js 18 o superior
- Una base MongoDB Atlas (explicada paso a paso en `docs/BASE_DE_DATOS.md`)

## Instalación
```bash
npm run instalar          # instala las dependencias de backend y frontend
cp backend/.env.example backend/.env      # en Windows: copy backend\.env.example backend\.env
# edite backend/.env y pegue su MONGODB_URI de Atlas (el archivo .env no se sube al repositorio)
npm run seed              # opcional: servicios, clientes y citas de ejemplo
```

## Ejecución
**Desarrollo (dos terminales):**
```bash
cd backend && npm run dev       # API en http://localhost:3000
cd frontend && npm run dev      # aplicación en http://localhost:5173 (envía /api al backend)
```
**Un solo servidor (compilado):**
```bash
npm run build                   # genera frontend/dist
npm start                       # el backend publica la API y la aplicación en http://localhost:3000
```
**Pruebas** (con el backend en marcha): `cd backend && npm test`.

## API
| Método | Ruta | Operación |
|---|---|---|
| GET, POST | `/api/clientes`, `/api/servicios` | Listar (`?q=`) y crear |
| GET, PUT, DELETE | `/api/clientes/:id`, `/api/servicios/:id` | Consultar, actualizar y eliminar |
| GET, PUT | `/api/horarios`, `/api/horarios/:dia` | Consultar y administrar horarios (0 = domingo) |
| GET | `/api/disponibilidad?fecha=&servicioId=` | Horas con cupo para un servicio |
| GET, POST | `/api/citas` (`?desde=&hasta=&estado=&q=`) | Listar con filtros y agendar |
| GET, PUT, DELETE | `/api/citas/:id` | Consultar, reprogramar y eliminar |
| PATCH | `/api/citas/:id/estado` | Cancelar (con motivo) o marcar atendida |
| GET | `/api/reportes?desde=&hasta=` | Totales, cancelación, ingresos, por servicio, por día |

Códigos: 200, 201 y 204 correcto; 400 datos inválidos; 404 no existe; 409 conflicto (duplicado, sin cupo, cruce); 503 base de datos no disponible.

## Reglas de agenda
- Solo se agenda en días activos y dentro del horario; la cita debe terminar antes del cierre.
- Una cita ocupa un cupo durante la duración de su servicio. Si los cupos están ocupados, el servidor la rechaza.
- Un cliente no puede tener dos citas que se crucen.
- No se agenda en el pasado ni a más de 180 días.
- Cancelar libera el cupo y exige un motivo. Solo se cambian citas programadas.
- No se puede eliminar un cliente o servicio con citas (el servicio se desactiva). No se puede cerrar un día ni acortar su horario si deja citas programadas por fuera.

## Publicarlo en línea (opcional)
Suba el repositorio a Render, Railway u otro servicio para Node.js. Compile con `npm run instalar && npm run build` y arranque con `npm start`. Defina `MONGODB_URI` como variable de entorno y permita el acceso de red del servicio en Atlas.

## Cumplimiento del TCC
| Requisito del TCC | Dónde se cumple |
|---|---|
| Conexión a MongoDB con datos persistentes | `backend/src/config/db.js` y `backend/src/models/`; explicado en `docs/BASE_DE_DATOS.md` |
| Formulario con etiquetas, tipos de control, obligatorios y opcionales, ayudas, errores junto al campo, datos conservados y mensajes de resultado | `frontend/src/components/Campo.jsx`, `CrudEntidad.jsx` y `pages/` |
| Validación de todos los campos en navegador y servidor | `shared/validaciones.js`, usado por ambos; el servidor responde 400 antes de guardar |
| Credenciales fuera del navegador y del repositorio, con archivo de ejemplo | `backend/.env`, `.gitignore` y `backend/.env.example` |
| CRUD completo con confirmación al eliminar y estado actualizado tras cada operación | Clientes, servicios y citas; los horarios se administran por día |
| Consulta por identificador o criterio de búsqueda | `GET /api/<recurso>/:id`, búsqueda por texto, fecha y estado |
| Manejo de errores: datos inválidos, inexistentes, duplicados y fallo de conexión | Códigos 400, 404, 409 y 503 con mensajes sin detalles internos |
| Interfaz legible en distintos tamaños | `frontend/src/styles/estilos.css` (las tablas pasan a tarjetas en pantallas pequeñas) |
| Base de datos de prueba sin datos personales reales | `npm run seed` |
| Pruebas con datos, esperado, obtenido, estado y evidencia, incluyendo reglas de cada campo | `backend/tests/pruebas-api.mjs` (47 pruebas) y la sección 7 del informe |
| Informe técnico, matriz de pruebas y demostración | `docs/INFORME_TECNICO.md` y `docs/GUION_DEMOSTRACION.md` |
