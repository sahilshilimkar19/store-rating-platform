/**
 * Client-side validators mirroring the backend rules. Each returns an error
 * message string, or null when the value is valid. The server remains the
 * source of truth — these exist only for immediate inline feedback.
 */

export const NAME_MIN = 20;
export const NAME_MAX = 60;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 16;
export const ADDRESS_MAX = 400;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPPERCASE_REGEX = /[A-Z]/;
const SPECIAL_REGEX = /[^A-Za-z0-9]/;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Name is required';
  if (v.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters`;
  if (v.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters`;
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Email is required';
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address';
  return null;
}

/** Full password policy — used on registration. */
export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < PASSWORD_MIN || value.length > PASSWORD_MAX) {
    return `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters`;
  }
  if (!UPPERCASE_REGEX.test(value)) {
    return 'Password must include at least one uppercase letter';
  }
  if (!SPECIAL_REGEX.test(value)) {
    return 'Password must include at least one special character';
  }
  return null;
}

/** Address is optional, but capped in length when provided. */
export function validateAddress(value: string): string | null {
  if (value.length > ADDRESS_MAX) {
    return `Address must be at most ${ADDRESS_MAX} characters`;
  }
  return null;
}

/** Login only needs a non-empty password (policy is enforced at registration). */
export function validateRequiredPassword(value: string): string | null {
  if (!value) return 'Password is required';
  return null;
}
