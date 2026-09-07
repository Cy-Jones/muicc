import { Router, RequestHandler, Request, Response, NextFunction } from 'express';

/**
 * Express 4 does not catch rejected promises returned by route handlers. Now
 * that every handler awaits the database, an unhandled rejection would leave
 * the request hanging until timeout instead of returning a 500.
 *
 * `asyncRouter()` returns a normal Router whose verb methods wrap each handler
 * so any rejection is forwarded to `next()`, and from there to the error
 * middleware registered in index.ts.
 *
 * Using a wrapped Router rather than wrapping call sites by hand means every
 * handler is covered automatically, including ones added later.
 */

const VERBS = ['get', 'post', 'put', 'delete', 'patch', 'all'] as const;

function wrap(handler: RequestHandler): RequestHandler {
  // Error-handling middleware takes four arguments and must not be wrapped.
  if (handler.length === 4) return handler;
  return function wrapped(req: Request, res: Response, next: NextFunction) {
    try {
      const result = (handler as any)(req, res, next);
      if (result && typeof result.then === 'function') {
        result.catch(next);
      }
      return result;
    } catch (err) {
      next(err);
    }
  };
}

export function asyncRouter(): Router {
  const router = Router();
  for (const verb of VERBS) {
    const original = (router as any)[verb].bind(router);
    (router as any)[verb] = (routePath: string, ...handlers: any[]) =>
      original(routePath, ...handlers.map(h => (typeof h === 'function' ? wrap(h) : h)));
  }
  return router;
}
