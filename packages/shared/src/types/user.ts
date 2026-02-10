export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  isAnonymous: boolean;
}

export interface AuthPayload {
  sub: string;
  name: string;
  type: 'anonymous' | 'registered';
  iat: number;
  exp: number;
}
