import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { createApp } from "./app";
import { ensureSeedAdmin } from "../db";
import { serveStatic, setupVite } from "../_core/vite";
import { errorHandler, notFoundHandler } from "./shared/utils/http";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.listen(port, () => probe.close(() => resolve(true)));
    probe.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export async function startServer() {
  const app = createApp();
  const server = createServer(app);
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  await ensureSeedAdmin();
  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
  return server;
}

startServer().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
