export const MIN_PASSWORD_LENGTH = 6;

export const ALLOWED_EMAIL_DOMAINS = Object.freeze([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'yahoo.com',
]);

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return 'Email is required';
  if (!EMAIL_FORMAT.test(normalizedEmail)) return 'Enter a valid email address';

  const domain = normalizedEmail.slice(normalizedEmail.lastIndexOf('@') + 1);
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return 'Use an email from Gmail, Outlook, Hotmail, Live, iCloud, or Yahoo';
  }

  return '';
}

export function getPasswordRequirements(password) {
  return [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: password.length >= MIN_PASSWORD_LENGTH },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9\s]/.test(password) },
  ];
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  const missing = getPasswordRequirements(password).filter(({ met }) => !met);
  return missing.length ? `Password needs: ${missing.map(({ label }) => label.toLowerCase()).join(', ')}` : '';
}
