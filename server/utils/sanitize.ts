import DOMPurify from 'isomorphic-dompurify';

export function sanitizeForHTML(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function sanitizeForLog(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[<>'"&]/g, '')
    .substring(0, 200);
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function sanitizeInput(input: any): string {
  if (input === null || input === undefined) return '';
  return String(input).trim().substring(0, 1000);
}