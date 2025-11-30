/**
 * Redis Client Mock
 * Provides in-memory implementation for testing
 */

export class RedisMock {
  private store: Map<string, string> = new Map();
  private connected: boolean = false;

  async connect() {
    this.connected = true;
    return this;
  }

  async quit() {
    this.connected = false;
    this.store.clear();
  }

  async disconnect() {
    return this.quit();
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, value);
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async incrBy(key: string, amount: number): Promise<number> {
    const current = parseInt(this.store.get(key) || "0", 10);
    const newValue = current + amount;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async decrBy(key: string, amount: number): Promise<number> {
    const current = parseInt(this.store.get(key) || "0", 10);
    const newValue = Math.max(0, current - amount);
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async mGet(keys: string[]): Promise<(string | null)[]> {
    return keys.map((key) => this.store.get(key) || null);
  }

  async scan(
    cursor: string | number,
    options?: { MATCH?: string; COUNT?: number },
  ): Promise<{ cursor: number; keys: string[] }> {
    const allKeys = Array.from(this.store.keys());
    const pattern = options?.MATCH || "*";
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    const matchedKeys = allKeys.filter((key) => regex.test(key));

    return {
      cursor: 0,
      keys: matchedKeys,
    };
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async flushAll(): Promise<string> {
    this.store.clear();
    return "OK";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void) {
    if (event === "connect") {
      setTimeout(() => callback(), 0);
    }
    return this;
  }

  // Helper for tests
  getStore() {
    return this.store;
  }

  isConnected() {
    return this.connected;
  }
}

export const createMockRedisClient = () => new RedisMock();
