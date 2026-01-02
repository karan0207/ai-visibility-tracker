import { cn } from '@/lib/utils';

describe('cn utility - extended coverage', () => {
  describe('basic string merging', () => {
    it('handles single class', () => {
      expect(cn('single')).toBe('single');
    });

    it('handles multiple classes', () => {
      expect(cn('one', 'two', 'three')).toBe('one two three');
    });

    it('handles empty string', () => {
      expect(cn('')).toBe('');
    });

    it('handles only empty strings', () => {
      expect(cn('', '', '')).toBe('');
    });

    it('handles mixed empty and valid strings', () => {
      expect(cn('valid', '', 'another')).toBe('valid another');
    });
  });

  describe('falsy value handling', () => {
    it('skips undefined', () => {
      expect(cn('a', undefined, 'b')).toBe('a b');
    });

    it('skips null', () => {
      expect(cn('a', null, 'b')).toBe('a b');
    });

    it('skips false', () => {
      expect(cn('a', false, 'b')).toBe('a b');
    });

    it('filters out zero as falsy', () => {
      // clsx treats 0 as falsy and filters it out
      expect(cn('a', 0, 'b')).toBe('a b');
    });

    it('handles all falsy values', () => {
      expect(cn(undefined, null, false, '', 'valid')).toBe('valid');
    });
  });

  describe('conditional classes with objects', () => {
    it('includes truthy object values', () => {
      expect(cn({ active: true, disabled: false })).toBe('active');
    });

    it('handles all true conditions', () => {
      expect(cn({ a: true, b: true, c: true })).toBe('a b c');
    });

    it('handles all false conditions', () => {
      expect(cn({ a: false, b: false })).toBe('');
    });

    it('combines strings and objects', () => {
      expect(cn('base', { active: true, hidden: false })).toBe('base active');
    });

    it('handles complex conditions', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('btn', { 'btn-active': isActive, 'btn-disabled': isDisabled })).toBe('btn btn-active');
    });
  });

  describe('array handling', () => {
    it('handles simple arrays', () => {
      expect(cn(['a', 'b', 'c'])).toBe('a b c');
    });

    it('handles nested arrays', () => {
      expect(cn(['a', ['b', 'c']])).toBe('a b c');
    });

    it('handles mixed arrays and strings', () => {
      expect(cn('prefix', ['middle'], 'suffix')).toBe('prefix middle suffix');
    });

    it('handles arrays with falsy values', () => {
      expect(cn(['a', null, 'b', undefined, 'c'])).toBe('a b c');
    });
  });

  describe('Tailwind class merging', () => {
    it('merges conflicting padding classes', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('merges conflicting margin classes', () => {
      expect(cn('mt-2', 'mt-4')).toBe('mt-4');
    });

    it('keeps non-conflicting utility classes', () => {
      expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
    });

    it('merges conflicting text colors', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('merges conflicting background colors', () => {
      expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100');
    });

    it('handles responsive variants', () => {
      expect(cn('md:px-2', 'md:px-4')).toBe('md:px-4');
    });

    it('keeps different responsive variants', () => {
      expect(cn('sm:px-2', 'md:px-4')).toBe('sm:px-2 md:px-4');
    });

    it('handles state variants', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
    });

    it('merges conflicting flex classes', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });

    it('merges conflicting display classes', () => {
      expect(cn('block', 'inline-block')).toBe('inline-block');
    });
  });

  describe('complex combinations', () => {
    it('handles real-world button example', () => {
      const baseClasses = 'px-4 py-2 rounded font-medium';
      const variantClasses = 'bg-blue-500 text-white';
      const conditionalClasses = { 'opacity-50 cursor-not-allowed': false, 'hover:bg-blue-600': true };
      
      const result = cn(baseClasses, variantClasses, conditionalClasses);
      expect(result).toContain('px-4');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).not.toContain('opacity-50');
    });

    it('handles card component example', () => {
      const result = cn(
        'rounded-lg shadow-md',
        'bg-white dark:bg-gray-800',
        { 'border-2 border-blue-500': true }
      );
      expect(result).toContain('rounded-lg');
      expect(result).toContain('border-blue-500');
    });

    it('handles input field example', () => {
      const hasError = true;
      const result = cn(
        'w-full px-3 py-2 border rounded-md',
        hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
      );
      expect(result).toContain('border-red-500');
    });

    it('handles override pattern', () => {
      // Common pattern: base classes with overrides
      const baseButton = 'px-4 py-2 bg-gray-100 text-gray-800';
      const primaryOverride = 'bg-blue-500 text-white';
      
      const result = cn(baseButton, primaryOverride);
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).not.toContain('bg-gray-100');
      expect(result).not.toContain('text-gray-800');
    });
  });

  describe('edge cases', () => {
    it('handles no arguments', () => {
      expect(cn()).toBe('');
    });

    it('handles whitespace in class names', () => {
      // Note: clsx and twMerge handle whitespace normalization
      const result = cn('  spaced  ');
      expect(result.trim()).toBe('spaced');
    });

    it('handles duplicate classes', () => {
      // twMerge only deduplicates conflicting Tailwind utilities, not arbitrary classes
      expect(cn('same', 'same', 'same')).toBe('same same same');
    });

    it('handles very long class lists', () => {
      const classes = Array.from({ length: 50 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result.split(' ').length).toBe(50);
    });
  });
});
