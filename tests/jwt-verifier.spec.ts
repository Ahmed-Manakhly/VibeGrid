import { verifyAccessTokenRS256 } from '../src/lib/auth/jwt.verifier';

describe('verifyAccessTokenRS256', () => {
  it('should return null for malformed or invalid JWT tokens', async () => {
    const result = await verifyAccessTokenRS256('invalid.jwt.token');
    expect(result).toBeNull();
  });
});
