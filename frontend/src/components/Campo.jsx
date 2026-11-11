// Campo de formulario accesible: etiqueta, control, ayuda y mensaje de error junto al campo
export default function Campo({ id, nombre, etiqueta, opcional, ayuda, error, tipo = 'text', opciones = [], valor, onCambio, ...extra }) {
  const descripcion = [ayuda ? `${id}-h` : null, `${id}-e`].filter(Boolean).join(' ');
  const comunes = { id, name: nombre, value: valor, onChange: onCambio, 'aria-describedby': descripcion, 'aria-invalid': error ? 'true' : 'false' };
  let control;
  if (tipo === 'select') control = <select {...comunes}>{opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>;
  else if (tipo === 'textarea') control = <textarea rows={2} {...comunes} {...extra} />;
  else control = <input type={tipo} autoComplete="off" {...comunes} {...extra} />;
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}{opcional && <span className="opc">opcional</span>}</label>
      {control}
      {ayuda && <small className="hint" id={`${id}-h`}>{ayuda}</small>}
      <small className="error" id={`${id}-e`} role="alert">{error}</small>
    </div>
  );
}
