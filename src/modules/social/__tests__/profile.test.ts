import { DeveloperLinksValueObject } from '../domain/DeveloperLinksValueObject';
import { TechStackValueObject } from '../domain/TechStackValueObject';
import { ProfileRules } from '../domain/ProfileRules';

describe('Developer Profile Domain Value Objects & Rules', () => {
  describe('TechStackValueObject', () => {
    it('should parse and deduplicate technology entries', () => {
      const raw = ['TypeScript', 'React', 'typescript', '  Node.js  '];
      const parsed = TechStackValueObject.parse(raw);
      expect(parsed).toEqual(['TypeScript', 'React', 'Node.js']);
    });

    it('should parse JSON string representations', () => {
      const jsonStr = JSON.stringify(['Docker', 'Kubernetes', 'PostgreSQL']);
      const parsed = TechStackValueObject.parse(jsonStr);
      expect(parsed).toEqual(['Docker', 'Kubernetes', 'PostgreSQL']);
    });

    it('should handle empty or null values gracefully', () => {
      expect(TechStackValueObject.parse(null)).toEqual([]);
      expect(TechStackValueObject.parse(undefined)).toEqual([]);
      expect(TechStackValueObject.parse("invalid json")).toEqual([]);
    });
  });

  describe('DeveloperLinksValueObject', () => {
    it('should sanitize valid URLs and auto-detect developer platforms', () => {
      const rawLinks = [
        { type: 'github', url: 'https://github.com/developer' },
        { type: 'other', url: 'linkedin.com/in/dev' },
      ];

      const parsed = DeveloperLinksValueObject.parse(rawLinks);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toEqual({
        type: 'github',
        url: 'https://github.com/developer',
        label: undefined,
      });
      expect(parsed[1].type).toBe('linkedin');
      expect(parsed[1].url).toBe('https://linkedin.com/in/dev');
    });

    it('should reject dangerous URL schemes (javascript:, data:, vbscript:)', () => {
      const dangerous = [
        { type: 'website', url: 'javascript:alert(1)' },
        { type: 'website', url: 'data:text/html,<script>alert(1)</script>' },
        { type: 'website', url: 'vbscript:msgbox("xss")' },
      ];

      const parsed = DeveloperLinksValueObject.parse(dangerous);
      expect(parsed).toEqual([]);
    });

    it('should deduplicate links by normalized URL', () => {
      const raw = [
        { type: 'github', url: 'https://github.com/test' },
        { type: 'github', url: 'https://github.com/test/' },
      ];
      const parsed = DeveloperLinksValueObject.parse(raw);
      expect(parsed.length).toBe(1);
    });
  });

  describe('ProfileRules', () => {
    it('should check profile completion status', () => {
      expect(ProfileRules.isProfileComplete({ username: 'dev', name: 'Developer', bio: 'Full-stack builder' })).toBe(true);
      expect(ProfileRules.isProfileComplete({ username: 'user_123', name: '', bio: null })).toBe(false);
      expect(ProfileRules.isProfileComplete(null)).toBe(false);
    });
  });
});
