/** Strip HTML tags and limit string length for XSS prevention */
export function sanitizeString(input: string, maxLength = 100): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Sanitize a player name */
export function sanitizeName(name: string): string {
  const sanitized = sanitizeString(name, 20);
  return sanitized.length > 0 ? sanitized : 'Player';
}
