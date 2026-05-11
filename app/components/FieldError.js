'use client';
// Reusable field wrapper — handles label, input, real-time error, and success tick.
// Usage:
//   <ValidatedField label="Full Name" error={errors.name} ok={!!form.name && !errors.name}>
//     <input className={`inp ${errors.name ? 'inp-error' : ''}`} ... />
//   </ValidatedField>

export function ValidatedField({ label, error, ok, required, children, hint }) {
  return (
    <div className="field-wrap">
      {label && (
        <label className="form-label">
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && <div className="field-error text-red-700">{error}</div>}
      {/* {!error && ok && <div className="field-ok text-green-600">Looks good</div>} */}
      {!error && !ok && hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// Convenience: a full input field in one component
export function InputField({ label, name, type = 'text', value, onChange, onBlur, validate,
  placeholder, required, disabled, hint, className, ...rest }) {

  const error = validate && value !== '' ? validate(value) : null;
  const ok = !!value && !error;

  const cls = `inp${error ? ' inp-error' : ok ? ' inp-ok' : ''}${className ? ' ' + className : ''}`;

  return (
    <ValidatedField label={label} error={error} ok={ok} required={required} hint={hint}>
      <input
        className={cls} type={type} name={name} value={value}
        onChange={onChange} onBlur={onBlur} placeholder={placeholder}
        disabled={disabled} required={required} {...rest}
      />
    </ValidatedField>
  );
}
