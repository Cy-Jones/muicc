import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

/**
 * Creates an Express middleware that caches GET responses in-memory for a given TTL in seconds.
 * Automatically bypassed for non-GET requests.
 */
export function memoryCache(ttlSeconds: number, keyPrefix = '') {
  const ttlMs = ttlSeconds * 1000;

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${keyPrefix || req.baseUrl || ''}:${req.originalUrl || req.url}`;
    const now = Date.now();
    const hit = store.get(key);

    if (hit && hit.expiresAt > now) {
      // Set HTTP cache headers indicating cache hit
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${Math.floor((hit.expiresAt - now) / 1000)}`);
      return res.json(hit.data);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful 200 responses
      if (res.statusCode === 200 && body !== undefined && body !== null) {
        store.set(key, {
          data: body,
          expiresAt: Date.now() + ttlMs
        });
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cached entries. If prefix is provided, clears entries starting with prefix;
 * otherwise clears the entire cache.
 */
export function clearCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      store.delete(key);
    }
  }
}
