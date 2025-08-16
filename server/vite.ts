import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import express from "express";

const clientRoot = path.resolve(process.cwd(), "client");

import { sanitizeForLog } from "./utils/sanitize";

export const log = (msg: string) => {
  console.log(`[vite] ${sanitizeForLog(msg)}`);
};

export const setupVite = async (app: Express, server: Server) => {
  const vite = await createViteServer({
    root: clientRoot,
    server: {
      middlewareMode: true,
      hmr: {
        server,
      },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Serve index.html for all routes (SPA fallback)
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.originalUrl;
      const indexHtmlPath = path.resolve(clientRoot, "index.html");
      let template = await fs.promises.readFile(indexHtmlPath, "utf-8");
      const html = await vite.transformIndexHtml(url, template);
      // HTML já é sanitizado pelo Vite
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (vite && typeof vite.ssrFixStacktrace === "function") {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });
};

export const serveStatic = (app: Express) => {
  const distPath = path.resolve(clientRoot, "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Build directory not found: ${distPath}. Run 'npm run build' in the client folder first.`
    );
  }

  app.use(express.static(distPath));

  // SPA fallback
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
};