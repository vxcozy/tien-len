// Alphabet without ambiguous characters (0/O, 1/I/l)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generate a random room code */
export function generateRoomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
