/**
 * Simple in-memory rate limiter for API endpoints
 * Uses a map to track request counts per identifier (IP, userId, etc.)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
}

interface RateLimitResult {
  isRateLimited: boolean;
  remaining: number;
  resetTime?: number;
}

// Simple in-memory cache using Map
class RateLimitCache {
  private cache = new Map<string, RateLimitEntry>();

  set(key: string, ttl: number): RateLimitEntry {
    const entry: RateLimitEntry = {
      count: 0,
      resetTime: Date.now() + ttl,
    };
    this.cache.set(key, entry);
    return entry;
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Clean up expired entries
    if (Date.now() > entry.resetTime) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  increment(key: string, ttl: number): RateLimitEntry {
    let entry = this.get(key);
    if (!entry) {
      entry = this.set(key, ttl);
    }
    entry.count++;
    return entry;
  }
}

const cache = new RateLimitCache();

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (limit: number, identifier: string): RateLimitResult => {
      const entry = cache.increment(identifier, options.interval);

      // Reset if interval has passed
      if (Date.now() > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = Date.now() + options.interval;
      }

      const isRateLimited = entry.count >= limit;
      const remaining = Math.max(0, limit - entry.count);

      return {
        isRateLimited,
        remaining,
        resetTime: entry.resetTime,
      };
    },

    // Allow manual reset (e.g., for testing)
    reset: (identifier: string) => {
      cache.get(identifier); // Will trigger cleanup if expired
    },
  };
}
