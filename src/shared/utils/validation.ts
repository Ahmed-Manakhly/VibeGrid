/**
 * Shared Form Validation Rules (Domain Primitives)
 */

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const DANGEROUS_URL_SCHEMES = ['javascript:', 'data:', 'vbscript:'];

export const normalizeEmail = (email: string): string => {
  return email ? email.trim().toLowerCase() : '';
};

export const validateEmail = (email: string): boolean | string => {
  const trimmed = email.trim();
  if (!trimmed) return 'Email address is required';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address';
  return true;
};

export const validatePassword = (password: string): boolean | string => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return 'Password must contain uppercase, lowercase, number, and special character';
  }
  return true;
};

export const validateUsername = (username: string): boolean | string => {
  const trimmed = username.trim();
  if (!trimmed) return 'Username is required';
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Username must be 3-30 characters (letters, numbers, underscore)';
  }
  return true;
};

export const validateUrl = (url: string): boolean | string => {
  const trimmed = url.trim();
  if (!trimmed) return true; // Optional field
  const lower = trimmed.toLowerCase();
  for (const scheme of DANGEROUS_URL_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return `Dangerous URL scheme rejected (${scheme})`;
    }
  }
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return 'URL must start with http:// or https://';
  }
  return true;
};

export const validateRequired = (val: string, fieldName: string = 'Field'): boolean | string => {
  if (!val || !val.trim()) return `${fieldName} is required`;
  return true;
};
