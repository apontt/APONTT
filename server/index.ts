import express, { type Request, Response, NextFunction } from "express";
import { config } from 'dotenv';
config();
import http from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { csrfProtection } from "./middleware/csrf";
import { apiLoggingMiddleware } from "./middleware/logging";
import { sanitizeForLog } from "./utils/sanitize";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Aplicar proteção CSRF
app.use(csrfProtection);

// Aplicar middleware de logging para APIs
app.use(apiLoggingMiddleware);

(async () => {
  // Note: registerRoutes should now only register routes, not create a server.
  await registerRoutes(app);

  interface ErrorWithStatus extends Error {
    status?: number;
    statusCode?: number;
  }

  app.use((err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Sanitizar mensagem de erro para logs
    log(sanitizeForLog(`Error ${status}: ${message}`));
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  
  log(`🔧 Configurando servidor em modo: ${isDevelopment ? 'desenvolvimento' : 'produção'}`);
  
  if (isDevelopment) {
    log('🔧 Modo desenvolvimento - configurando Vite...');
    await setupVite(app, server);
  } else {
    try {
      log('📦 Modo produção - servindo arquivos estáticos...');
      serveStatic(app);
    } catch (error) {
      log('⚠️ Arquivos de build não encontrados, usando modo desenvolvimento...');
      await setupVite(app, server);
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
