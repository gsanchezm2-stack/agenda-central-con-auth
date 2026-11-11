## Informe Técnico de Validación y Pruebas — Proyecto Agenda Central

**Proyecto:** Agenda Central  
**Despliegue:** Render.com (Frontend & Backend)  
**Base de Datos:** MongoDB Atlas  
**Estado General:** 100% Funcional y Aprobado  

---

### 1. Resumen Ejecutivo
El sistema **Agenda Central** ha completado satisfactoriamente el ciclo de pruebas funcionales, automatizadas y de persistencia. La aplicación demuestra estabilidad en el manejo de disponibilidad de cupos simultáneos, restricciones de horarios, cancelación justificada de citas, exportación de datos a formatos CSV y diseño adaptativo responsivo para dispositivos móviles.

---

### 2. Matriz de Evidencias Técnicas

| # | Prueba / Característica | Resultado Esperado | Resultado Obtenido | Estado | Archivo Evidencia |
| :-: | :--- | :--- | :--- | :-: | :--- |
| **1** | Pruebas Automatizadas | Ejecución exitosa del suite `npm test` | 48/48 pruebas unitarias e de integración aprobadas | **Aprobado** | `captura_01_pruebas_npm.png` |
| **2** | Validación Formulario | Bloqueo de envío con campos requeridos vacíos | Alert / Mensaje de validación impidiendo el registro incompleto | **Aprobado** | `captura_02_campos_obligatorios.png` |
| **3** | Control de Duplicados | Prevención de duplicación de documentos de identidad | Error por cliente duplicado detectado adecuadamente | **Aprobado** | `captura_03_cliente_duplicado.png` |
| **4** | Creación de Citas | Agendamiento correcto vinculando cliente y servicio | Cita visible en la tabla con estado *Programada* | **Aprobado** | `captura_04_crear_cita.png` |
| **5** | Cancelación con Motivo | Exigir motivo y liberar cupo de la hora | Estado pasa a *Cancelada*, almacena motivo y libera el horario | **Aprobado** | `captura_05_cancelar_cita.png` |
| **6** | Lógica de Cupos | Ocultar o deshabilitar bloques de hora llenos | Al alcanzar el límite simultáneo, la hora desaparece del selector | **Aprobado** | `captura_06_cupo_lleno.png` |
| **7** | Restricción de Horarios | Rechazar modificaciones de horario con citas activas | Sistema notifica conflicto y bloquea el guardado del cambio | **Aprobado** | `captura_07_cambiar_horario.png` |
| **8** | Reportes y Exportación | Cálculo coherente de ingresos/métricas y descarga CSV | Generación de dashboard y archivo `.csv` descargado correctamente | **Aprobado** | `captura_08_reporte_csv.png` |
| **9** | Persistencia de Datos | Mantenimiento de información tras recarga (`F5`) | Todas las citas y configuraciones se cargan intactas desde la BD | **Aprobado** | `captura_09_recargar_persistencia.png` |
| **10** | Responsividad Móvil | Adaptación fluida a pantallas estrechas (375 px) | Layout ordenado verticalmente garantizando legibilidad en móviles | **Aprobado** | `captura_10_responsividad.png` |
| **11** | Verificación Cloud | Sincronización en tiempo real con MongoDB Atlas | Colección `citas` refleja exactamente la estructura JSON agendada | **Aprobado** | `captura_11_mongodb_atlas.png` |

---

### 3. Conclusión General

El desarrollo de **Agenda Central** cumple rigurosamente con los requerimientos técnicos y funcionales especificados. La integración entre la capa de presentación, el backend en la nube y MongoDB Atlas garantiza la integridad de los datos, la seguridad en el manejo de cupos y una experiencia de usuario fluida tanto en entorno de escritorio como móvil.