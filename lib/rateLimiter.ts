// Simple in-memory rate limiter (Token Bucket)
// Note: In a serverless environment (Vercel), this memory is not shared between lambdas.
// For strict global rate limiting, use Redis (Upstash) or a DB.
// But for a simple MVP "per container" + IP check, this helps reduce abuse.

type RateLimitEntry = {
    tokens: number;
    lastRefill: number;
};

// Map of IP -> Entry
const limits = new Map<string, RateLimitEntry>();

const MAX_TOKENS = 20; // burst
const REFILL_RATE_MS = 60 * 1000; // time to refill full bucket (roughly) -> logic below is simpler: 1 min window
// Actually, let's use a standard fixed window or sliding window for simplicity in this MVP.
// Let's implement a simple "X requests per minute" per IP.

const WINDOW_MS = 60 * 1000; // 1 minute
const LIMIT_PER_WINDOW = 20;

export async function checkRateLimit(ip: string): Promise<boolean> {
    const now = Date.now();
    const record = limits.get(ip);

    if (!record) {
        limits.set(ip, { tokens: 1, lastRefill: now });
        return true;
    }

    // If window passed, reset
    if (now - record.lastRefill > WINDOW_MS) {
        record.tokens = 1;
        record.lastRefill = now;
        return true;
    }

    // Check limit
    if (record.tokens >= LIMIT_PER_WINDOW) {
        return false;
    }

    record.tokens += 1;
    return true;
}
