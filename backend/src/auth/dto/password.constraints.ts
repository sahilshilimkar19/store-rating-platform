/**
 * Shared password policy, reused by register and change-password DTOs so the
 * rules stay in exactly one place.
 *
 * Policy: 8–16 characters, at least one uppercase letter and one special
 * (non-alphanumeric) character.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

// (?=.*[A-Z]) -> at least one uppercase, (?=.*[^A-Za-z0-9]) -> at least one special char
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_MESSAGE =
  'Password must be 8-16 characters and include at least one uppercase letter and one special character';
