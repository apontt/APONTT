import type { Request, Response, NextFunction } from 'express';
import { sanitizeForLog } from '../utils/sanitize';
import { log } from '../vite';

/**
 * Middleware de logging para rotas da API
 * Captura e registra informações de requisições e respostas
 */
export function apiLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply this special logging for API routes
  if (!req.path.startsWith("/api")) {
    return next();
  }

  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = (body: Record<string, any>) => {
    capturedJsonResponse = body;
    return originalResJson.call(res, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;

    let logLine = `${method} ${path} ${statusCode} in ${duration}ms`;

    if (capturedJsonResponse) {
      try {
        const jsonPayload = JSON.stringify(capturedJsonResponse);
        // Increased truncation limit for better debugging
        const MAX_PAYLOAD_LENGTH = 400;
        if (jsonPayload.length > MAX_PAYLOAD_LENGTH) {
          logLine += ` :: ${jsonPayload.substring(0, MAX_PAYLOAD_LENGTH)}…`;
        } else {
          logLine += ` :: ${jsonPayload}`;
        }
      } catch (error) {
        logLine += ` :: [JSON serialization error]`;
      }
    }

    log(sanitizeForLog(logLine));
  });

  next();
}