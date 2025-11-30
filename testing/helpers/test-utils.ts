/**
 * Test Utilities and Helper Functions
 */

/**
 * Create a mock Date.now() that returns a fixed timestamp
 */
export const mockDateNow = (timestamp: number) => {
  const originalDateNow = Date.now;
  Date.now = jest.fn(() => timestamp);
  return () => {
    Date.now = originalDateNow;
  };
};

/**
 * Wait for a promise to resolve/reject
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Assert that a function throws a specific error message
 */
export const expectToThrowAsync = async (
  fn: () => Promise<unknown>,
  expectedError: string | RegExp,
) => {
  await expect(fn()).rejects.toThrow(expectedError);
};

/**
 * Create a range of numbers for testing
 */
export const range = (start: number, end: number, step = 1): number[] => {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
};

/**
 * Deep clone an object for testing
 */
export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Create a spy that tracks calls without changing behavior
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSpy = <T extends (...args: any[]) => any>(
  fn: T,
): jest.MockedFunction<T> => {
  return jest.fn(fn);
};

/**
 * Assert approximate equality for floating-point numbers
 */
export const expectApproximately = (
  actual: number,
  expected: number,
  precision = 2,
) => {
  expect(actual).toBeCloseTo(expected, precision);
};

/**
 * Generate random test data
 */
export const random = {
  int: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min: number, max: number) => Math.random() * (max - min) + min,
  boolean: () => Math.random() > 0.5,
  string: (length = 10) =>
    Math.random()
      .toString(36)
      .substring(2, 2 + length),
  uuid: () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),
  countryCode: () => {
    const codes = ["TH", "US", "JP", "DE", "GB", "FR", "CN", "KR"];
    return codes[random.int(0, codes.length - 1)];
  },
};

/**
 * Create a builder pattern for test objects
 */
export class TestObjectBuilder<T> {
  private obj: Partial<T> = {};

  constructor(private defaults: T) {
    this.obj = { ...defaults };
  }

  with(key: keyof T, value: T[keyof T]): this {
    this.obj[key] = value;
    return this;
  }

  build(): T {
    return { ...this.defaults, ...this.obj } as T;
  }
}

/**
 * Batch test runner for parameterized tests
 */
export const testCases = <T, R = unknown>(
  cases: Array<{ description: string; input: T; expected: R }>,
  testFn: (input: T) => R,
) => {
  cases.forEach(({ description, input, expected }) => {
    it(description, () => {
      const result = testFn(input);
      expect(result).toEqual(expected);
    });
  });
};
