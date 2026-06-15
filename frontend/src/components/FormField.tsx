interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  error?: string | null;
  multiline?: boolean;
  autoComplete?: string;
}

/** Controlled labelled input (or textarea) with inline error display. */
export function FormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  error,
  multiline = false,
  autoComplete,
}: FormFieldProps) {
  const base =
    'mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const borderClass = error ? 'border-red-400' : 'border-gray-300';

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={3}
          className={`${base} ${borderClass}`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`${base} ${borderClass}`}
        />
      )}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
