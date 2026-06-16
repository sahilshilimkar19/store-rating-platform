/**
 * Centralised, validated access to Vite environment variables.
 *
 * Reading `import.meta.env` directly scatters untyped, unchecked lookups across
 * the app. Instead we validate here once at module load: if `VITE_API_URL` is
 * missing the app fails fast with a clear message rather than silently issuing
 * requests against `undefined`.
 */
function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `[config] Missing required environment variable: ${name}. ` +
        `Add it to your frontend .env file (see .env.example).`,
    );
  }
  return value;
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
} as const;
