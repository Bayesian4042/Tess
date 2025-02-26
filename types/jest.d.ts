/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toMatchObject(expected: any): R;
      toContain(expected: string): R;
      toBeInstanceOf(expected: any): R;
    }
  }
}

declare module 'expect' {
  interface Matchers<R> {
    toBe(expected: any): R;
    toMatchObject(expected: any): R;
    toContain(expected: string): R;
    toBeInstanceOf(expected: any): R;
  }

  interface Expect extends Matchers<void> {
    arrayContaining(sample: Array<unknown>): unknown[];
    any(constructor: unknown): unknown;
  }

  interface AsymmetricMatchers {
    arrayContaining(sample: Array<unknown>): unknown[];
    any(constructor: unknown): unknown;
  }
}

export {};
