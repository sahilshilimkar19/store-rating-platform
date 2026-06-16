export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string | null;
}

/** Controlled labelled <select> with inline error display. */
export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
}: SelectFieldProps) {
  const borderClass = error
    ? 'border-red-500'
    : 'border-gray-300 hover:border-gray-400';
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-50 ${borderClass}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
