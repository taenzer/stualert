import express, { Express, Request, Response } from "express";
import path from "path";

export function createServer(): Express {
  const app = express();

  // Serve static files from public directory
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));

  // Serve index.html for all other routes (SPA routing)
  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  return app;
}

export function startServer(server: Express, port: number): void {
  server.listen(port, () => {
    console.log(`✅ HTTP Server running on http://localhost:${port}`);
  });
}
