import express from "express";
import { registerStorageProxy } from "../_core/storageProxy";
import { routes } from "./routes";
import { errorHandler } from "./shared/utils/http";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  app.use("/api", routes);
  app.use(errorHandler);
  return app;
}
