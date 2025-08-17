/**
 * Utility Function Tests
 * Test the cn utility for class name concatenation
 */

import { cn } from '@/utils/cn';

describe('cn utility function', () => {
  it('should concatenate class names correctly', () => {
    const result = cn('base-class', 'additional-class');
    expect(result).toContain('base-class');
    expect(result).toContain('additional-class');
  });

  it('should handle conditional class names', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should filter out falsy values', () => {
    const result = cn(
      'base-class',
      false && 'hidden-class',
      null,
      undefined,
      ''
    );
    expect(result).toContain('base-class');
    expect(result).not.toContain('hidden-class');
  });

  it('should work with arrays', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });
});
