import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../auth.js';

describe('auth service', () => {
  describe('hashPassword / verifyPassword', () => {
    it('should hash a password and verify it', () => {
      const hash = hashPassword('test-password');
      expect(hash).not.toBe('test-password');
      expect(verifyPassword('test-password', hash)).toBe(true);
    });

    it('should reject wrong password', () => {
      const hash = hashPassword('correct-password');
      expect(verifyPassword('wrong-password', hash)).toBe(false);
    });

    it('should produce different hashes for same password', () => {
      const hash1 = hashPassword('same-password');
      const hash2 = hashPassword('same-password');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateToken / verifyToken', () => {
    it('should generate a valid JWT and verify it', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('should throw on tampered token', () => {
      const token = generateToken({ userId: 'user-1', email: 'a@b.com' });
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered)).toThrow();
    });
  });
});
