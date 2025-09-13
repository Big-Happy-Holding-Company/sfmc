/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-13
 * PURPOSE: Unified caching solution for all services. Eliminates duplicate cache implementations
 * across arcDataService, arcExplainerAPI, officerArcAPI, and puzzlePerformanceService.
 * SRP and DRY check: Pass - Single responsibility (caching), no duplication
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  onEvict?: (key: string, value: any) => void; // Callback when entry is evicted
}

/**
 * Generic cache manager with TTL support and memory management
 * Single source of truth for all caching needs in the application
 */
export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly ttl: number;
  private readonly maxSize: number;
  private readonly onEvict?: (key: string, value: T) => void;
  private accessOrder: string[] = []; // LRU tracking

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
    this.maxSize = options.maxSize || 100; // Default 100 entries
    this.onEvict = options.onEvict;
  }

  /**
   * Get value from cache if valid
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Update access tracking for LRU
    this.updateAccessOrder(key);
    entry.hits++;

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Check size limit and evict if necessary
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      hits: 0
    });

    this.updateAccessOrder(key);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.data);
    }

    // Remove from access order tracking
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.data);
      });
    }
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const validEntries = Array.from(this.cache.entries()).filter(
      ([_, entry]) => !this.isExpired(entry)
    );

    return {
      size: this.cache.size,
      validEntries: validEntries.length,
      maxSize: this.maxSize,
      ttl: this.ttl,
      oldestEntry: this.accessOrder[0] || null,
      newestEntry: this.accessOrder[this.accessOrder.length - 1] || null,
      totalHits: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0)
    };
  }

  /**
   * Get all valid entries (for debugging)
   */
  entries(): Array<[string, T]> {
    const validEntries: Array<[string, T]> = [];

    this.cache.forEach((entry, key) => {
      if (!this.isExpired(entry)) {
        validEntries.push([key, entry.data]);
      }
    });

    return validEntries;
  }

  /**
   * Batch get operation
   */
  getMany(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();

    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    });

    return results;
  }

  /**
   * Batch set operation
   */
  setMany(entries: Array<[string, T]>): void {
    entries.forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Private: Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Private: Update LRU access order
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Private: Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.delete(lruKey);
      console.log(`Cache evicted LRU entry: ${lruKey}`);
    }
  }

  /**
   * Create a cache key from multiple parts
   */
  static createKey(...parts: any[]): string {
    return parts.map(p =>
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':');
  }
}

// Singleton instances for common use cases
export const puzzleCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes for puzzle data
  maxSize: 200
});

export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes for API responses
  maxSize: 100
});

export const metadataCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes for metadata
  maxSize: 50
});