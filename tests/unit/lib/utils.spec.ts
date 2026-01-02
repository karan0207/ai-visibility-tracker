import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips falsy values', () => {
    expect(cn('base', undefined, null, 'final')).toBe('base final');
  });

  it('merges Tailwind modifiers', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('supports arrays and objects', () => {
    expect(cn(['foo', 'bar'], { baz: true, qux: false })).toContain('foo');
  });
});
