/**
 * LB Fresh App - Storage Service
 * Abstract storage interface for in-memory and persistent key-value pairs.
 */

class StorageService {
  private memoryStore: Map<string, string> = new Map();

  /**
   * Store a string item by key
   */
  public async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);
  }

  /**
   * Retrieve a string item by key
   */
  public async getItem(key: string): Promise<string | null> {
    return this.memoryStore.get(key) ?? null;
  }

  /**
   * Store an object/array serialized as JSON
   */
  public async setObject<T>(key: string, value: T): Promise<void> {
    this.memoryStore.set(key, JSON.stringify(value));
  }

  /**
   * Retrieve and deserialize a JSON object
   */
  public async getObject<T>(key: string): Promise<T | null> {
    const raw = this.memoryStore.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Remove an item by key
   */
  public async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Clear all storage data
   */
  public async clear(): Promise<void> {
    this.memoryStore.clear();
  }
}

export const storageService = new StorageService();
