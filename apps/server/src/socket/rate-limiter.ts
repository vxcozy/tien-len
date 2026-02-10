/** Simple token bucket rate limiter per socket */
export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
  }

  /** Returns true if the action is allowed, false if rate limited */
  consume(key: string, cost = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }

    return false;
  }

  /** Remove a key (e.g., when socket disconnects) */
  remove(key: string): void {
    this.buckets.delete(key);
  }
}

// Shared rate limiters
export const gameActionLimiter = new RateLimiter(5, 5); // 5 actions/sec
export const chatLimiter = new RateLimiter(3, 0.6); // 3 messages per 5 sec
export const joinLimiter = new RateLimiter(5, 0.2); // 5 attempts per 25 sec (anti brute-force)
