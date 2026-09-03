import { ProfileBootstrapService } from '../src/modules/social/application/ProfileBootstrapService';

describe('ProfileBootstrapService', () => {
  it('should sanitize email or name into a valid username candidate', () => {
    const u1 = ProfileBootstrapService.generateUsernameCandidate('test.user@example.com', 'Test User! #2026');
    expect(u1).toBe('test_user_2026');

    const u2 = ProfileBootstrapService.generateUsernameCandidate('alex.rivera+vibes@domain.org');
    expect(u2).toBe('alex_rivera_vibes');
  });

  it('should resolve unique username collisions by appending numerical suffixes', async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn()
          .mockResolvedValueOnce({ id: 'existing_usr_1' })
          .mockResolvedValueOnce(null),
      },
    };

    const unique = await ProfileBootstrapService.resolveUniqueUsername(mockPrisma, 'alex_rivera', 'new_usr_2');
    expect(unique).toBe('alex_rivera_1');
  });
});
