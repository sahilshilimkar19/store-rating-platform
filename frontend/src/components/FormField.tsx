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
    'mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50';
  const borderClass = error
    ? 'border-red-500'
    : 'border-gray-300 hover:border-gray-400';
  const errorId = `${name}-error`;
  const shared = {
    id: name,
    name,
    value,
    placeholder,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    onBlur,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: `${base} ${borderClass}`,
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {multiline ? (
        <textarea {...shared} rows={3} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} />
      )}
      {/* Reserve space so the layout never jumps when an error appears. */}
      <div className="min-h-[1.125rem]">
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
