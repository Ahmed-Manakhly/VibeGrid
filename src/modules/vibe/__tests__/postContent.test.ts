import { PostContentValueObject } from '../domain/PostContentValueObject';

describe('PostContentValueObject Domain Unit Tests', () => {
  it('should parse plain text content without a code block', () => {
    const raw = 'Hello VibeGrid developers!';
    const parsed = PostContentValueObject.parse(raw);

    expect(parsed.text).toBe('Hello VibeGrid developers!');
    expect(parsed.codeBlock).toBeUndefined();
  });

  it('should parse Markdown-fenced code block with specified language', () => {
    const raw = 'Check out this function:\n\n```typescript\nexport function test() { return 42; }\n```';
    const parsed = PostContentValueObject.parse(raw);

    expect(parsed.text).toBe('Check out this function:');
    expect(parsed.codeBlock).toBeDefined();
    expect(parsed.codeBlock?.language).toBe('typescript');
    expect(parsed.codeBlock?.code).toBe('export function test() { return 42; }');
  });

  it('should normalize language aliases like ts, py, sh, c++', () => {
    const rawTs = '```ts\nconst x: number = 1;\n```';
    const rawPy = '```py\ndef foo(): pass\n```';

    expect(PostContentValueObject.parse(rawTs).codeBlock?.language).toBe('typescript');
    expect(PostContentValueObject.parse(rawPy).codeBlock?.language).toBe('python');
  });

  it('should fallback to plaintext when an unknown language tag is supplied', () => {
    const raw = '```unknownlang\nsome raw data\n```';
    const parsed = PostContentValueObject.parse(raw);

    expect(parsed.codeBlock?.language).toBe('plaintext');
    expect(parsed.codeBlock?.code).toBe('some raw data');
  });

  it('should safely retain HTML / script markup in code blocks without executing or corrupting text', () => {
    const maliciousCode = '```html\n<script>alert("XSS")</script>\n<img src=x onerror=alert(1)>\n```';
    const parsed = PostContentValueObject.parse(maliciousCode);

    expect(parsed.codeBlock?.language).toBe('html');
    expect(parsed.codeBlock?.code).toContain('<script>alert("XSS")</script>');
    expect(parsed.codeBlock?.code).toContain('<img src=x onerror=alert(1)>');
  });

  it('should correctly format text and codeBlock into markdown fence string', () => {
    const formatted = PostContentValueObject.format('Here is python code:', {
      language: 'python',
      code: 'print("hello")',
    });

    expect(formatted).toBe('Here is python code:\n\n```python\nprint("hello")\n```');
  });
});
